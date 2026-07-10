import type { NoteColor } from './types'

export const MIN_WIDTH = 140
export const MIN_HEIGHT = 120
export const DEFAULT_WIDTH = 200
export const DEFAULT_HEIGHT = 180

// Minimum pointer travel (px) before a create/move drag counts as a drag
// rather than a click. Prevents accidental note creation and drops.
export const DRAG_THRESHOLD = 8

export const COLORS: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple']

export const STORAGE_KEY = 'sticky-notes:v1'
