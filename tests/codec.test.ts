import { encode, decode } from '../src/codec';
import { Value } from '../src/types';
import { describe, it, expect } from '@jest/globals';

describe('JAM Codec', () => {
    describe('encode/decode', () => {
        it('should handle null values', () => {
            const value: Value = null;
            const encoded = encode(value);
            const decoded = decode(encoded);
            expect(decoded).toBeNull();
        });

        it('should handle boolean values', () => {
            const value: Value = true;
            const encoded = encode(value);
            const decoded = decode(encoded);
            expect(decoded).toBe(true);

            const value2: Value = false;
            const encoded2 = encode(value2);
            const decoded2 = decode(encoded2);
            expect(decoded2).toBe(false);
        });

        it('should handle integer values', () => {
            const testCases: Value[] = [
                0,
                42,
                255,
                65535,
                16777215,
                -1,
                -42,
                -255,
                Number.MAX_SAFE_INTEGER,
                Number.MIN_SAFE_INTEGER
            ];

            for (const value of testCases) {
                const encoded = encode(value);
                const decoded = decode(encoded);
                expect(decoded).toBe(value);
            }
        });

        it('should handle float values', () => {
            const testCases: Value[] = [
                3.14159,
                -2.71828,
                0.0,
                Number.MAX_SAFE_INTEGER,
                Number.MIN_SAFE_INTEGER
            ];

            for (const value of testCases) {
                const encoded = encode(value);
                const decoded = decode(encoded);
                expect(decoded).toBeCloseTo(value as number);
            }
        });

        it('should handle string values', () => {
            const testCases: Value[] = [
                '',
                'Hello, World!',
                'Special chars: !@#$%^&*()',
                'Unicode: 你好，世界！',
                'Emoji: 👋🌍'
            ];

            for (const value of testCases) {
                const encoded = encode(value);
                const decoded = decode(encoded);
                expect(decoded).toBe(value);
            }
        });

        it('should handle Uint8Array values', () => {
            const testCases: Value[] = [
                new Uint8Array([]),
                new Uint8Array([1, 2, 3, 4, 5]),
                new Uint8Array([255, 0, 128, 64, 32])
            ];

            for (const value of testCases) {
                const encoded = encode(value);
                const decoded = decode(encoded);
                expect(decoded).toEqual(value);
            }
        });

        it('should handle array values', () => {
            const testCases: Value[] = [
                [],
                [1, 2, 3],
                ['a', 'b', 'c'],
                [true, false, null],
                [1, 'two', true, null, [1, 2, 3]]
            ];

            for (const value of testCases) {
                const encoded = encode(value);
                const decoded = decode(encoded);
                expect(decoded).toEqual(value);
            }
        });

        it('should handle object values', () => {
            const testCases: Value[] = [
                {},
                { a: 1, b: 2, c: 3 },
                { name: 'John', age: 30, active: true },
                { nested: { a: 1, b: 2 } },
                { array: [1, 2, 3], obj: { x: 10, y: 20 } }
            ];

            for (const value of testCases) {
                const encoded = encode(value);
                const decoded = decode(encoded);
                expect(decoded).toEqual(value);
            }
        });

        it('should handle complex nested structures', () => {
            const complex: Value = {
                name: 'Test',
                numbers: [1, 2, 3, 4, 5],
                nested: {
                    bool: true,
                    null: null,
                    array: [
                        { x: 1, y: 2 },
                        { x: 3, y: 4 }
                    ]
                },
                binary: new Uint8Array([1, 2, 3, 4, 5])
            };

            const encoded = encode(complex);
            const decoded = decode(encoded);
            expect(decoded).toEqual(complex);
        });

        it('should throw error for invalid input', () => {
            const invalidInput = new Uint8Array([0xFF]); // Invalid tag
            expect(() => decode(invalidInput)).toThrow('Unknown tag');
        });

        it('should throw error for trailing data', () => {
            const validData = encode(42);
            const invalidData = new Uint8Array([...validData, 0]);
            expect(() => decode(invalidData)).toThrow('Unexpected trailing data');
        });
    });
}); 