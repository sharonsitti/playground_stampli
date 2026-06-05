import { Check } from 'lucide-react'

type ReadyState = 'unready' | 'ready' | 'locked'

type ReadyButtonProps = {
  state: ReadyState
  onReady: () => void
}

export function ReadyButton({ state, onReady }: ReadyButtonProps) {
  if (state === 'locked') {
    return (
      <button
        type="button"
        disabled
        aria-live="polite"
        className="h-10 w-full cursor-not-allowed rounded-lg bg-[#4338CA] text-sm font-semibold text-white opacity-100"
      >
        I&apos;m ready!
      </button>
    )
  }

  if (state === 'ready') {
    return (
      <button
        type="button"
        onClick={onReady}
        className="h-10 w-full rounded-lg bg-[#22C55E] text-sm font-semibold text-white hover:bg-[#16A34A]"
      >
        <span className="inline-flex items-center justify-center gap-1.5">
          <Check className="size-4" />
          I&apos;m ready!
        </span>
      </button>
    )
  }

  return (
    <div>
      <button
        type="button"
        disabled
        className="h-10 w-full cursor-not-allowed rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] text-sm font-semibold text-[#94A3B8]"
      >
        I&apos;m ready!
      </button>
      <p className="mt-1 text-center text-xs text-[#94A3B8]">Place all 5 ships to continue</p>
    </div>
  )
}
