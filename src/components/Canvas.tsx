import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useDrag } from '../hooks/useDrag'
import { clampRectMinSize, normalizeRect } from '../utils/geometry'
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

  const drag = useDrag({
    onDragStart: (point) => {
      originRef.current = toLocalPoint(point)
    },
    onDrag: (_delta, point) => {
      const current = toLocalPoint(point)
      const rect = normalizeRect(originRef.current.x, originRef.current.y, current.x, current.y)
      setPreviewRect(clampRectMinSize(rect, MIN_WIDTH, MIN_HEIGHT))
    },
    onDragEnd: (_delta, point) => {
      const current = toLocalPoint(point)
      const rect = normalizeRect(originRef.current.x, originRef.current.y, current.x, current.y)
      onCreateNote(clampRectMinSize(rect, MIN_WIDTH, MIN_HEIGHT))
      setPreviewRect(null)
    },
  })

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
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
