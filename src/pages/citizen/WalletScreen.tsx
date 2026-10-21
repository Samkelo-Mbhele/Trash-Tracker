import { useAppState } from '../../lib/store'
import { formatTimestamp } from '../../lib/format'
import Badge from '../../components/ui/Badge'
import type { RewardType } from '../../lib/types'

const rewardTone: Record<RewardType, 'sky' | 'gold' | 'moss'> = {
  Voucher: 'sky',
  Points: 'gold',
  Cash: 'moss',
}

export default function WalletScreen() {
  const { wallet } = useAppState()

  return (
    <div className="pt-1">
      <div className="rounded-2xl border border-paper/15 p-4 mb-6"><p className="font-semibold">Rewards are coming soon</p><p className="text-sm text-paper/60 mt-1">Rewards and redemption are not available yet.</p></div>

      <p className="tag text-paper/55 mb-2">TRANSACTIONS</p>
      <div className="flex flex-col gap-2 pb-4">
        {wallet.length === 0 && (
          <p className="text-xs text-paper/40 text-center py-6">No transactions yet.</p>
        )}
        {wallet.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl border border-paper/10 px-3.5 py-3">
            <div>
              <p className="text-sm">{t.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-paper/40">{formatTimestamp(t.date)}</p>
                {t.rewardType && <Badge tone={rewardTone[t.rewardType]}>{t.rewardType}</Badge>}
              </div>
            </div>
            <span className={`font-mono text-sm ${t.amount > 0 ? 'text-gold' : 'text-paper/50'}`}>
              {t.amount > 0 ? '+' : ''}{t.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
