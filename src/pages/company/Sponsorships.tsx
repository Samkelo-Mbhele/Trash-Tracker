import { useAppState } from '../../lib/store'
import type { SponsorTier } from '../../lib/types'

const tierTone: Record<SponsorTier, string> = {
  Gold: 'bg-amber-100 text-amber-800',
  Silver: 'bg-slate-100 text-slate-700',
  Bronze: 'bg-orange-100 text-orange-800',
}

export default function Sponsorships() {
  const { greenBelts } = useAppState()

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-emerald-700">SPONSOR DASHBOARD</p>
          <h1 className="mt-1 font-display text-2xl font-bold">Green belt sponsorships</h1>
          <p className="mt-1 text-sm text-slate-500">Current platform sponsorship records.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">{greenBelts.length} green belts</span>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Sponsorship totals by tier">
        {(['Gold', 'Silver', 'Bronze'] as const).map((tier) => {
          const count = greenBelts.filter((belt) => belt.tier === tier).length
          return (
            <article key={tier} className="rounded-2xl border border-[#dce7dd] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tierTone[tier]}`} aria-hidden="true">★</span>
                <div><p className="font-display font-bold">{tier}</p><p className="text-xs text-slate-500">{count} green belts</p></div>
              </div>
              <div className="mt-4 h-1.5 rounded-full bg-slate-100">
                <div className={`h-1.5 rounded-full ${tier === 'Gold' ? 'bg-amber-500' : tier === 'Silver' ? 'bg-slate-400' : 'bg-orange-700'}`} style={{ width: `${greenBelts.length ? count / greenBelts.length * 100 : 0}%` }} />
              </div>
            </article>
          )
        })}
      </section>

      <section className="space-y-2">
        {greenBelts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-5 py-12 text-center">
            <p className="font-semibold">No green belts to show yet</p>
            <p className="mt-1 text-sm text-slate-500">Green belts will appear here when they are added to the platform.</p>
          </div>
        ) : greenBelts.map((belt) => (
          <article key={belt.id} className="flex items-center gap-3 rounded-2xl border border-[#dce7dd] bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
            <div className="hidden h-[68px] w-[82px] shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400 sm:flex">No image</div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold">{belt.name}</h2>
              <p className="mt-1 text-[10px] text-slate-400">{belt.tier ? 'Currently sponsored' : 'Not yet sponsored'}</p>
            </div>
            {belt.tier && <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${tierTone[belt.tier]}`}>{belt.tier}</span>}
          </article>
        ))}
      </section>
      <p className="text-center text-[10px] text-slate-400">Sponsorship records are read-only here. Contact the platform team to update a sponsorship.</p>
    </div>
  )
}
