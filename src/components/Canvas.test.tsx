import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Canvas } from './Canvas'
import { MIN_HEIGHT, MIN_WIDTH } from '../constants'

const POINTER_ID = 1

beforeEach(() => {
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
})

describe('Canvas', () => {
  it('does not create a note for a plain click with no drag', () => {
    const onCreateNote = vi.fn()
    render(<Canvas onCreateNote={onCreateNote} />)
    const canvas = screen.getByTestId('canvas')

    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 100, clientY: 100, pointerId: POINTER_ID })

    expect(onCreateNote).not.toHaveBeenCalled()
  })

  it('creates a note with the normalized rect after a drag past the threshold', () => {
    const onCreateNote = vi.fn()
    render(<Canvas onCreateNote={onCreateNote} />)
    const canvas = screen.getByTestId('canvas')

    fireEvent.pointerDown(canvas, { clientX: 300, clientY: 200, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 100, clientY: 400, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 100, clientY: 400, pointerId: POINTER_ID })

    expect(onCreateNote).toHaveBeenCalledTimes(1)
    expect(onCreateNote).toHaveBeenCalledWith({ x: 100, y: 200, width: 200, height: 200 })
  })

  it('clamps the created rect to the minimum width and height', () => {
    const onCreateNote = vi.fn()
    render(<Canvas onCreateNote={onCreateNote} />)
    const canvas = screen.getByTestId('canvas')

    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 110, clientY: 105, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 110, clientY: 105, pointerId: POINTER_ID })

    expect(onCreateNote).toHaveBeenCalledWith({ x: 100, y: 100, width: MIN_WIDTH, height: MIN_HEIGHT })
  })

  it('keeps a note created near the edge fully within the viewport', () => {
    const onCreateNote = vi.fn()
    render(<Canvas onCreateNote={onCreateNote} />)
    const canvas = screen.getByTestId('canvas')

    // Drag starts close to the bottom-right corner; the min-size floor would
    // otherwise push the note's far edge past the viewport.
    fireEvent.pointerDown(canvas, { clientX: 1000, clientY: 740, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 1015, clientY: 755, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 1015, clientY: 755, pointerId: POINTER_ID })

    expect(onCreateNote).toHaveBeenCalledWith({
      x: window.innerWidth - MIN_WIDTH,
      y: window.innerHeight - MIN_HEIGHT,
      width: MIN_WIDTH,
      height: MIN_HEIGHT,
    })
  })

  it('caps a note wider or taller than the viewport instead of letting it overflow', () => {
    const onCreateNote = vi.fn()
    render(<Canvas onCreateNote={onCreateNote} />)
    const canvas = screen.getByTestId('canvas')

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 300, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 2000, clientY: 500, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 2000, clientY: 500, pointerId: POINTER_ID })

    expect(onCreateNote).toHaveBeenCalledWith({
      x: 0,
      y: 300,
      width: window.innerWidth,
      height: 200,
    })
  })

  it('ignores drags that originate on a child element', () => {
    const onCreateNote = vi.fn()
    render(
      <Canvas onCreateNote={onCreateNote}>
        <div data-testid="child" />
      </Canvas>,
    )
    const child = screen.getByTestId('child')

    fireEvent.pointerDown(child, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 200, clientY: 200, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 200, clientY: 200, pointerId: POINTER_ID })

    expect(onCreateNote).not.toHaveBeenCalled()
  })

  it('shows a live preview rect while dragging and clears it after release', () => {
    const onCreateNote = vi.fn()
    render(<Canvas onCreateNote={onCreateNote} />)
    const canvas = screen.getByTestId('canvas')

    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 180, clientY: 140, pointerId: POINTER_ID })

    expect(screen.getByTestId('canvas-preview')).toBeInTheDocument()

    fireEvent.pointerUp(window, { clientX: 180, clientY: 140, pointerId: POINTER_ID })

    expect(screen.queryByTestId('canvas-preview')).not.toBeInTheDocument()
  })
})
