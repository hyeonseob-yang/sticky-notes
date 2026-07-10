import { useState } from 'react'
import type { ChangeEvent, FocusEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useDrag } from '../hooks/useDrag'
import { clampRectMinSize } from '../utils/geometry'
import { MIN_HEIGHT, MIN_WIDTH } from '../constants'
import type { Note } from '../types'

export interface NoteCardProps {
  note: Note
  onActivate: (id: string) => void
  onMove: (id: string, position: { x: number; y: number }) => void
  onResize: (id: string, size: { width: number; height: number }) => void
  onCommitText: (id: string, text: string) => void
}

export function NoteCard({ note, onActivate, onMove, onResize, onCommitText }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState(note.text)

  const moveDrag = useDrag({
    onDragEnd: (delta) => {
      onMove(note.id, { x: note.x + delta.dx, y: note.y + delta.dy })
    },
  })

  const resizeDrag = useDrag({
    onDragEnd: (delta) => {
      const { width, height } = clampRectMinSize(
        { x: note.x, y: note.y, width: note.width + delta.dx, height: note.height + delta.dy },
        MIN_WIDTH,
        MIN_HEIGHT,
      )
      onResize(note.id, { width, height })
    },
  })

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    onActivate(note.id)
    moveDrag.onPointerDown(event)
  }

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    resizeDrag.onPointerDown(event)
  }

  const handleDoubleClick = () => {
    setDraftText(note.text)
    setIsEditing(true)
  }

  const handleDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraftText(event.target.value)
  }

  const handleBlur = (event: FocusEvent<HTMLTextAreaElement>) => {
    setIsEditing(false)
    onCommitText(note.id, event.target.value)
  }

  return (
    <div
      data-testid="note-card"
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.z,
        backgroundColor: `var(--note-${note.color})`,
      }}
    >
      {isEditing ? (
        <textarea autoFocus value={draftText} onChange={handleDraftChange} onBlur={handleBlur} />
      ) : (
        <p>{note.text}</p>
      )}
      <div data-testid="resize-handle" onPointerDown={handleResizePointerDown} />
    </div>
  )
}
