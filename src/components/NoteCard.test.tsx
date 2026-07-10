import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { NoteCard } from './NoteCard'
import type { NoteCardProps } from './NoteCard'
import { MIN_HEIGHT, MIN_WIDTH } from '../constants'
import type { Note } from '../types'

const POINTER_ID = 1

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    x: 100,
    y: 100,
    width: 200,
    height: 180,
    text: 'Hello',
    color: 'yellow',
    z: 1,
    ...overrides,
  }
}

interface RenderNoteCardOptions {
  onActivate?: NoteCardProps['onActivate']
  onMove?: NoteCardProps['onMove']
  onResize?: NoteCardProps['onResize']
  onCommitText?: NoteCardProps['onCommitText']
  onDragMove?: NoteCardProps['onDragMove']
}

function renderNoteCard(overrides: Partial<Note> = {}, options: RenderNoteCardOptions = {}) {
  const onActivate = options.onActivate ?? vi.fn<NoteCardProps['onActivate']>()
  const onMove = options.onMove ?? vi.fn<NoteCardProps['onMove']>()
  const onResize = options.onResize ?? vi.fn<NoteCardProps['onResize']>()
  const onCommitText = options.onCommitText ?? vi.fn<NoteCardProps['onCommitText']>()
  const onDragMove = options.onDragMove ?? vi.fn<NonNullable<NoteCardProps['onDragMove']>>()
  render(
    <NoteCard
      note={makeNote(overrides)}
      onActivate={onActivate}
      onMove={onMove}
      onResize={onResize}
      onCommitText={onCommitText}
      onDragMove={onDragMove}
    />,
  )
  return { onActivate, onMove, onResize, onCommitText, onDragMove }
}

beforeEach(() => {
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
})

