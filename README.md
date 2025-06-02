# @interweb-it/jam-codec

TypeScript implementation of the JAM codec for binary serialization and deserialization.
This library is based on [@paritytech/jam-codec](https://github.com/paritytech/jam-codec) repository.

## Installation

```bash
yarn add @interweb-it/jam-codec
```

## Usage

```typescript
import { encode, decode } from '@interweb-it/jam-codec';

// Encoding
const data = { foo: 'bar', baz: 42 };
const encoded = encode(data);

// Decoding
const decoded = decode(encoded);
```

## Features

- Binary serialization and deserialization
- Type-safe encoding and decoding
- Efficient variable-length integer encoding
- Support for complex data structures

## License

Apache-2.0