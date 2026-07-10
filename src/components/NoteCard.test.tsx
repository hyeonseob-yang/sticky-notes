import { beforeEach, describe, expect, it, vi } from 'vitest'
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
}

function renderNoteCard(overrides: Partial<Note> = {}, options: RenderNoteCardOptions = {}) {
  const onActivate = options.onActivate ?? vi.fn<NoteCardProps['onActivate']>()
  const onMove = options.onMove ?? vi.fn<NoteCardProps['onMove']>()
  const onResize = options.onResize ?? vi.fn<NoteCardProps['onResize']>()
  const onCommitText = options.onCommitText ?? vi.fn<NoteCardProps['onCommitText']>()
  render(
    <NoteCard
      note={makeNote(overrides)}
      onActivate={onActivate}
      onMove={onMove}
      onResize={onResize}
      onCommitText={onCommitText}
    />,
  )
  return { onActivate, onMove, onResize, onCommitText }
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
