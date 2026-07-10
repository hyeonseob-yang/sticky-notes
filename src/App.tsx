import { useRef, useState } from 'react'
import type { Note } from './types'

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const nextZ = useRef(1)

  return <div className="app" />
}

export default App
