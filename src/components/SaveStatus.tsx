export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface SaveStatusProps {
  status: SaveState
  onRetry: () => void
}

export function SaveStatus({ status, onRetry }: SaveStatusProps) {
  if (status === 'idle') return null

  return (
    <div data-testid="save-status" className={`save-status save-status--${status}`} role="status">
      {status === 'saving' && 'Saving…'}
      {status === 'saved' && 'All changes saved'}
      {status === 'error' && (
        <>
          Failed to save.{' '}
          <button type="button" className="save-status__retry" onClick={onRetry}>
            Retry
          </button>
        </>
      )}
    </div>
  )
}
