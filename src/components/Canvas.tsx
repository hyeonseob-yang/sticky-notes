import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useDrag } from '../hooks/useDrag'
import { clampPosition, clampRectMinSize, normalizeRect } from '../utils/geometry'
import { MIN_HEIGHT, MIN_WIDTH } from '../constants'
import type { Rect } from '../types'

interface CanvasProps {
  onCreateNote: (rect: Rect) => void
  children?: ReactNode
}

export function Canvas({ onCreateNote, children }: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const originRef = useRef({ x: 0, y: 0 })
  const [previewRect, setPreviewRect] = useState<Rect | null>(null)

  const toLocalPoint = (point: { x: number; y: number }) => {
    const bounds = canvasRef.current?.getBoundingClientRect()
    return { x: point.x - (bounds?.left ?? 0), y: point.y - (bounds?.top ?? 0) }
  }

  // Normalizes the drag into a rect, floors it to the minimum note size, then
  // keeps it fully on-screen (shifting the origin, if needed) so a note
  // dragged out near an edge isn't born already overflowing the viewport.
  const computeRect = (point: { x: number; y: number }): Rect => {
    const current = toLocalPoint(point)
    const rect = normalizeRect(originRef.current.x, originRef.current.y, current.x, current.y)
    const sized = clampRectMinSize(rect, MIN_WIDTH, MIN_HEIGHT)
    return clampPosition(sized, { width: window.innerWidth, height: window.innerHeight })
  }

  const drag = useDrag({
    onDragStart: (point) => {
      originRef.current = toLocalPoint(point)
    },
    onDrag: (_delta, point) => {
      setPreviewRect(computeRect(point))
    },
    onDragEnd: (_delta, point) => {
      onCreateNote(computeRect(point))
      setPreviewRect(null)
    },
  })

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Only start a create-drag when the pointerdown originated on the empty
    // canvas itself, not a child note (which bubbles up to this handler too).
    if (event.target !== event.currentTarget) return
    drag.onPointerDown(event)
  }

  return (
    <div
      ref={canvasRef}
      data-testid="canvas"
      className="canvas"
      role="region"
      aria-label="Sticky notes canvas. Click and drag to create a note."
      onPointerDown={handlePointerDown}
    >
      {children}
      {previewRect && (
        <div
          data-testid="canvas-preview"
          className="canvas__preview"
          style={{
            position: 'absolute',
            left: previewRect.x,
            top: previewRect.y,
            width: previewRect.width,
            height: previewRect.height,
          }}
        />
      )}
    </div>
  )
}
