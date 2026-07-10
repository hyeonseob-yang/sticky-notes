import type { Ref } from 'react'

interface TrashZoneProps {
  isActive: boolean
  ref?: Ref<HTMLDivElement>
}

export function TrashZone({ isActive, ref }: TrashZoneProps) {
  const className = isActive ? 'trash-zone trash-zone--active' : 'trash-zone'

  return (
    <div
      ref={ref}
      data-testid="trash-zone"
      className={className}
      role="img"
      aria-label="Trash. Drag a note here to delete it."
    >
      🗑
    </div>
  )
}
