import { encode, decode } from '../src/codec';
import { EnumType } from '../src/types';

describe('Simple Codec Tests', () => {
    describe('EnumType encoding/decoding', () => {
        it('should encode/decode variant A', () => {
            const a: EnumType = { type: 'A' };
            const encoded = encode(a);
            expect(encoded).toEqual(new Uint8Array([0x08, 0x0f])); // TAG_ENUM + 15 in hex

            const decoded = decode(encoded) as EnumType;
            expect(decoded).toEqual(a);
        });

        it('should encode/decode variant B', () => {
            const b: EnumType = { type: 'B', value: [1, 2] };
            const encoded = encode(b);
            expect(encoded).toEqual(new Uint8Array([
                0x08, // TAG_ENUM
                0x01, // variant index
                0x01, 0x00, 0x00, 0x00, // u32: 1
                0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // u64: 2
            ]));

            const decoded = decode(encoded) as EnumType;
            expect(decoded).toEqual(b);
        });

        it('should encode/decode variant C', () => {
            const c: EnumType = { type: 'C', value: { a: 1, b: 2 } };
            const encoded = encode(c);
            expect(encoded).toEqual(new Uint8Array([
                0x08, // TAG_ENUM
                0x02, // variant index
                0x01, 0x00, 0x00, 0x00, // u32: 1
                0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // u64: 2
            ]));

            const decoded = decode(encoded) as EnumType;
            expect(decoded).toEqual(c);
        });

        it('should fail to decode invalid variant', () => {
            const invalidData = new Uint8Array([0x08, 0x00]); // TAG_ENUM + invalid variant index
            expect(() => decode(invalidData)).toThrow('Unknown enum variant index: 0');
        });
    });
});
