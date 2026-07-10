import type { Rect } from '../types'

export function normalizeRect(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
): Rect {
  return {
    x: Math.min(startX, currentX),
    y: Math.min(startY, currentY),
    width: Math.abs(currentX - startX),
    height: Math.abs(currentY - startY),
  }
}

export function clampRectMinSize(
  rect: Rect,
  minWidth: number,
  minHeight: number,
): Rect {
  return {
    ...rect,
    width: Math.max(rect.width, minWidth),
    height: Math.max(rect.height, minHeight),
  }
}

export function clampPosition(
  rect: Rect,
  bounds: { width: number; height: number },
): Rect {
  const maxX = Math.max(0, bounds.width - rect.width)
  const maxY = Math.max(0, bounds.height - rect.height)
  return {
    ...rect,
    x: Math.min(Math.max(rect.x, 0), maxX),
    y: Math.min(Math.max(rect.y, 0), maxY),
  }
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export function rectCenter(rect: Rect): { x: number; y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

export function pointInBounds(
  point: { x: number; y: number },
  bounds: { left: number; top: number; right: number; bottom: number },
): boolean {
  return (
    point.x >= bounds.left &&
    point.x <= bounds.right &&
    point.y >= bounds.top &&
    point.y <= bounds.bottom
  )
}
