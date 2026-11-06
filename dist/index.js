// src/Vector.ts
class Vector {
  #Data;
  #buffer;
  #data;
  #itemCount;
  #itemSize;
  autoGrow;
  constructor(Data, options) {
    this.#Data = Data;
    const {
      itemSize = 1,
      bufferItemCount = 1024,
      autoGrow = true
    } = options ?? {};
    if (itemSize < 1 || !Number.isInteger(itemSize))
      throw new RangeError(`itemSize must be a positive integer, got ${itemSize}`);
    this.#itemSize = itemSize;
    this.#itemCount = 0;
    this.autoGrow = autoGrow;
    const length = bufferItemCount * this.#itemSize;
    const byteLength = length * Data.BYTES_PER_ELEMENT;
    this.#buffer = new ArrayBuffer(byteLength, { maxByteLength: byteLength * 2 });
    this.#data = new Data(this.#buffer, 0);
  }
  #growLength(newLength) {
    const newByteLength = newLength * this.#Data.BYTES_PER_ELEMENT;
    const oldBuffer = this.#buffer;
    if (newByteLength <= oldBuffer.maxByteLength) {
      oldBuffer.resize(newByteLength);
      return;
    }
    const newBuffer = new ArrayBuffer(newByteLength, { maxByteLength: newByteLength * 2 });
    const newData = new this.#Data(newBuffer, 0);
    newData.set(this.#data);
    this.#buffer = newBuffer;
    this.#data = newData;
  }
  resize(newItemCount) {
    if (!Number.isInteger(newItemCount) || newItemCount < 0)
      throw new RangeError(`newItemCount must be a non-negative integer, got ${newItemCount}`);
    const newLength = newItemCount * this.#itemSize;
    const newByteLength = newLength * this.#Data.BYTES_PER_ELEMENT;
    if (newByteLength > this.#buffer.byteLength) {
      this.#growLength(newLength);
    } else if (newByteLength < this.#buffer.byteLength) {
      this.#buffer.resize(newByteLength);
    }
    this.#itemCount = newItemCount;
  }
  clear() {
    this.resize(0);
  }
  get data() {
    return this.#data;
  }
  getOffset(itemIndex) {
    if (!Number.isInteger(itemIndex) || itemIndex < 0)
      return -1;
    const itemSize = this.#itemSize;
    if (itemIndex >= this.#itemCount) {
      if (!this.autoGrow)
        return -1;
      this.resize(itemIndex + 1);
    }
    return itemIndex * itemSize;
  }
  assertOffset(itemIndex) {
    const offset = this.getOffset(itemIndex);
    if (offset === -1) {
      throw new RangeError(`Out of bounds item index ${itemIndex}`);
    }
    return offset;
  }
  has(itemIndex) {
    return Number.isInteger(itemIndex) && itemIndex >= 0 && itemIndex < this.#itemCount;
  }
  get(itemIndex) {
    const offset = this.assertOffset(itemIndex);
    return this.#data.subarray(offset, offset + this.#itemSize).slice();
  }
  set(itemIndex, value) {
    const offset = this.assertOffset(itemIndex);
    if (value.length !== this.#itemSize)
      throw new RangeError(`value length ${value.length} != itemSize ${this.#itemSize}`);
    this.#data.set(value, offset);
  }
  move(fromIndex, toIndex, itemCount) {
    if (!Number.isInteger(itemCount) || itemCount < 0)
      throw new RangeError(`itemCount must be a non-negative integer, got ${itemCount}`);
    if (!Number.isInteger(fromIndex) || fromIndex < 0)
      throw new RangeError(`fromIndex must be a non-negative integer, got ${fromIndex}`);
    if (!Number.isInteger(toIndex) || toIndex < 0)
      throw new RangeError(`toIndex must be a non-negative integer, got ${toIndex}`);
    if (itemCount === 0)
      return;
    const requiredItemCount = Math.max(fromIndex, toIndex) + itemCount;
    if (requiredItemCount > this.#itemCount) {
      if (!this.autoGrow) {
        throw new RangeError(`Out of bounds move from ${fromIndex} to ${toIndex} size ${itemCount}`);
      }
      this.resize(requiredItemCount);
    }
    const target = this.getOffset(toIndex);
    const start = this.getOffset(fromIndex);
    const end = start + itemCount * this.#itemSize;
    this.#data.copyWithin(target, start, end);
  }
  get itemSize() {
    return this.#itemSize;
  }
  get size() {
    return this.#itemCount;
  }
}

class Uint32Vector extends Vector {
  constructor(options) {
    super(Uint32Array, options);
  }
}

class Float64Vector extends Vector {
  constructor(options) {
    super(Float64Array, options);
  }
}
export {
  Vector,
  Uint32Vector,
  Float64Vector
};
