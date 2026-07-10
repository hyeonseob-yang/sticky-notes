import type { Note } from '../types'

export const SAVE_LATENCY_MS = 600
export const SAVE_FAILURE_RATE = 0.15

export function saveNotes(_notes: Note[]): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < SAVE_FAILURE_RATE) {
        reject(new Error('Failed to save notes to the server'))
      } else {
        resolve()
      }
    }, SAVE_LATENCY_MS)
  })
}
