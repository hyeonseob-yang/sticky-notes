import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SaveStatus } from './SaveStatus'

describe('SaveStatus', () => {
  it('renders nothing when idle', () => {
    const { container } = render(<SaveStatus status="idle" onRetry={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a saving indicator while saving', () => {
    render(<SaveStatus status="saving" onRetry={vi.fn()} />)
    expect(screen.getByTestId('save-status')).toHaveTextContent(/saving/i)
  })

  it('shows a saved confirmation once saved', () => {
    render(<SaveStatus status="saved" onRetry={vi.fn()} />)
    expect(screen.getByTestId('save-status')).toHaveTextContent(/saved/i)
  })

  it('shows an error with a retry action, and calls onRetry when clicked', () => {
    const onRetry = vi.fn()
    render(<SaveStatus status="error" onRetry={onRetry} />)

    const status = screen.getByTestId('save-status')
    expect(status).toHaveTextContent(/failed/i)

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
