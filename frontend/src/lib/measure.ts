import type { Point } from '@/types'

export interface Measurement {
  a: Point
  b: Point
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function closestOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return a
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
  return { x: a.x + t * dx, y: a.y + t * dy }
}

// nearest vertex within radius, else nearest point on any closed ring edge
// within radius, else null. vertices win so corners are easy to hit.
export function snapToRings(p: Point, rings: Point[][], radius: number): Point | null {
  let best: Point | null = null
  let bestD = radius
  for (const ring of rings) {
    for (const v of ring) {
      const d = distance(p, v)
      if (d <= bestD) { best = v; bestD = d }
    }
  }
  if (best) return best
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const c = closestOnSegment(p, ring[i], ring[(i + 1) % ring.length])
      const d = distance(p, c)
      if (d <= bestD) { best = c; bestD = d }
    }
  }
  return best
}
