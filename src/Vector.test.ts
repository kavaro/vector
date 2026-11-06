// Vector.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { Uint32Vector, Float64Vector } from './index'

describe('Vector', () => {
  describe('constructor', () => {
    it('creates a vector with default options', () => {
      const v = new Uint32Vector()
      expect(v.itemSize).toBe(1)
      expect(v.size).toBe(0)
      expect(v.autoGrow).toBe(true)
    })

    it('creates a vector with custom options', () => {
      const v = new Uint32Vector({ itemSize: 3, bufferItemCount: 256, autoGrow: false })
      expect(v.itemSize).toBe(3)
      expect(v.size).toBe(0)
      expect(v.autoGrow).toBe(false)
    })

    it('throws on itemSize < 1', () => {
      expect(() => new Uint32Vector({ itemSize: 0 })).toThrow(RangeError)
      expect(() => new Uint32Vector({ itemSize: -1 })).toThrow(RangeError)
    })

    it('throws on non-integer itemSize', () => {
      expect(() => new Uint32Vector({ itemSize: 1.5 })).toThrow(RangeError)
    })
  })

  describe('resize', () => {
    it('grows the vector', () => {
      const v = new Uint32Vector({ bufferItemCount: 4 })
      v.resize(8)
      expect(v.size).toBe(8)
    })

    it('shrinks the vector', () => {
      const v = new Uint32Vector({ bufferItemCount: 1024 })
      v.resize(1024)
      v.resize(16)
      expect(v.size).toBe(16)
    })

    it('throws on negative count', () => {
      const v = new Uint32Vector()
      expect(() => v.resize(-1)).toThrow(RangeError)
    })

    it('throws on fractional count', () => {
      const v = new Uint32Vector()
      expect(() => v.resize(0.5)).toThrow(RangeError)
    })
  })

  describe('clear', () => {
    it('resets size to 0', () => {
      const v = new Uint32Vector()
      v.resize(100)
      v.clear()
      expect(v.size).toBe(0)
    })
  })

  describe('has', () => {
    let v: Uint32Vector

    beforeEach(() => {
      v = new Uint32Vector({ autoGrow: false })
      v.resize(10)
    })

    it('returns true for valid indices', () => {
      expect(v.has(0)).toBe(true)
      expect(v.has(9)).toBe(true)
    })

    it('returns false for out-of-bounds', () => {
      expect(v.has(10)).toBe(false)
      expect(v.has(99)).toBe(false)
    })

    it('returns false for negative indices', () => {
      expect(v.has(-1)).toBe(false)
    })

    it('returns false for fractional indices', () => {
      expect(v.has(0.5)).toBe(false)
    })
  })

  describe('getOffset', () => {
    let v: Uint32Vector

    beforeEach(() => {
      v = new Uint32Vector({ itemSize: 4, autoGrow: false })
      v.resize(10)
    })

    it('returns the correct offset', () => {
      expect(v.getOffset(0)).toBe(0)
      expect(v.getOffset(1)).toBe(4)
      expect(v.getOffset(9)).toBe(36)
    })

    it('returns -1 for out-of-bounds when autoGrow is false', () => {
      expect(v.getOffset(10)).toBe(-1)
      expect(v.getOffset(99)).toBe(-1)
    })

    it('grows and returns offset when autoGrow is true', () => {
      v.autoGrow = true
      expect(v.getOffset(10)).toBe(40)
      expect(v.size).toBe(11)
    })

    it('returns -1 for negative indices', () => {
      expect(v.getOffset(-1)).toBe(-1)
    })

    it('returns -1 for fractional indices', () => {
      expect(v.getOffset(1.5)).toBe(-1)
    })
  })

  describe('assertOffset', () => {
    let v: Uint32Vector

    beforeEach(() => {
      v = new Uint32Vector({ itemSize: 2, autoGrow: false })
      v.resize(5)
    })

    it('returns the offset for valid indices', () => {
      expect(v.assertOffset(0)).toBe(0)
      expect(v.assertOffset(4)).toBe(8)
    })

    it('throws for out-of-bounds', () => {
      expect(() => v.assertOffset(5)).toThrow(RangeError)
      expect(() => v.assertOffset(99)).toThrow(RangeError)
    })

    it('throws for negative indices', () => {
      expect(() => v.assertOffset(-1)).toThrow(RangeError)
    })

    it('throws for fractional indices', () => {
      expect(() => v.assertOffset(0.5)).toThrow(RangeError)
    })
  })

  describe('get', () => {
    let v: Uint32Vector

    beforeEach(() => {
      v = new Uint32Vector({ itemSize: 4, autoGrow: false })
      v.resize(3)
    })

    it('returns a copy of the item', () => {
      const data = v.data
      data[0] = 10
      data[1] = 20
      data[2] = 30
      data[3] = 40
      data[4] = 50
      data[5] = 60
      data[6] = 70
      data[7] = 80

      const item = v.get(1)
      expect(item).toEqual(new Uint32Array([50, 60, 70, 80]))
    })

    it('returns an independent copy (mutation does not affect buffer)', () => {
      const data = v.data
      data[0] = 1
      data[1] = 2
      data[2] = 3
      data[3] = 4

      const item = v.get(0)
      item[0] = 999
      expect(data[0]).toBe(1)
    })

    it('throws for out-of-bounds when autoGrow is false', () => {
      expect(() => v.get(3)).toThrow(RangeError)
    })

    it('grows and returns zeroed item when autoGrow is true', () => {
      v.autoGrow = true
      const item = v.get(3)
      expect(v.size).toBe(4)
      expect(item).toEqual(new Uint32Array([0, 0, 0, 0]))
    })
  })

  describe('set', () => {
    let v: Uint32Vector

    beforeEach(() => {
      v = new Uint32Vector({ itemSize: 4, autoGrow: false })
      v.resize(3)
    })

    it('writes the value into the buffer', () => {
      v.set(1, new Uint32Array([10, 20, 30, 40]))
      const data = v.data
      expect(data[4]).toBe(10)
      expect(data[5]).toBe(20)
      expect(data[6]).toBe(30)
      expect(data[7]).toBe(40)
    })

    it('throws on wrong value length', () => {
      expect(() => v.set(0, new Uint32Array([1, 2]))).toThrow(RangeError)
      expect(() => v.set(0, new Uint32Array([1, 2, 3, 4, 5]))).toThrow(RangeError)
    })

    it('throws for out-of-bounds when autoGrow is false', () => {
      expect(() => v.set(3, new Uint32Array([1, 2, 3, 4]))).toThrow(RangeError)
    })

    it('grows when autoGrow is true', () => {
      v.autoGrow = true
      v.set(3, new Uint32Array([1, 2, 3, 4]))
      expect(v.size).toBe(4)
      const data = v.data
      expect(data[12]).toBe(1)
      expect(data[13]).toBe(2)
      expect(data[14]).toBe(3)
      expect(data[15]).toBe(4)
    })

    it('allocates a new buffer when exceeding maxByteLength', () => {
      // bufferItemCount: 4, itemSize: 1, BYTES_PER_ELEMENT: 4
      // byteLength = 16, maxByteLength = 32
      // resize(9) → newByteLength = 36 > 32 → triggers allocation path
      const v = new Uint32Vector({ itemSize: 1, bufferItemCount: 4 })
      v.resize(8)  // stays within maxByteLength (32 bytes) — in-place resize
      v.set(0, new Uint32Array([42]))
      v.set(7, new Uint32Array([99]))

      const oldData = v.data
      v.resize(9)  // 36 bytes > 32 maxByteLength → new buffer allocated

      // The old view is detached / stale; data() now points to a new buffer
      expect(v.data).not.toBe(oldData)
      expect(v.size).toBe(9)

      // Data was copied correctly
      expect(v.get(0)).toEqual(new Uint32Array([42]))
      expect(v.get(7)).toEqual(new Uint32Array([99]))
      expect(v.get(8)).toEqual(new Uint32Array([0]))
    })
  })

  describe('data', () => {
    it('returns the underlying typed array', () => {
      const v = new Uint32Vector({ itemSize: 1, bufferItemCount: 4 })
      const d = v.data
      expect(d).toBeInstanceOf(Uint32Array)
      expect(d.length).toBe(4)
    })
  })

  describe('round-trip (set then get)', () => {
    it('preserves data across multiple items', () => {
      const v = new Uint32Vector({ itemSize: 3 })
      v.set(0, new Uint32Array([1, 2, 3]))
      v.set(1, new Uint32Array([4, 5, 6]))
      v.set(2, new Uint32Array([7, 8, 9]))

      expect(v.get(0)).toEqual(new Uint32Array([1, 2, 3]))
      expect(v.get(1)).toEqual(new Uint32Array([4, 5, 6]))
      expect(v.get(2)).toEqual(new Uint32Array([7, 8, 9]))
    })
  })

  describe('move', () => {
    let v: Uint32Vector

    beforeEach(() => {
      v = new Uint32Vector({ itemSize: 2, autoGrow: false })
      v.resize(5)
      // Fill with known values: item i = [i*2, i*2+1]
      for (let i = 0; i < 5; i++) {
        v.set(i, new Uint32Array([i * 2, i * 2 + 1]))
      }
    })

    it('moves items forward (overlapping)', () => {
      // Move items 0-1 to position 3
      v.move(0, 3, 2)
      expect(v.get(3)).toEqual(new Uint32Array([0, 1]))
      expect(v.get(4)).toEqual(new Uint32Array([2, 3]))
      // Original positions retain old data (copyWithin doesn't clear source)
      expect(v.get(0)).toEqual(new Uint32Array([0, 1]))
      expect(v.get(1)).toEqual(new Uint32Array([2, 3]))
    })

    it('moves items backward (overlapping)', () => {
      // Move items 3-4 to position 1
      v.move(3, 1, 2)
      expect(v.get(1)).toEqual(new Uint32Array([6, 7]))
      expect(v.get(2)).toEqual(new Uint32Array([8, 9]))
    })

    it('moves a single item', () => {
      v.move(2, 0, 1)
      expect(v.get(0)).toEqual(new Uint32Array([4, 5]))
    })

    it('move to same position is a no-op', () => {
      v.move(2, 2, 2)
      expect(v.get(2)).toEqual(new Uint32Array([4, 5]))
      expect(v.get(3)).toEqual(new Uint32Array([6, 7]))
    })

    it('does nothing when itemCount is 0', () => {
      const data = v.data
      v.move(0, 3, 0)
      expect(v.data).toEqual(data)
    })

    it('throws on negative itemCount', () => {
      expect(() => v.move(0, 1, -1)).toThrow(RangeError)
    })

    it('throws on fractional itemCount', () => {
      expect(() => v.move(0, 1, 1.5)).toThrow(RangeError)
    })

    it('throws on negative fromIndex', () => {
      expect(() => v.move(-1, 1, 1)).toThrow(RangeError)
    })

    it('throws on negative toIndex', () => {
      expect(() => v.move(0, -1, 1)).toThrow(RangeError)
    })

    it('throws on fractional fromIndex', () => {
      expect(() => v.move(0.5, 1, 1)).toThrow(RangeError)
    })

    it('throws on fractional toIndex', () => {
      expect(() => v.move(0, 1.5, 1)).toThrow(RangeError)
    })

    it('throws when out of bounds with autoGrow false', () => {
      // fromIndex=3, itemCount=3 → required = 6 > 5
      expect(() => v.move(3, 0, 3)).toThrow(RangeError)
      // toIndex=4, itemCount=2 → required = 6 > 5
      expect(() => v.move(0, 4, 2)).toThrow(RangeError)
    })

    it('grows when autoGrow is true', () => {
      v.autoGrow = true
      v.move(3, 5, 2)  // required = 7 > 5
      expect(v.size).toBe(7)
      expect(v.get(5)).toEqual(new Uint32Array([6, 7]))
      expect(v.get(6)).toEqual(new Uint32Array([8, 9]))
    })

    it('grows when source extends beyond current size (autoGrow)', () => {
      v.autoGrow = true
      // fromIndex=4, itemCount=3 → source is items 4,5,6; items 5,6 are new (zero)
      v.move(4, 0, 3)
      expect(v.size).toBe(7)
      expect(v.get(0)).toEqual(new Uint32Array([8, 9]))
      expect(v.get(1)).toEqual(new Uint32Array([0, 0]))
      expect(v.get(2)).toEqual(new Uint32Array([0, 0]))
    })

    it('does not grow when requiredItemCount equals size', () => {
      // fromIndex=3, toIndex=0, itemCount=2 → required = 5 == size
      v.move(3, 0, 2)
      expect(v.size).toBe(5)
      expect(v.get(0)).toEqual(new Uint32Array([6, 7]))
      expect(v.get(1)).toEqual(new Uint32Array([8, 9]))
    })
  })

  describe('fill', () => {
    let v: Uint32Vector

    beforeEach(() => {
      v = new Uint32Vector({ itemSize: 2, autoGrow: false })
      v.resize(5)
      // Pre-fill with known values
      for (let i = 0; i < 5; i++) {
        v.set(i, new Uint32Array([i * 2, i * 2 + 1]))
      }
    })

    it('fills a range of items with the given value', () => {
      v.fill(1, 3, 42)
      expect(v.get(0)).toEqual(new Uint32Array([0, 1]))
      expect(v.get(1)).toEqual(new Uint32Array([42, 42]))
      expect(v.get(2)).toEqual(new Uint32Array([42, 42]))
      expect(v.get(3)).toEqual(new Uint32Array([42, 42]))
      expect(v.get(4)).toEqual(new Uint32Array([8, 9]))
    })

    it('fills a single item', () => {
      v.fill(2, 1, 99)
      expect(v.get(2)).toEqual(new Uint32Array([99, 99]))
      expect(v.get(1)).toEqual(new Uint32Array([2, 3]))
      expect(v.get(3)).toEqual(new Uint32Array([6, 7]))
    })

    it('fills from index 0 to the end', () => {
      v.fill(0, 5, 7)
      for (let i = 0; i < 5; i++) {
        expect(v.get(i)).toEqual(new Uint32Array([7, 7]))
      }
    })

    it('does nothing when itemCount is 0', () => {
      const before = v.data.slice()
      v.fill(0, 0, 99)
      expect(v.data).toEqual(before)
    })

    it('throws on negative itemCount', () => {
      expect(() => v.fill(0, -1, 1)).toThrow(RangeError)
    })

    it('throws on fractional itemCount', () => {
      expect(() => v.fill(0, 1.5, 1)).toThrow(RangeError)
    })

    it('throws on negative itemIndex', () => {
      expect(() => v.fill(-1, 1, 1)).toThrow(RangeError)
    })

    it('throws on fractional itemIndex', () => {
      expect(() => v.fill(0.5, 1, 1)).toThrow(RangeError)
    })

    it('throws on NaN value', () => {
      expect(() => v.fill(0, 1, NaN)).toThrow(RangeError)
    })

    it('throws on Infinity value', () => {
      expect(() => v.fill(0, 1, Infinity)).toThrow(RangeError)
      expect(() => v.fill(0, 1, -Infinity)).toThrow(RangeError)
    })

    it('throws when out of bounds with autoGrow false', () => {
      // itemIndex=3, itemCount=3 → required = 6 > 5
      expect(() => v.fill(3, 3, 1)).toThrow(RangeError)
    })

    it('grows when autoGrow is true', () => {
      v.autoGrow = true
      v.fill(4, 3, 55)  // required = 7 > 5
      expect(v.size).toBe(7)
      expect(v.get(4)).toEqual(new Uint32Array([55, 55]))
      expect(v.get(5)).toEqual(new Uint32Array([55, 55]))
      expect(v.get(6)).toEqual(new Uint32Array([55, 55]))
    })

    it('does not grow when requiredItemCount equals size', () => {
      v.fill(3, 2, 10)  // required = 5 == size
      expect(v.size).toBe(5)
      expect(v.get(3)).toEqual(new Uint32Array([10, 10]))
      expect(v.get(4)).toEqual(new Uint32Array([10, 10]))
    })
  })
})

describe('Float64Vector', () => {
  it('stores and retrieves float64 values', () => {
    const v = new Float64Vector({ itemSize: 2 })
    v.set(0, new Float64Array([3.14159, 2.71828]))
    const item = v.get(0)
    expect(item[0]).toBeCloseTo(3.14159)
    expect(item[1]).toBeCloseTo(2.71828)
  })
})   