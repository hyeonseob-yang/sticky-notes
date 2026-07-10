import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from './components/Canvas'
import { NoteCard } from './components/NoteCard'
import { TrashZone } from './components/TrashZone'
import { clampPosition, pointInBounds } from './utils/geometry'
import { COLORS, STORAGE_KEY } from './constants'
import type { Note, Rect } from './types'

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Note[]) : []
  } catch {
    return []
  }
}

function App() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const nextZ = useRef(notes.reduce((max, note) => Math.max(max, note.z), 0) + 1)
  const trashZoneRef = useRef<HTMLDivElement>(null)
  const isOverTrashRef = useRef(false)
  const [isTrashActive, setIsTrashActive] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  const handleCreateNote = useCallback((rect: Rect) => {
    const z = nextZ.current++
    const color = COLORS[z % COLORS.length]
    setNotes((prev) => [...prev, { id: crypto.randomUUID(), text: '', color, z, ...rect }])
  }, [])

  const handleActivate = useCallback((id: string) => {
    const z = nextZ.current++
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, z } : note)))
  }, [])

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragMove = useCallback((point: { x: number; y: number }) => {
    const bounds = trashZoneRef.current?.getBoundingClientRect()
    const isOver = bounds ? pointInBounds(point, bounds) : false
    if (isOver !== isOverTrashRef.current) {
      isOverTrashRef.current = isOver
      setIsTrashActive(isOver)
    }
  }, [])

  const handleMove = useCallback((id: string, position: { x: number; y: number }) => {
    setIsDragging(false)
    if (isOverTrashRef.current) {
      isOverTrashRef.current = false
      setIsTrashActive(false)
      setNotes((prev) => prev.filter((note) => note.id !== id))
      return
    }
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== id) return note
        const clamped = clampPosition(
          { ...note, ...position },
          { width: window.innerWidth, height: window.innerHeight },
        )
        return { ...note, x: clamped.x, y: clamped.y }
      }),
    )
  }, [])

  const handleResize = useCallback((id: string, size: { width: number; height: number }) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, ...size } : note)))
  }, [])

  const handleCommitText = useCallback((id: string, text: string) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, text } : note)))
  }, [])

  return (
    <main className="app">
      <Canvas onCreateNote={handleCreateNote}>
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onActivate={handleActivate}
            onMove={handleMove}
            onResize={handleResize}
            onCommitText={handleCommitText}
            onDragMove={handleDragMove}
            onDragStart={handleDragStart}
          />
        ))}
      </Canvas>
      <TrashZone ref={trashZoneRef} isActive={isTrashActive} isDragging={isDragging} />
    </main>
  )
}

export default App
