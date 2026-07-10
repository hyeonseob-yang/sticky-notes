export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Note extends Rect {
  id: string
  text: string
  color: NoteColor
  z: number
}
