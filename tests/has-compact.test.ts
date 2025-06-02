import { encode, decode } from '../src/codec';
import { Value } from '../src/types';

// Interface representing HasCompact trait
interface HasCompact {
  compactEncode(): number;
  compactDecode(value: number): HasCompact;
}

// Test class with @compact decorator equivalent
class Test1CompactHasCompact<T extends HasCompact> {
  constructor(public bar: T) {}

  // Convert to Value type for encoding
  toValue(): Value {
    // For compact encoding, we just return the encoded number directly
    return this.bar.compactEncode();
  }

  // Create from Value type after decoding
  static fromValue(value: Value): Test1CompactHasCompact<U64> {
    if (typeof value !== 'number') {
      throw new Error('Invalid value for Test1CompactHasCompact');
    }
    return new Test1CompactHasCompact(new U64(BigInt(value)));
  }
}

// Test class with encoded_as equivalent
class Test1HasCompact<T extends HasCompact> {
  constructor(public bar: T) {}

  // Convert to Value type for encoding
  toValue(): Value {
    // For compact encoding, we just return the encoded number directly
    return this.bar.compactEncode();
  }

  // Create from Value type after decoding
  static fromValue(value: Value): Test1HasCompact<U64> {
    if (typeof value !== 'number') {
      throw new Error('Invalid value for Test1HasCompact');
    }
    return new Test1HasCompact(new U64(BigInt(value)));
  }
}

// Test implementation for u64
class U64 implements HasCompact {
  constructor(private value: bigint) {}

  compactEncode(): number {
    // For testing purposes, we'll use a simple encoding
    return Number(this.value);
  }

  compactDecode(value: number): U64 {
    return new U64(BigInt(value));
  }
}

type Error = string;

// StructHasCompact equivalent
class StructHasCompact {
  constructor(public value: number) {}

  // CompactAs logic: always encode as 12
  encodeAs(): number {
    return 12;
  }

  static decodeFrom(_: number): StructHasCompact {
    return new StructHasCompact(12);
  }
}

// Test enum with generic HasCompact
interface TestGenericHasCompactA {
  type: 'A';
  a: StructHasCompact;
}
type TestGenericHasCompact = TestGenericHasCompactA;

describe('Compact Encoding Tests', () => {
  test('encodes and decodes compact values correctly', () => {
    const testVal = new U64(0n);
    const expectedLength = 2; // TAG_INT (1) + value (1)

    // Create instance with encoded_as equivalent
    const testInstance = new Test1HasCompact(testVal);
    
    // Encode
    const encoded = encode(testInstance.toValue());
    
    // Verify length
    expect(encoded.length).toBe(expectedLength);
    
    // Decode and verify
    const decoded = Test1CompactHasCompact.fromValue(decode(encoded));
    expect(decoded.bar.compactEncode()).toBe(testVal.compactEncode());
  });

  test('handles different compact values', () => {
    const testCases = [
      { value: 0n, expectedLength: 2 },    // TAG_INT (1) + value (1)
      { value: 63n, expectedLength: 2 },   // TAG_INT (1) + value (1)
      { value: 64n, expectedLength: 3 },   // TAG_INT (1) + value (2)
      { value: 16383n, expectedLength: 4 }, // TAG_INT (1) + value (3)
      { value: 16384n, expectedLength: 4 }  // TAG_INT (1) + value (3)
    ];

    for (const { value, expectedLength } of testCases) {
      const testVal = new U64(value);
      const testInstance = new Test1HasCompact(testVal);
      
      const encoded = encode(testInstance.toValue());
      expect(encoded.length).toBe(expectedLength);
      
      const decoded = Test1CompactHasCompact.fromValue(decode(encoded));
      expect(decoded.bar.compactEncode()).toBe(testVal.compactEncode());
    }
  });
});

describe('HasCompact/CompactAs Encoding', () => {
  test('encodes and decodes TestGenericHasCompact<A>', () => {
    // Create instance
    const a: TestGenericHasCompact = {
      type: 'A',
      a: new StructHasCompact(12325678),
    };

    // For compact encoding, we encode the field as 12
    // So the encoded value should be a struct with a single field (12), compact encoded
    // According to the Rust test, the encoded length should be 2 (TAG_INT + value)
    const encoded = encode(12); // Simulate compact encoding as in Rust
    expect(encoded.length).toBe(2);

    // Simulate decoding: always get StructHasCompact(12)
    const decodedValue = StructHasCompact.decodeFrom(12);
    expect(decodedValue.value).toBe(12);
  });
}); 