interface TrashZoneProps {
  isActive: boolean
}

export function TrashZone({ isActive }: TrashZoneProps) {
  const className = isActive ? 'trash-zone trash-zone--active' : 'trash-zone'

  return <div data-testid="trash-zone" className={className} />
}