describe('NoteCard', () => {
  describe('editing text', () => {
    it('enters edit mode on double-click, showing the current text', () => {
      renderNoteCard({ text: 'Buy milk' })

      fireEvent.doubleClick(screen.getByTestId('note-card'))

      expect(screen.getByRole('textbox')).toHaveValue('Buy milk')
    })

    it('commits the edited text on blur', () => {
      const { onCommitText } = renderNoteCard({ text: 'Buy milk' })

      fireEvent.doubleClick(screen.getByTestId('note-card'))
      const textbox = screen.getByRole('textbox')
      fireEvent.change(textbox, { target: { value: 'Buy oat milk' } })
      fireEvent.blur(textbox)

      expect(onCommitText).toHaveBeenCalledWith('note-1', 'Buy oat milk')
    })

    it('does not commit while still typing', () => {
      const { onCommitText } = renderNoteCard()

      fireEvent.doubleClick(screen.getByTestId('note-card'))
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'still typing' } })

      expect(onCommitText).not.toHaveBeenCalled()
    })
  })

  describe('auto-grow while editing', () => {
    afterEach(() => {
      Reflect.deleteProperty(HTMLTextAreaElement.prototype, 'scrollHeight')
    })

    function mockScrollHeight(initial: number) {
      let value = initial
      Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
        configurable: true,
        get: () => value,
      })
      return (next: number) => {
        value = next
      }
    }

    it('grows the note height while editing when content overflows the current size', () => {
      const setScrollHeight = mockScrollHeight(150)
      renderNoteCard({ height: 150 })
      const card = screen.getByTestId('note-card')

      fireEvent.doubleClick(card)
      setScrollHeight(320)
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a lot of text' } })

      expect(card.style.height).toBe('320px')
    })

    it('never shrinks the note below its manually set height while editing', () => {
      mockScrollHeight(80)
      renderNoteCard({ height: 150 })
      const card = screen.getByTestId('note-card')

      fireEvent.doubleClick(card)
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } })

      expect(card.style.height).toBe('150px')
    })

    it('commits the grown height via onResize once editing ends', () => {
      const setScrollHeight = mockScrollHeight(150)
      const { onResize } = renderNoteCard({ width: 200, height: 150 })
      const card = screen.getByTestId('note-card')

      fireEvent.doubleClick(card)
      setScrollHeight(300)
      const textbox = screen.getByRole('textbox')
      fireEvent.change(textbox, { target: { value: 'a lot of text' } })
      fireEvent.blur(textbox)

      expect(onResize).toHaveBeenCalledWith('note-1', { width: 200, height: 300 })
    })

    it('does not call onResize on blur if the note never grew', () => {
      const { onResize } = renderNoteCard({ height: 150 })
      const card = screen.getByTestId('note-card')

      fireEvent.doubleClick(card)
      const textbox = screen.getByRole('textbox')
      fireEvent.change(textbox, { target: { value: 'short' } })
      fireEvent.blur(textbox)

      expect(onResize).not.toHaveBeenCalled()
    })
  })

  describe('bring to front', () => {
    it('calls onActivate on pointerdown, even without a drag', () => {
      const { onActivate } = renderNoteCard()

      fireEvent.pointerDown(screen.getByTestId('note-card'), {
        clientX: 0,
        clientY: 0,
        pointerId: POINTER_ID,
      })

      expect(onActivate).toHaveBeenCalledWith('note-1')
    })
  })

  describe('moving', () => {
    it('calls onMove once with the final position after a drag', () => {
      const { onMove } = renderNoteCard({ x: 100, y: 100 })
      const card = screen.getByTestId('note-card')

      fireEvent.pointerDown(card, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
      fireEvent.pointerMove(window, { clientX: 30, clientY: 10, pointerId: POINTER_ID })
      expect(onMove).not.toHaveBeenCalled()

      fireEvent.pointerUp(window, { clientX: 30, clientY: 10, pointerId: POINTER_ID })

      expect(onMove).toHaveBeenCalledTimes(1)
      expect(onMove).toHaveBeenCalledWith('note-1', { x: 130, y: 110 })
    })

    it('does not call onMove for a plain click with no movement', () => {
      const { onMove } = renderNoteCard()
      const card = screen.getByTestId('note-card')

      fireEvent.pointerDown(card, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
      fireEvent.pointerUp(window, { clientX: 0, clientY: 0, pointerId: POINTER_ID })

      expect(onMove).not.toHaveBeenCalled()
    })

    it('translates the card live during the drag, then clears the transform on release', () => {
      renderNoteCard({ x: 100, y: 100 })
      const card = screen.getByTestId('note-card')

      fireEvent.pointerDown(card, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
      fireEvent.pointerMove(window, { clientX: 30, clientY: 10, pointerId: POINTER_ID })

      expect(card.style.transform).toBe('translate(30px, 10px)')

      fireEvent.pointerUp(window, { clientX: 30, clientY: 10, pointerId: POINTER_ID })

      expect(card.style.transform).toBe('')
    })

    it('clamps the live transform so the card cannot be dragged past the top-left edge', () => {
      renderNoteCard({ x: 100, y: 100, width: 200, height: 180 })
      const card = screen.getByTestId('note-card')

      fireEvent.pointerDown(card, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
      fireEvent.pointerMove(window, { clientX: -2000, clientY: -2000, pointerId: POINTER_ID })

      expect(card.style.transform).toBe('translate(-100px, -100px)')
    })

    it('clamps the live transform so the card cannot be dragged past the bottom-right edge', () => {
      renderNoteCard({ x: 700, y: 500, width: 200, height: 180 })
      const card = screen.getByTestId('note-card')

      fireEvent.pointerDown(card, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
      fireEvent.pointerMove(window, { clientX: 2000, clientY: 2000, pointerId: POINTER_ID })

      expect(card.style.transform).toBe('translate(124px, 88px)')
    })

    it('reports the live pointer position via onDragMove while dragging', () => {
      const { onDragMove } = renderNoteCard()
      const card = screen.getByTestId('note-card')

      fireEvent.pointerDown(card, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
      fireEvent.pointerMove(window, { clientX: 30, clientY: 10, pointerId: POINTER_ID })

      expect(onDragMove).toHaveBeenCalledWith({ x: 30, y: 10 })
    })
  })

  describe('resizing', () => {
    it('calls onResize once with the final size after dragging the resize handle', () => {
      const { onResize } = renderNoteCard({ width: 200, height: 180 })
      const handle = screen.getByTestId('resize-handle')

      fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
      fireEvent.pointerMove(window, { clientX: 40, clientY: 20, pointerId: POINTER_ID })
      fireEvent.pointerUp(window, { clientX: 40, clientY: 20, pointerId: POINTER_ID })

      expect(onResize).toHaveBeenCalledTimes(1)
      expect(onResize).toHaveBeenCalledWith('note-1', { width: 240, height: 200 })
    })

    it('does not start a move drag when dragging the resize handle', () => {
      const { onMove } = renderNoteCard()
      const handle = screen.getByTestId('resize-handle')

      fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
      fireEvent.pointerMove(window, { clientX: 40, clientY: 20, pointerId: POINTER_ID })
      fireEvent.pointerUp(window, { clientX: 40, clientY: 20, pointerId: POINTER_ID })

      expect(onMove).not.toHaveBeenCalled()
    })

    it('clamps the resized dimensions to the minimum width and height', () => {
      const { onResize } = renderNoteCard({ width: 200, height: 180 })
      const handle = screen.getByTestId('resize-handle')

      fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: POINTER_ID })
      fireEvent.pointerMove(window, { clientX: -500, clientY: -500, pointerId: POINTER_ID })
      fireEvent.pointerUp(window, { clientX: -500, clientY: -500, pointerId: POINTER_ID })

      expect(onResize).toHaveBeenCalledWith('note-1', {
        width: MIN_WIDTH,
        height: MIN_HEIGHT,
      })
    })
  })
})
