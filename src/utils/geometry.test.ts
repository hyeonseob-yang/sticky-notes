import { describe, expect, it } from 'vitest'
import {
  clampPosition,
  clampRectMinSize,
  normalizeRect,
  pointInBounds,
  rectCenter,
  rectsIntersect,
} from './geometry'

describe('normalizeRect', () => {
  it('handles a drag going down-right', () => {
    expect(normalizeRect(10, 10, 50, 40)).toEqual({
      x: 10,
      y: 10,
      width: 40,
      height: 30,
    })
  })

  it('handles a drag going up-left', () => {
    expect(normalizeRect(50, 40, 10, 10)).toEqual({
      x: 10,
      y: 10,
      width: 40,
      height: 30,
    })
  })

  it('handles a drag with no movement', () => {
    expect(normalizeRect(10, 10, 10, 10)).toEqual({
      x: 10,
      y: 10,
      width: 0,
      height: 0,
    })
  })
})

describe('clampRectMinSize', () => {
  it('leaves a rect unchanged when already at or above the minimum', () => {
    const rect = { x: 5, y: 5, width: 200, height: 150 }
    expect(clampRectMinSize(rect, 140, 120)).toEqual(rect)
  })

  it('grows width and height up to the minimum without moving the origin', () => {
    const rect = { x: 5, y: 5, width: 20, height: 10 }
    expect(clampRectMinSize(rect, 140, 120)).toEqual({
      x: 5,
      y: 5,
      width: 140,
      height: 120,
    })
  })
})

describe('clampPosition', () => {
  const bounds = { width: 1000, height: 800 }

  it('leaves a rect unchanged when fully within bounds', () => {
    const rect = { x: 100, y: 100, width: 200, height: 150 }
    expect(clampPosition(rect, bounds)).toEqual(rect)
  })

  it('pulls a rect back into bounds when it overflows the right/bottom edge', () => {
    const rect = { x: 950, y: 780, width: 200, height: 150 }
    expect(clampPosition(rect, bounds)).toEqual({
      x: 800,
      y: 650,
      width: 200,
      height: 150,
    })
  })

  it('pulls a rect back into bounds when it overflows the left/top edge', () => {
    const rect = { x: -50, y: -30, width: 200, height: 150 }
    expect(clampPosition(rect, bounds)).toEqual({
      x: 0,
      y: 0,
      width: 200,
      height: 150,
    })
  })

  it('anchors to the origin when a rect is larger than the bounds', () => {
    const rect = { x: 500, y: 500, width: 1200, height: 900 }
    expect(clampPosition(rect, bounds)).toEqual({
      x: 0,
      y: 0,
      width: 1200,
      height: 900,
    })
  })
})

describe('rectsIntersect', () => {
  it('returns true for overlapping rects', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 }
    const b = { x: 50, y: 50, width: 100, height: 100 }
    expect(rectsIntersect(a, b)).toBe(true)
  })

  it('returns false for rects that do not overlap', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 }
    const b = { x: 200, y: 200, width: 100, height: 100 }
    expect(rectsIntersect(a, b)).toBe(false)
  })

  it('returns false for rects that only touch at an edge', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 }
    const b = { x: 100, y: 0, width: 100, height: 100 }
    expect(rectsIntersect(a, b)).toBe(false)
  })
})

describe('rectCenter', () => {
  it('returns the midpoint of a rect', () => {
    expect(rectCenter({ x: 10, y: 20, width: 100, height: 50 })).toEqual({
      x: 60,
      y: 45,
    })
  })
})

describe('pointInBounds', () => {
  const bounds = { left: 100, top: 100, right: 200, bottom: 180 }

  it('returns true for a point inside the bounds', () => {
    expect(pointInBounds({ x: 150, y: 140 }, bounds)).toBe(true)
  })

  it('returns true for a point exactly on the edge', () => {
    expect(pointInBounds({ x: 100, y: 100 }, bounds)).toBe(true)
    expect(pointInBounds({ x: 200, y: 180 }, bounds)).toBe(true)
  })

  it('returns false for a point outside the bounds', () => {
    expect(pointInBounds({ x: 50, y: 140 }, bounds)).toBe(false)
    expect(pointInBounds({ x: 150, y: 300 }, bounds)).toBe(false)
  })
})
