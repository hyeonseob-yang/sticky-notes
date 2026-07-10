import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { STORAGE_KEY } from './constants'

const POINTER_ID = 1

const TRASH_BOUNDS = { left: 900, top: 700, right: 1000, bottom: 800 }

function mockGetBoundingClientRect() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const isTrash = this.dataset.testid === 'trash-zone'
    const rect = isTrash
      ? { ...TRASH_BOUNDS, width: 100, height: 100 }
      : { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
    return { ...rect, x: rect.left, y: rect.top, toJSON: () => rect } as DOMRect
  })
}

function createNoteViaDrag(fromX: number, fromY: number, toX: number, toY: number) {
  const canvas = screen.getByTestId('canvas')
  fireEvent.pointerDown(canvas, { clientX: fromX, clientY: fromY, pointerId: POINTER_ID })
  fireEvent.pointerMove(window, { clientX: toX, clientY: toY, pointerId: POINTER_ID })
  fireEvent.pointerUp(window, { clientX: toX, clientY: toY, pointerId: POINTER_ID })
}

beforeEach(() => {
  localStorage.clear()
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
  mockGetBoundingClientRect()
})

describe('App', () => {
  it('creates a note by dragging on the canvas', () => {
    render(<App />)

    createNoteViaDrag(50, 50, 250, 230)

    expect(screen.getByTestId('note-card')).toBeInTheDocument()
  })

  it('removes a note by dragging it onto the trash zone', () => {
    render(<App />)
    createNoteViaDrag(50, 50, 250, 230)
    const card = screen.getByTestId('note-card')

    fireEvent.pointerDown(card, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 950, clientY: 750, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 950, clientY: 750, pointerId: POINTER_ID })

    expect(screen.queryByTestId('note-card')).not.toBeInTheDocument()
  })

  it('does not remove a note when it is dropped outside the trash zone', () => {
    render(<App />)
    createNoteViaDrag(50, 50, 250, 230)
    const card = screen.getByTestId('note-card')

    fireEvent.pointerDown(card, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 300, clientY: 300, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 300, clientY: 300, pointerId: POINTER_ID })

    expect(screen.getByTestId('note-card')).toBeInTheDocument()
  })

  it('commits edited text back into the rendered note', () => {
    render(<App />)
    createNoteViaDrag(50, 50, 250, 230)
    const card = screen.getByTestId('note-card')

    fireEvent.doubleClick(card)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Buy milk' } })
    fireEvent.blur(screen.getByRole('textbox'))

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('brings a note to front on activation', () => {
    render(<App />)
    createNoteViaDrag(50, 50, 250, 230)
    createNoteViaDrag(300, 300, 500, 480)
    const [first, second] = screen.getAllByTestId('note-card')

    fireEvent.pointerDown(first, { clientX: 60, clientY: 60, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 60, clientY: 60, pointerId: POINTER_ID })

    const firstZ = Number(first.style.zIndex)
    const secondZ = Number(second.style.zIndex)
    expect(firstZ).toBeGreaterThan(secondZ)
  })

  it('persists notes to localStorage and restores them on remount', () => {
    const { unmount } = render(<App />)
    createNoteViaDrag(50, 50, 250, 230)
    unmount()

    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    render(<App />)
    expect(screen.getByTestId('note-card')).toBeInTheDocument()
  })
})
