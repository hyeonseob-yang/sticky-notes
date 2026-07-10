import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from './components/Canvas'
import { NoteCard } from './components/NoteCard'
import { TrashZone } from './components/TrashZone'
import { SaveStatus } from './components/SaveStatus'
import type { SaveState } from './components/SaveStatus'
import { saveNotes } from './api/notesApi'
import { clampPosition, rectsIntersect } from './utils/geometry'
import { COLORS, SAVE_DEBOUNCE_MS, STORAGE_KEY } from './constants'
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
  const [saveStatus, setSaveStatus] = useState<SaveState>('idle')
  const saveRequestIdRef = useRef(0)
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  const performSave = useCallback((notesToSave: Note[]) => {
    const requestId = ++saveRequestIdRef.current
    setSaveStatus('saving')
    saveNotes(notesToSave).then(
      () => {
        if (saveRequestIdRef.current === requestId) setSaveStatus('saved')
      },
      () => {
        if (saveRequestIdRef.current === requestId) setSaveStatus('error')
      },
    )
  }, [])

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    const timeoutId = setTimeout(() => performSave(notes), SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [notes, performSave])

  const handleRetrySave = useCallback(() => {
    performSave(notes)
  }, [notes, performSave])

  const handleCreateNote = useCallback((rect: Rect) => {
    const z = nextZ.current++
    const color = COLORS[z % COLORS.length]
    setNotes((prev) => [...prev, { id: crypto.randomUUID(), text: '', color, z, ...rect }])
  }, [])

  const handleActivate = useCallback((id: string) => {
    const z = nextZ.current++
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, z } : note)))
  }, [])

  const handleDragMove = useCallback((rect: Rect) => {
    const trashRect = trashZoneRef.current?.getBoundingClientRect()
    const isOver = trashRect ? rectsIntersect(rect, trashRect) : false
    if (isOver !== isOverTrashRef.current) {
      isOverTrashRef.current = isOver
      setIsTrashActive(isOver)
    }
  }, [])

  const handleMove = useCallback((id: string, position: { x: number; y: number }) => {
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
          />
        ))}
      </Canvas>
      <TrashZone ref={trashZoneRef} isActive={isTrashActive} />
      <SaveStatus status={saveStatus} onRetry={handleRetrySave} />
    </main>
  )
}

export default App
