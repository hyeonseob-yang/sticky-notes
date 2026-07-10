import { useRef, useState } from 'react'
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
  onDragMove?: (point: { x: number; y: number }) => void
}

export function NoteCard({
  note,
  onActivate,
  onMove,
  onResize,
  onCommitText,
  onDragMove,
}: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState(note.text)
  const cardRef = useRef<HTMLDivElement>(null)

  const moveDrag = useDrag({
    onDrag: (delta, point) => {
      if (cardRef.current) {
        cardRef.current.style.transform = `translate(${delta.dx}px, ${delta.dy}px)`
      }
      onDragMove?.(point)
    },
    onDragEnd: (delta) => {
      if (cardRef.current) {
        cardRef.current.style.transform = ''
      }
      onMove(note.id, { x: note.x + delta.dx, y: note.y + delta.dy })
    },
  })

  const resizeDrag = useDrag({
    onDrag: (delta) => {
      if (cardRef.current) {
        const { width, height } = clampRectMinSize(
          { x: note.x, y: note.y, width: note.width + delta.dx, height: note.height + delta.dy },
          MIN_WIDTH,
          MIN_HEIGHT,
        )
        cardRef.current.style.width = `${width}px`
        cardRef.current.style.height = `${height}px`
      }
    },
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
      ref={cardRef}
      data-testid="note-card"
      className="note-card"
      role="group"
      aria-label={note.text ? `Sticky note: ${note.text}` : 'Sticky note, empty'}
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
        <textarea
          autoFocus
          className="note-card__textarea"
          aria-label="Note text"
          value={draftText}
          onChange={handleDraftChange}
          onBlur={handleBlur}
        />
      ) : (
        <p className="note-card__text">{note.text}</p>
      )}
      <div
        data-testid="resize-handle"
        className="note-card__resize-handle"
        aria-label="Resize note"
        onPointerDown={handleResizePointerDown}
      />
    </div>
  )
}
