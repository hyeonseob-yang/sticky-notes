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

export function clampSizeToBounds(
  rect: Rect,
  bounds: { width: number; height: number },
): Rect {
  return {
    ...rect,
    width: Math.min(rect.width, Math.max(0, bounds.width - rect.x)),
    height: Math.min(rect.height, Math.max(0, bounds.height - rect.y)),
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
