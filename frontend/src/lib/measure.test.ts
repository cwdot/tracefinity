import { describe, it, expect } from 'vitest'
import { distance, snapToRings } from './measure'

const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
]

describe('distance', () => {
  it('returns euclidean distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe('snapToRings', () => {
  const cases = [
    { name: 'snaps to a nearby vertex', p: { x: 9.5, y: 0.4 }, radius: 1, want: { x: 10, y: 0 } },
    { name: 'prefers a vertex over a closer edge', p: { x: 9.2, y: 0.1 }, radius: 1, want: { x: 10, y: 0 } },
    { name: 'snaps to the closing edge', p: { x: 0.3, y: 5 }, radius: 1, want: { x: 0, y: 5 } },
    { name: 'snaps to an edge interior', p: { x: 5, y: 10.5 }, radius: 1, want: { x: 5, y: 10 } },
    { name: 'returns null outside the radius', p: { x: 5, y: 5 }, radius: 1, want: null },
  ]
  for (const tt of cases) {
    it(tt.name, () => {
      expect(snapToRings(tt.p, [square], tt.radius)).toEqual(tt.want)
    })
  }

  it('searches every ring', () => {
    const inner = [{ x: 4, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 6 }, { x: 4, y: 6 }]
    expect(snapToRings({ x: 4.2, y: 4.1 }, [square, inner], 1)).toEqual({ x: 4, y: 4 })
  })
})
