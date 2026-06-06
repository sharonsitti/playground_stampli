import { getOccupiedCells } from '@shared/geometry'
import { describe, expect, it } from 'vitest'

describe('getOccupiedCells', () => {
  // F4 AC4 / KDD#6: H orientation extends toward higher column indices from the top-left anchor
  it('lays a horizontal carrier across 5 increasing columns on the anchor row', () => {
    const cells = getOccupiedCells({
      type: 'carrier',
      orientation: 'H',
      origin_col: 0,
      origin_row: 1,
    })

    expect(cells).toEqual([
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
      { col: 3, row: 1 },
      { col: 4, row: 1 },
    ])
  })

  // F4 AC4 / KDD#6: V orientation extends downward toward higher row indices from the top-left anchor
  it('lays a vertical destroyer down 2 increasing rows on the anchor column', () => {
    const cells = getOccupiedCells({
      type: 'destroyer',
      orientation: 'V',
      origin_col: 5,
      origin_row: 3,
    })

    expect(cells).toEqual([
      { col: 5, row: 3 },
      { col: 5, row: 4 },
    ])
  })
})
