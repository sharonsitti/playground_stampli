import { Button } from '@/components/ui/button'

type ReadyState = 'unready' | 'ready' | 'locked'

type ReadyButtonProps = {
  state: ReadyState
  onReady: () => void
}

export function ReadyButton({ state, onReady }: ReadyButtonProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        type="button"
        size="lg"
        disabled={state !== 'ready'}
        onClick={onReady}
        className={
          state === 'ready'
            ? 'bg-emerald-600 text-white hover:bg-emerald-600/90'
            : state === 'locked'
              ? 'bg-primary text-primary-foreground'
              : 'bg-slate-700 text-slate-400'
        }
      >
        {state === 'ready' ? '✓ I’m ready!' : 'I’m ready!'}
      </Button>
      {state === 'unready' && (
        <p className="text-muted-foreground text-xs">Place all 5 ships to continue</p>
      )}
    </div>
  )
}
