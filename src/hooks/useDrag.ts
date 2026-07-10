import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { DRAG_THRESHOLD } from '../constants'

export interface DragDelta {
  dx: number
  dy: number
}

export interface DragPoint {
  x: number
  y: number
}

export interface UseDragOptions {
  threshold?: number
  onDragStart?: (point: DragPoint) => void
  onDrag?: (delta: DragDelta, point: DragPoint) => void
  onDragEnd?: (delta: DragDelta, point: DragPoint) => void
}

export interface DragHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
}

export function useDrag(options: UseDragOptions): DragHandlers {
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => cleanupRef.current?.()
  }, [])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const target = event.currentTarget
    const pointerId = event.pointerId
    const startX = event.clientX
    const startY = event.clientY
    const threshold = optionsRef.current.threshold ?? DRAG_THRESHOLD
    let started = false

    target.setPointerCapture(pointerId)

    const handleMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY

      if (!started) {
        if (Math.hypot(dx, dy) < threshold) return
        started = true
        optionsRef.current.onDragStart?.({ x: startX, y: startY })
      }

      optionsRef.current.onDrag?.(
        { dx, dy },
        { x: moveEvent.clientX, y: moveEvent.clientY },
      )
    }

    const handleUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return

      if (started) {
        const dx = upEvent.clientX - startX
        const dy = upEvent.clientY - startY
        optionsRef.current.onDragEnd?.(
          { dx, dy },
          { x: upEvent.clientX, y: upEvent.clientY },
        )
      }

      target.releasePointerCapture(pointerId)
      cleanup()
    }

    const cleanup = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      cleanupRef.current = null
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    cleanupRef.current = cleanup
  }, [])

  return { onPointerDown }
}
