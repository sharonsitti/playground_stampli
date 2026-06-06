import type { Notification } from './useBattle'

type BattleNotificationsProps = {
  notifications: Notification[]
}

const KIND_CLASS: Record<Notification['kind'], string> = {
  sunk: 'bg-[#FEE2E2] text-[#B91C1C]',
  expired: 'rounded-l-none border-l-[3px] border-[#FB923C] bg-[#FFF7ED] text-[#92400E]',
}

export function BattleNotifications({ notifications }: BattleNotificationsProps) {
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      {notifications.map((n) => (
        <div
          key={n.id}
          role="status"
          className={`rounded-lg px-3.5 py-2 text-sm font-medium ${KIND_CLASS[n.kind]}`}
        >
          {n.text}
        </div>
      ))}
    </div>
  )
}
