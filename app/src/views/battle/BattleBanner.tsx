type BattleBannerProps = {
  isMyTurn: boolean
  gameOver: boolean
  secondsRemaining: number | null
}

type BannerStatus = 'over' | 'mine' | 'waiting'

const BADGE: Record<BannerStatus, { label: string; className: string }> = {
  over: {
    label: 'Game Over',
    className: 'bg-[#F1F5F9] text-[#64748B]',
  },
  mine: {
    label: 'Your Turn',
    className: 'bg-[#E0E7FF] text-[#4F46E5]',
  },
  waiting: {
    label: 'Waiting for opponent…',
    className: 'bg-[#F1F5F9] text-[#64748B]',
  },
}

const DESCRIPTION: Record<BannerStatus, string> = {
  over: 'The battle has ended.',
  mine: 'Click any cell on the targeting grid',
  waiting: 'Opponent is taking their shot',
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = String(seconds % 60).padStart(2, '0')
  return `${String(mins)}:${secs}`
}

export function BattleBanner({ isMyTurn, gameOver, secondsRemaining }: BattleBannerProps) {
  const status: BannerStatus = gameOver ? 'over' : isMyTurn ? 'mine' : 'waiting'
  const badge = BADGE[status]
  const timer = secondsRemaining === null ? '—:—' : formatTimer(secondsRemaining)

  return (
    <header className="flex items-center justify-between border-b border-[#C7D2FE] bg-[#EEF2FF] px-5 py-2.5">
      <div className="flex items-center gap-2.5">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold tracking-wider uppercase ${badge.className}`}
        >
          {badge.label}
        </span>
        <span className="text-sm text-[#64748B]">{DESCRIPTION[status]}</span>
      </div>
      {status === 'over' ? null : (
        <span
          className={`text-3xl font-bold tabular-nums ${status === 'mine' ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}`}
        >
          {timer}
        </span>
      )}
    </header>
  )
}
