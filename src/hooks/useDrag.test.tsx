import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { useDrag, type UseDragOptions } from './useDrag'

const POINTER_ID = 1

function DragTarget(props: UseDragOptions) {
  const handlers = useDrag(props)
  return <div data-testid="target" {...handlers} />
}

beforeEach(() => {
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
})

describe('useDrag', () => {
  it('ignores a right-click, never starting a drag even past the threshold', () => {
    const onDragStart = vi.fn()
    const onDrag = vi.fn()
    const { getByTestId } = render(
      <DragTarget threshold={4} onDragStart={onDragStart} onDrag={onDrag} />,
    )
    const target = getByTestId('target')

    fireEvent.pointerDown(target, {
      clientX: 100,
      clientY: 100,
      pointerId: POINTER_ID,
      button: 2,
    })
    fireEvent.pointerMove(window, { clientX: 200, clientY: 200, pointerId: POINTER_ID })

    expect(onDragStart).not.toHaveBeenCalled()
    expect(onDrag).not.toHaveBeenCalled()
    expect(target.setPointerCapture).not.toHaveBeenCalled()
  })

  it('ignores a middle-click', () => {
    const onDragStart = vi.fn()
    const { getByTestId } = render(<DragTarget threshold={4} onDragStart={onDragStart} />)
    const target = getByTestId('target')

    fireEvent.pointerDown(target, {
      clientX: 100,
      clientY: 100,
      pointerId: POINTER_ID,
      button: 1,
    })
    fireEvent.pointerMove(window, { clientX: 200, clientY: 200, pointerId: POINTER_ID })

    expect(onDragStart).not.toHaveBeenCalled()
  })

  it('does not start a drag while movement stays under the threshold', () => {
    const onDragStart = vi.fn()
    const onDrag = vi.fn()
    const { getByTestId } = render(
      <DragTarget threshold={4} onDragStart={onDragStart} onDrag={onDrag} />,
    )
    const target = getByTestId('target')

    fireEvent.pointerDown(target, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 102, clientY: 101, pointerId: POINTER_ID })

    expect(onDragStart).not.toHaveBeenCalled()
    expect(onDrag).not.toHaveBeenCalled()
  })

  it('starts the drag exactly once after crossing the threshold', () => {
    const onDragStart = vi.fn()
    const onDrag = vi.fn()
    const { getByTestId } = render(
      <DragTarget threshold={4} onDragStart={onDragStart} onDrag={onDrag} />,
    )
    const target = getByTestId('target')

    fireEvent.pointerDown(target, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 106, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 110, clientY: 100, pointerId: POINTER_ID })

    expect(onDragStart).toHaveBeenCalledTimes(1)
    expect(onDragStart).toHaveBeenCalledWith({ x: 100, y: 100 })
    expect(onDrag).toHaveBeenCalledTimes(2)
  })

  it('reports deltas relative to the drag start point, not the previous move', () => {
    const onDrag = vi.fn()
    const { getByTestId } = render(<DragTarget threshold={4} onDrag={onDrag} />)
    const target = getByTestId('target')

    fireEvent.pointerDown(target, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 10, clientY: 0, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 15, clientY: 5, pointerId: POINTER_ID })

    expect(onDrag).toHaveBeenNthCalledWith(1, { dx: 10, dy: 0 }, { x: 10, y: 0 })
    expect(onDrag).toHaveBeenNthCalledWith(2, { dx: 15, dy: 5 }, { x: 15, y: 5 })
  })

  it('fires onDragEnd with the final delta and ignores further moves', () => {
    const onDrag = vi.fn()
    const onDragEnd = vi.fn()
    const { getByTestId } = render(
      <DragTarget threshold={4} onDrag={onDrag} onDragEnd={onDragEnd} />,
    )
    const target = getByTestId('target')

    fireEvent.pointerDown(target, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 20, clientY: 10, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 20, clientY: 10, pointerId: POINTER_ID })

    expect(onDragEnd).toHaveBeenCalledTimes(1)
    expect(onDragEnd).toHaveBeenCalledWith({ dx: 20, dy: 10 }, { x: 20, y: 10 })

    onDrag.mockClear()
    fireEvent.pointerMove(window, { clientX: 40, clientY: 40, pointerId: POINTER_ID })
    expect(onDrag).not.toHaveBeenCalled()
  })

  it('captures the pointer on down and releases it on up', () => {
    const { getByTestId } = render(<DragTarget threshold={4} />)
    const target = getByTestId('target')

    fireEvent.pointerDown(target, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
    expect(target.setPointerCapture).toHaveBeenCalledWith(POINTER_ID)

    fireEvent.pointerUp(window, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
    expect(target.releasePointerCapture).toHaveBeenCalledWith(POINTER_ID)
  })

  it('stops responding once unmounted mid-drag', () => {
    const onDrag = vi.fn()
    const onDragEnd = vi.fn()
    const { getByTestId, unmount } = render(
      <DragTarget threshold={4} onDrag={onDrag} onDragEnd={onDragEnd} />,
    )
    const target = getByTestId('target')

    fireEvent.pointerDown(target, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 10, clientY: 10, pointerId: POINTER_ID })

    unmount()

    fireEvent.pointerMove(window, { clientX: 50, clientY: 50, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 50, clientY: 50, pointerId: POINTER_ID })

    expect(onDrag).toHaveBeenCalledTimes(1)
    expect(onDragEnd).not.toHaveBeenCalled()
  })
})
