import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { TrashZone } from './TrashZone'

describe('TrashZone', () => {
  it('does not apply the active class when inactive', () => {
    const { getByTestId } = render(<TrashZone isActive={false} isDragging={false} />)
    expect(getByTestId('trash-zone')).not.toHaveClass('trash-zone--active')
  })

  it('applies the active class when a dragged note is hovering over it', () => {
    const { getByTestId } = render(<TrashZone isActive isDragging />)
    expect(getByTestId('trash-zone')).toHaveClass('trash-zone--active')
  })

  it('does not apply the visible class when no note is being dragged', () => {
    const { getByTestId } = render(<TrashZone isActive={false} isDragging={false} />)
    expect(getByTestId('trash-zone')).not.toHaveClass('trash-zone--visible')
  })

  it('applies the visible class while a note is being dragged', () => {
    const { getByTestId } = render(<TrashZone isActive={false} isDragging />)
    expect(getByTestId('trash-zone')).toHaveClass('trash-zone--visible')
  })
})
