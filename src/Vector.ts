// Vector.ts

export type TypedArray =
  | Int8Array | Uint8Array | Uint8ClampedArray
  | Int16Array | Uint16Array
  | Int32Array | Uint32Array
  | Float32Array | Float64Array

export interface VectorOptions {
  itemSize?: number           // number of Uint32 or Floats per item
  bufferItemCount?: number    // number of items of itemSize that fit in the initial buffer
  autoGrow?: boolean          // when true, grows the vector on out of bound access
}

export type DataConstructor<TA extends TypedArray> = {
  new(buffer: ArrayBuffer, byteOffset: number): TA
  readonly BYTES_PER_ELEMENT: number
}

export class Vector<TA extends TypedArray> {
  #Data: DataConstructor<TA>
  #buffer: ArrayBuffer
  #data: TA
  #itemCount: number // number of items of itemSize
  #itemSize: number  // number of Uint32 or Floats per item
  autoGrow: boolean  // when true, grows the vector on out of bound access

  constructor(
    Data: DataConstructor<TA>,
    options?: VectorOptions
  ) {
    this.#Data = Data
    const {
      itemSize = 1,
      bufferItemCount = 1024,
      autoGrow = true
    } = options ?? {}
    if (itemSize < 1 || !Number.isInteger(itemSize))
      throw new RangeError(`Vector itemSize must be a positive integer, got ${itemSize}`)
    this.#itemSize = itemSize
    this.#itemCount = 0
    this.autoGrow = autoGrow
    const length = bufferItemCount * this.#itemSize
    const byteLength = length * Data.BYTES_PER_ELEMENT
    this.#buffer = new ArrayBuffer(byteLength, { maxByteLength: byteLength * 2 })
    this.#data = new Data(this.#buffer, 0)
  }

  #growLength(newLength: number) {
    const newByteLength = newLength * this.#Data.BYTES_PER_ELEMENT
    const oldBuffer = this.#buffer

    // Fits inside the existing ArrayBuffer boundaries
    if (newByteLength <= oldBuffer.maxByteLength) {
      oldBuffer.resize(newByteLength)
      return
    }

    // Allocate a new chunk of memory
    const newBuffer = new ArrayBuffer(newByteLength, { maxByteLength: newByteLength * 2 })
    const newData = new this.#Data(newBuffer, 0)
    newData.set(this.#data)
    this.#buffer = newBuffer
    this.#data = newData
  }

  resize(newItemCount: number): void {
    if (!Number.isInteger(newItemCount) || newItemCount < 0)
      throw new RangeError(`Resize newItemCount must be a non-negative integer, got ${newItemCount}`)
    const newLength = newItemCount * this.#itemSize
    const newByteLength = newLength * this.#Data.BYTES_PER_ELEMENT
    if (newByteLength > this.#buffer.byteLength) {
      this.#growLength(newLength)
    } else if (newByteLength < this.#buffer.byteLength) {
      this.#buffer.resize(newByteLength)
    }
    this.#itemCount = newItemCount
  }

  clear(): void {
    this.resize(0)
  }

  get data(): TA {
    return this.#data
  }

  getOffset(itemIndex: number): number {
    if (!Number.isInteger(itemIndex) || itemIndex < 0) return -1
    const itemSize = this.#itemSize
    if (itemIndex >= this.#itemCount) {
      if (!this.autoGrow) return -1
      this.resize(itemIndex + 1)
    }
    return itemIndex * itemSize
  }

  assertOffset(itemIndex: number): number {
    const offset = this.getOffset(itemIndex)
    if (offset === -1) {
      throw new RangeError(`Out of bounds item index ${itemIndex}`)
    }
    return offset
  }

  has(itemIndex: number): boolean {
    return Number.isInteger(itemIndex) && itemIndex >= 0 && itemIndex < this.#itemCount
  }

  get(itemIndex: number): TA {
    const offset = this.assertOffset(itemIndex)
    return this.#data.subarray(offset, offset + this.#itemSize).slice() as TA
  }

  set(itemIndex: number, value: TA): void {
    const offset = this.assertOffset(itemIndex)
    if (value.length !== this.#itemSize)
      throw new RangeError(`Set value length ${value.length} != itemSize ${this.#itemSize}`)
    this.#data.set(value, offset)
  }

  move(fromIndex: number, toIndex: number, itemCount: number) {
    if (!Number.isInteger(itemCount) || itemCount < 0)
      throw new RangeError(`Move itemCount must be a non-negative integer, got ${itemCount}`)
    if (!Number.isInteger(fromIndex) || fromIndex < 0)
      throw new RangeError(`Move fromIndex must be a non-negative integer, got ${fromIndex}`)
    if (!Number.isInteger(toIndex) || toIndex < 0)
      throw new RangeError(`Move toIndex must be a non-negative integer, got ${toIndex}`)
    if (itemCount === 0) return
    const requiredItemCount = Math.max(fromIndex, toIndex) + itemCount
    if (requiredItemCount > this.#itemCount) {
      if (!this.autoGrow) {
        throw new RangeError(`Out of bounds move from ${fromIndex} to ${toIndex} size ${itemCount}`)
      }
      this.resize(requiredItemCount)
    }
    const target = this.getOffset(toIndex)
    const start = this.getOffset(fromIndex)
    const end = start + (itemCount * this.#itemSize)
    this.#data.copyWithin(target, start, end)
  }

  fill(itemIndex: number, itemCount: number, value: number) {
    if (!Number.isInteger(itemCount) || itemCount < 0)
      throw new RangeError(`Fill itemCount must be a non-negative integer, got ${itemCount}`)
    if (!Number.isInteger(itemIndex) || itemIndex < 0)
      throw new RangeError(`Fill itemIndex must be a non-negative integer, got ${itemIndex}`)
    if (!Number.isFinite(value))
      throw new RangeError(`Fill value must be finite, got ${value}`)
    if (itemCount === 0) return
    const requiredItemCount = itemIndex + itemCount
    if (requiredItemCount > this.#itemCount) {
      if (!this.autoGrow) {
        throw new RangeError(`Out of bounds fill at itemIndex ${itemIndex} size ${itemCount}`)
      }
      this.resize(requiredItemCount)
    }
    const start = this.getOffset(itemIndex)
    const end = start + (itemCount * this.#itemSize)
    this.#data.fill(value, start, end)
  }

  get itemSize() {
    return this.#itemSize
  }

  get size() {
    return this.#itemCount
  }
}

export class Uint32Vector extends Vector<Uint32Array> {
  constructor(options?: VectorOptions) {
    super(Uint32Array, options)
  }
}

export class Float64Vector extends Vector<Float64Array> {
  constructor(options?: VectorOptions) {
    super(Float64Array, options)
  }
}