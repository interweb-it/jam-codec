export interface ConventionalMetadata {
    type: 'Info';
    info: {
        name: string;
        version: string;
        license: string;
        authors: string[];
    };
}

export interface ProgramBlob {
    metadata: Uint8Array;
    roData: Uint8Array;
    rwData: Uint8Array;
    codeBlob: Uint8Array;
    rwDataPaddingPages: number;
    stackSize: number;
}

export interface CoreVmProgramBlob {
    metadata: Uint8Array;
    pvmBlob: Uint8Array;
}

export type Value = null | boolean | number | string | Uint8Array | Value[] | { [key: string]: Value };

export type EnumType = 
    | { type: 'A' }
    | { type: 'B', value: [number, number] }
    | { type: 'C', value: { a: number, b: number } }; 