## Vector

A growable typed-array vector with configurable item size, supporting in-place buffer resize (grow and shrink) via the [Resizable ArrayBuffer](https://tc39.es/proposal-resizable-arraybuffer/) API.

### Installation

This module is currently not published to npm.

### Usage

```ts
import { Uint32Vector, Float64Vector } from 'vector-typed'

// Create a vector of 2-element items (e.g. 2D points as Float64)
const points = new Float64Vector({ itemSize: 2, bufferItemCount: 1024 })

// Write an item
points.set(0, new Float64Array([1.0, 2.0]))
points.set(1, new Float64Array([3.0, 4.0]))

// Read an item (returns a copy)
const p = points.get(0) // Float64Array [1.0, 2.0]

// Check existence
points.has(0)  // true
points.has(5)  // false

// Resize
points.resize(100)
points.clear()

// Move 2 points from index 0 to index 10
points.move(0, 10, 2)

// Fill 2 points from index 1 with the value 0
points.fill(1, 2, 0)

// Access raw buffer
const raw: Float64Array = points.data

```

### Options

| Option              | Type      | Default | Description                                      |
|---------------------|-----------|---------|--------------------------------------------------|
| `itemSize`          | `number`  | `1`     | Number of elements per item                      |
| `bufferItemCount`   | `number`  | `1024`  | Initial buffer capacity in items                 |
| `autoGrow`          | `boolean` | `true`  | Grow on out-of-bounds access                     |

### API

| Method / Property | Signature                                        | Description                                        |
|--------------------|--------------------------------------------------|----------------------------------------------------|
| `size`             | `readonly number`                                | Number of items currently stored                   |
| `itemSize`         | `readonly number`                                | Elements per item                                  |
| `autoGrow`         | `boolean` (mutable)                              | Toggle auto-grow behavior                          |
| `resize(n)`        | `(n: number) => void`                            | Set logical size; grows or shrinks the buffer      |
| `clear()`          | `() => void`                                     | Reset size to 0                                    |
| `has(i)`           | `(i: number) => boolean`                         | Whether item index `i` is within bounds            |
| `get(i)`           | `(i: number) => TA`                              | Return a **copy** of item at index `i`             |
| `set(i, v)`        | `(i: number, v: TA) => void`                     | Write `v` into item at index `i`                   |
| `data`           | `() => TA`                                       | Return the underlying typed array (live view)      |
| `move(from, to, n)` | `(from: number, to: number, n: number) => void` | Move `n` items from `from` to `to` (overlap-safe) |   
| `fill(index, n, v)` | `(index: number, n: number, v: number) => void` | Fill `n` items starting at `index` with `v` |   

### Behavior notes

- **`get` returns a copy.** Mutating the returned array does not affect the buffer.
- **`set` writes in-place.** The value must have exactly `itemSize` elements.
- **`autoGrow`** — when `true`, `get` and `set` will grow the vector if the index is out of bounds. When `false`, they throw a `RangeError`.
- **Buffer growth** is in-place (via `ArrayBuffer.resize`) up to `2×` the initial allocation, then allocates a new buffer at `2×` the required size.
- **Buffer shrink** is in-place and O(1) (no reallocation).
- **`data`** returns a live length-tracking view. External holders see resizes automatically.  

### `move` details

- **Overlap-safe.** Uses `TypedArray.prototype.copyWithin` internally (equivalent to `memmove`), so overlapping source and destination ranges are handled correctly in both forward and backward moves.
- **Source beyond current size.** If `fromIndex + n > size` and `autoGrow` is `true`, the out-of-bounds source items are treated as zeros (consistent with `get` on grown indices).
- **Growth.** Grows the vector to `max(fromIndex, toIndex) + n` items if needed (when `autoGrow` is `true`). Does not grow if the move fits exactly within the current size.
- **Source is not cleared.** After a move, the original positions retain their previous values (same as `memmove`).
- **Errors:**
  - `RangeError` if `fromIndex`, `toIndex`, or `n` is not a non-negative integer.
  - `RangeError` if the move exceeds current size and `autoGrow` is `false`. 

### `fill` details

- **Fills all elements** within each item (all `itemSize` elements receive the same value).
- **Growth.** Grows the vector to `itemIndex + n` items if needed (when `autoGrow` is `true`). Does not grow if the fill fits exactly within the current size.
- **Value validation.** `value` must be a finite number. `NaN`, `Infinity`, and `-Infinity` throw a `RangeError`.
- **Errors:**
  - `RangeError` if `itemIndex` or `n` is not a non-negative integer.
  - `RangeError` if `value` is not finite.
  - `RangeError` if the fill exceeds current size and `autoGrow` is `false`.      