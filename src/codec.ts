import { Value, EnumType } from './types';

const TAG_NULL = 0x00;
const TAG_BOOL = 0x01;
const TAG_INT = 0x02;
const TAG_FLOAT = 0x03;
const TAG_STRING = 0x04;
const TAG_BYTES = 0x05;
const TAG_ARRAY = 0x06;
const TAG_OBJECT = 0x07;
const TAG_ENUM = 0x08;

// ZigZag encode signed integer to unsigned
function zigzagEncode(n: number): bigint {
    const bigN = BigInt(n);
    return (bigN << 1n) ^ (bigN >> 63n);
}

// ZigZag decode unsigned integer to signed
function zigzagDecode(n: bigint): number {
    return Number((n >> 1n) ^ (-(n & 1n)));
}

/**
 * Write a variable-length integer to the output buffer (BigInt version)
 */
function writeVar(value: number, output: Uint8Array, offset: number): number {
    let n = zigzagEncode(value);
    let start = offset;
    // Write 7 bits at a time, MSB is continuation bit
    while (n >= 0x80n) {
        output[offset++] = Number((n & 0x7fn) | 0x80n);
        n >>= 7n;
    }
    output[offset++] = Number(n);
    return offset;
}

/**
 * Read a variable-length integer from the input buffer (BigInt version)
 */
function readVar(input: Uint8Array, offset: number): [number, number] {
    let n = 0n;
    let shift = 0n;
    let b;
    let pos = offset;
    do {
        b = BigInt(input[pos++]);
        n |= (b & 0x7fn) << shift;
        shift += 7n;
    } while (b & 0x80n);
    return [zigzagDecode(n), pos];
}

/**
 * Encode a value to binary format
 */
export function encode(value: Value | EnumType): Uint8Array {
    const encoder = new TextEncoder();
    let buffer = new Uint8Array(4096);
    let offset = 0;

    function ensureBuffer(size: number) {
        if (offset + size > buffer.length) {
            const newBuffer = new Uint8Array(buffer.length * 2 + size);
            newBuffer.set(buffer);
            buffer = newBuffer;
        }
    }

    function encodeValue(val: Value | EnumType, offset: number): number {
        ensureBuffer(16);
        
        // Handle EnumType
        if (typeof val === 'object' && val !== null && 'type' in val) {
            const enumVal = val as EnumType;
            buffer[offset] = TAG_ENUM;
            offset++;

            switch (enumVal.type) {
                case 'A':
                    buffer[offset] = 15; // index = 15
                    return offset + 1;
                case 'B': {
                    const [a, b] = enumVal.value;
                    buffer[offset] = 1; // variant index
                    offset++;
                    // Encode u32
                    const view = new DataView(buffer.buffer, buffer.byteOffset);
                    view.setUint32(offset, a, true);
                    offset += 4;
                    // Encode u64
                    view.setBigUint64(offset, BigInt(b), true);
                    return offset + 8;
                }
                case 'C': {
                    const { a, b } = enumVal.value;
                    buffer[offset] = 2; // variant index
                    offset++;
                    // Encode u32
                    const view = new DataView(buffer.buffer, buffer.byteOffset);
                    view.setUint32(offset, a, true);
                    offset += 4;
                    // Encode u64
                    view.setBigUint64(offset, BigInt(b), true);
                    return offset + 8;
                }
            }
        }

        // Handle regular Value types
        if (val === null) {
            buffer[offset] = TAG_NULL;
            return offset + 1;
        }
        if (typeof val === 'boolean') {
            buffer[offset] = TAG_BOOL;
            buffer[offset + 1] = val ? 1 : 0;
            return offset + 2;
        }
        if (typeof val === 'number') {
            if (Number.isInteger(val)) {
                buffer[offset] = TAG_INT;
                return writeVar(val, buffer, offset + 1);
            } else {
                buffer[offset] = TAG_FLOAT;
                ensureBuffer(8);
                const view = new DataView(buffer.buffer, buffer.byteOffset);
                view.setFloat64(offset + 1, val, true); // little-endian
                return offset + 9;
            }
        }
        if (typeof val === 'string') {
            const bytes = encoder.encode(val);
            buffer[offset] = TAG_STRING;
            let next = writeVar(bytes.length, buffer, offset + 1);
            ensureBuffer(bytes.length);
            buffer.set(bytes, next);
            return next + bytes.length;
        }
        if (val instanceof Uint8Array) {
            buffer[offset] = TAG_BYTES;
            let next = writeVar(val.length, buffer, offset + 1);
            ensureBuffer(val.length);
            buffer.set(val, next);
            return next + val.length;
        }
        if (Array.isArray(val)) {
            buffer[offset] = TAG_ARRAY;
            let next = writeVar(val.length, buffer, offset + 1);
            for (const item of val) {
                next = encodeValue(item, next);
            }
            return next;
        }
        if (typeof val === 'object') {
            const keys = Object.keys(val);
            buffer[offset] = TAG_OBJECT;
            let next = writeVar(keys.length, buffer, offset + 1);
            for (const key of keys) {
                const keyBytes = encoder.encode(key);
                next = writeVar(keyBytes.length, buffer, next);
                ensureBuffer(keyBytes.length);
                buffer.set(keyBytes, next);
                next += keyBytes.length;
                next = encodeValue((val as any)[key], next);
            }
            return next;
        }
        throw new Error(`Unsupported value type: ${typeof val}`);
    }

    offset = encodeValue(value, offset);
    return buffer.slice(0, offset);
}

