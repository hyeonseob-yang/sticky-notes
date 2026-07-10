import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { TrashZone } from './TrashZone'

describe('TrashZone', () => {
  it('does not apply the active class when inactive', () => {
    const { getByTestId } = render(<TrashZone isActive={false} />)
    expect(getByTestId('trash-zone')).not.toHaveClass('trash-zone--active')
  })

  it('applies the active class when a dragged note is hovering over it', () => {
    const { getByTestId } = render(<TrashZone isActive />)
    expect(getByTestId('trash-zone')).toHaveClass('trash-zone--active')
  })
})
