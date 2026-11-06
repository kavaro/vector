export type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
export interface VectorOptions {
    itemSize?: number;
    bufferItemCount?: number;
    autoGrow?: boolean;
}
export type DataConstructor<TA extends TypedArray> = {
    new (buffer: ArrayBuffer, byteOffset: number): TA;
    readonly BYTES_PER_ELEMENT: number;
};
export declare class Vector<TA extends TypedArray> {
    #private;
    autoGrow: boolean;
    constructor(Data: DataConstructor<TA>, options?: VectorOptions);
    resize(newItemCount: number): void;
    clear(): void;
    get data(): TA;
    getOffset(itemIndex: number): number;
    assertOffset(itemIndex: number): number;
    has(itemIndex: number): boolean;
    get(itemIndex: number): TA;
    set(itemIndex: number, value: TA): void;
    get itemSize(): number;
    get size(): number;
}
export declare class Uint32Vector extends Vector<Uint32Array> {
    constructor(options?: VectorOptions);
}
export declare class Float64Vector extends Vector<Float64Array> {
    constructor(options?: VectorOptions);
}
