import type { Ref } from 'react'

interface TrashZoneProps {
  isActive: boolean
  isDragging: boolean
  ref?: Ref<HTMLDivElement>
}

export function TrashZone({ isActive, isDragging, ref }: TrashZoneProps) {
  const classNames = ['trash-zone']
  if (isDragging) classNames.push('trash-zone--visible')
  if (isActive) classNames.push('trash-zone--active')

  return (
    <div
      ref={ref}
      data-testid="trash-zone"
      className={classNames.join(' ')}
      role="img"
      aria-label="Trash. Drag a note here to delete it."
    >
      🗑
    </div>
  )
}
