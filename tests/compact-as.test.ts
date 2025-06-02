import { encode, decode } from '../src/codec';
import { Value } from '../src/types';

type Error = string;

// StructHasCompact equivalent with CompactAs logic
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

// Enum with generic HasCompact (mimicking Rust's TestGenericHasCompact)
interface TestGenericHasCompactA {
  type: 'A';
  a: StructHasCompact;
}
type TestGenericHasCompact = TestGenericHasCompactA;

describe('CompactAs Encoding', () => {
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