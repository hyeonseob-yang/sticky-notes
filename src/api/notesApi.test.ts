import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveNotes, SAVE_FAILURE_RATE, SAVE_LATENCY_MS } from './notesApi'
import type { Note } from '../types'

const notes: Note[] = [
  { id: 'note-1', x: 0, y: 0, width: 100, height: 100, text: '', color: 'yellow', z: 1 },
]

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('saveNotes', () => {
  it('resolves after a simulated network delay on success', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(SAVE_FAILURE_RATE)

    const promise = saveNotes(notes)
    vi.advanceTimersByTime(SAVE_LATENCY_MS)

    await expect(promise).resolves.toBeUndefined()
  })

  it('rejects after a simulated network delay on failure', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const promise = saveNotes(notes)
    vi.advanceTimersByTime(SAVE_LATENCY_MS)

    await expect(promise).rejects.toThrow()
  })

  it('does not resolve or reject before the simulated delay has elapsed', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(SAVE_FAILURE_RATE)
    const onSettled = vi.fn()

    saveNotes(notes).then(onSettled, onSettled)
    vi.advanceTimersByTime(SAVE_LATENCY_MS - 1)
    await Promise.resolve()

    expect(onSettled).not.toHaveBeenCalled()
  })
})
