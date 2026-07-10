import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { saveNotes } from './api/notesApi'
import { SAVE_DEBOUNCE_MS, STORAGE_KEY } from './constants'

vi.mock('./api/notesApi', () => ({ saveNotes: vi.fn() }))

const POINTER_ID = 1

const TRASH_BOUNDS = { left: 900, top: 700, right: 1000, bottom: 800 }

function mockGetBoundingClientRect() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.dataset.testid === 'trash-zone') {
      const rect = { ...TRASH_BOUNDS, width: 100, height: 100 }
      return { ...rect, x: rect.left, y: rect.top, toJSON: () => rect } as DOMRect
    }

    if (this.dataset.testid === 'note-card') {
      // Simulate real layout: base position/size from inline style, plus any
      // live `transform: translate(...)` NoteCard applies during a drag.
      const left = parseFloat(this.style.left) || 0
      const top = parseFloat(this.style.top) || 0
      const width = parseFloat(this.style.width) || 0
      const height = parseFloat(this.style.height) || 0
      const match = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(this.style.transform)
      const dx = match ? parseFloat(match[1]) : 0
      const dy = match ? parseFloat(match[2]) : 0
      const x = left + dx
      const y = top + dy
      const rect = { left: x, top: y, right: x + width, bottom: y + height, width, height }
      return { ...rect, x, y, toJSON: () => rect } as DOMRect
    }

    const rect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
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
  vi.mocked(saveNotes).mockReset()
  vi.mocked(saveNotes).mockResolvedValue(undefined)
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

  it('clamps a note to the viewport when dragged past the right edge', () => {
    render(<App />)
    createNoteViaDrag(50, 50, 250, 230)
    const card = screen.getByTestId('note-card')

    // Only x overflows; y stays well clear of the trash zone's mock bounds
    // (900-1000, 700-800) so this test isolates clamping from trash deletion.
    fireEvent.pointerDown(card, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 2100, clientY: 150, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 2100, clientY: 150, pointerId: POINTER_ID })

    expect(card.style.left).toBe(`${window.innerWidth - 200}px`)
    expect(card.style.top).toBe('100px')
  })

  it('clamps a note to the viewport when dragged past the bottom edge', () => {
    render(<App />)
    createNoteViaDrag(50, 50, 250, 230)
    const card = screen.getByTestId('note-card')

    // Only y overflows; x stays well clear of the trash zone's mock bounds
    // (900-1000, 700-800) so this test isolates clamping from trash deletion.
    fireEvent.pointerDown(card, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 150, clientY: 2100, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 150, clientY: 2100, pointerId: POINTER_ID })

    expect(card.style.left).toBe('100px')
    expect(card.style.top).toBe(`${window.innerHeight - 180}px`)
  })

  it('deletes a note that gets clamped into the corner where the trash zone lives', () => {
    render(<App />)
    createNoteViaDrag(50, 50, 250, 230)
    const card = screen.getByTestId('note-card')

    fireEvent.pointerDown(card, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: 2100, clientY: 2100, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: 2100, clientY: 2100, pointerId: POINTER_ID })

    expect(screen.queryByTestId('note-card')).not.toBeInTheDocument()
  })

  it('clamps a note to the viewport when dragged past the top-left edge', () => {
    render(<App />)
    createNoteViaDrag(50, 50, 250, 230)
    const card = screen.getByTestId('note-card')

    fireEvent.pointerDown(card, { clientX: 100, clientY: 100, pointerId: POINTER_ID })
    fireEvent.pointerMove(window, { clientX: -1000, clientY: -1000, pointerId: POINTER_ID })
    fireEvent.pointerUp(window, { clientX: -1000, clientY: -1000, pointerId: POINTER_ID })

    expect(card.style.left).toBe('0px')
    expect(card.style.top).toBe('0px')
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

  describe('save status', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('does not attempt a save just from loading the page', async () => {
      render(<App />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS)
      })

      expect(saveNotes).not.toHaveBeenCalled()
      expect(screen.queryByTestId('save-status')).not.toBeInTheDocument()
    })

    it('shows a saving indicator, then a saved confirmation once the save resolves', async () => {
      let resolveSave: () => void = () => {}
      vi.mocked(saveNotes).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSave = () => resolve(undefined)
          }),
      )

      render(<App />)
      createNoteViaDrag(50, 50, 250, 230)

      expect(screen.queryByTestId('save-status')).not.toBeInTheDocument()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS)
      })
      expect(screen.getByTestId('save-status')).toHaveTextContent(/saving/i)

      resolveSave()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(screen.getByTestId('save-status')).toHaveTextContent(/all changes saved/i)
    })

    it('shows an error with a retry action that re-attempts the save', async () => {
      vi.mocked(saveNotes).mockRejectedValueOnce(new Error('network error'))

      render(<App />)
      createNoteViaDrag(50, 50, 250, 230)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS)
      })

      expect(screen.getByTestId('save-status')).toHaveTextContent(/failed/i)

      vi.mocked(saveNotes).mockResolvedValueOnce(undefined)
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByTestId('save-status')).toHaveTextContent(/all changes saved/i)
    })

    it('debounces rapid successive changes into a single save call', async () => {
      render(<App />)
      createNoteViaDrag(50, 50, 250, 230)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS / 2)
      })
      createNoteViaDrag(300, 300, 500, 480)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS)
      })

      expect(saveNotes).toHaveBeenCalledTimes(1)
    })
  })
})