/**
 * Decode a binary format to value
 */
export function decode(input: Uint8Array): Value | EnumType {
    const decoder = new TextDecoder();
    function decodeValue(offset: number): [Value | EnumType, number] {
        const tag = input[offset++];
        switch (tag) {
            case TAG_ENUM: {
                const variantIndex = input[offset++];
                switch (variantIndex) {
                    case 15:
                        return [{ type: 'A' }, offset];
                    case 1: {
                        const view = new DataView(input.buffer, input.byteOffset);
                        const a = view.getUint32(offset, true);
                        offset += 4;
                        const b = Number(view.getBigUint64(offset, true));
                        offset += 8;
                        return [{ type: 'B', value: [a, b] }, offset];
                    }
                    case 2: {
                        const view = new DataView(input.buffer, input.byteOffset);
                        const a = view.getUint32(offset, true);
                        offset += 4;
                        const b = Number(view.getBigUint64(offset, true));
                        offset += 8;
                        return [{ type: 'C', value: { a, b } }, offset];
                    }
                    default:
                        throw new Error(`Unknown enum variant index: ${variantIndex}`);
                }
            }
            case TAG_NULL:
                return [null, offset];
            case TAG_BOOL:
                return [input[offset++] === 1, offset];
            case TAG_INT: {
                const [value, newOffset] = readVar(input, offset);
                return [value, newOffset];
            }
            case TAG_FLOAT: {
                const view = new DataView(input.buffer, input.byteOffset);
                const value = view.getFloat64(offset, true); // little-endian
                return [value, offset + 8];
            }
            case TAG_STRING: {
                const [length, newOffset] = readVar(input, offset);
                const value = decoder.decode(input.slice(newOffset, newOffset + length));
                return [value, newOffset + length];
            }
            case TAG_BYTES: {
                const [length, newOffset] = readVar(input, offset);
                const value = input.slice(newOffset, newOffset + length);
                return [value, newOffset + length];
            }
            case TAG_ARRAY: {
                const [length, newOffset] = readVar(input, offset);
                const array: Value[] = [];
                let currentOffset = newOffset;
                for (let i = 0; i < length; i++) {
                    const [value, nextOffset] = decodeValue(currentOffset);
                    array.push(value);
                    currentOffset = nextOffset;
                }
                return [array, currentOffset];
            }
            case TAG_OBJECT: {
                const [length, newOffset] = readVar(input, offset);
                const obj: { [key: string]: Value } = {};
                let currentOffset = newOffset;
                for (let i = 0; i < length; i++) {
                    const [keyLength, keyOffset] = readVar(input, currentOffset);
                    const key = decoder.decode(input.slice(keyOffset, keyOffset + keyLength));
                    const [value, valueOffset] = decodeValue(keyOffset + keyLength);
                    obj[key] = value;
                    currentOffset = valueOffset;
                }
                return [obj, currentOffset];
            }
            default:
                throw new Error(`Unknown tag: ${tag}`);
        }
    }
    const [value, finalOffset] = decodeValue(0);
    if (finalOffset !== input.length) {
        throw new Error('Unexpected trailing data');
    }
    return value;
} 