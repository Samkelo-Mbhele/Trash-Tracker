import { useAppState } from '../../lib/store'

const tiers = [
  { name: 'Gold', color: 'text-amber-600', fill: 'bg-amber-500', wash: 'bg-amber-50 border-amber-200' },
  { name: 'Silver', color: 'text-slate-500', fill: 'bg-slate-400', wash: 'bg-slate-50 border-slate-200' },
  { name: 'Bronze', color: 'text-orange-700', fill: 'bg-orange-700', wash: 'bg-orange-50 border-orange-200' },
] as const

export default function Overview() {
  const { greenBelts, reports, orgName } = useAppState()
  const sponsored = greenBelts.filter((belt) => belt.tier)
  const cleared = reports.filter((report) => report.status === 'Cleared').length
  const months = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - offset))
    const count = reports.filter((report) => {
      const reported = report.reportedAt?.toDate()
      return reported && reported.getMonth() === date.getMonth() && reported.getFullYear() === date.getFullYear()
    }).length
    const cleaned = reports.filter((report) => {
      const reported = report.reportedAt?.toDate()
      return report.status === 'Cleared' && reported && reported.getMonth() === date.getMonth() && reported.getFullYear() === date.getFullYear()
    }).length
    return { label: date.toLocaleDateString('en-ZA', { month: 'short' }), count, cleaned }
  })
  const maxCount = Math.max(1, ...months.map((month) => month.count))
  const wasteCounts = ['Plastic', 'Organic', 'Hazardous'].map((type) => ({ type, count: reports.filter((report) => report.wasteType === type).length }))
  const maxWaste = Math.max(1, ...wasteCounts.map((item) => item.count))

  return <div className="space-y-5">
    <section className="relative overflow-hidden rounded-2xl bg-[#063e30] px-5 py-5 text-white sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full border-[28px] border-emerald-300/10" />
      <p className="text-xs text-emerald-100/70">COMPANY OVERVIEW</p>
      <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Welcome back, {orgName || 'Company'}</h1>
      <p className="mt-1 max-w-xl text-sm text-emerald-50/75">Track your community impact and the green spaces you support.</p>
    </section>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: 'Reports cleared', value: cleared, detail: `${reports.length ? Math.round((cleared / reports.length) * 100) : 0}% of reports`, color: 'text-emerald-700', mark: '' },
        { label: 'Reports received', value: reports.length, detail: 'Across the platform', color: 'text-amber-600', mark: '+' },
        { label: 'Green belts sponsored', value: `${sponsored.length} / ${greenBelts.length}`, detail: 'Supported parks', color: 'text-emerald-700', mark: '' },
        { label: 'Waste types reported', value: wasteCounts.filter((item) => item.count > 0).length, detail: 'Tracked categories', color: 'text-teal-700', mark: '+' },
      ].map((stat) => <article key={stat.label} className="rounded-2xl border border-[#dce7dd] bg-white p-4 shadow-sm sm:p-5">
        <span className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-base font-bold ${stat.color}`}>{stat.mark}</span>
        <p className="text-xs text-slate-500">{stat.label}</p><p className="mt-1 font-display text-3xl font-bold text-[#142b24]">{stat.value}</p><p className="mt-1 text-[11px] text-slate-400">{stat.detail}</p>
      </article>)}
    </section>

    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="rounded-2xl border border-[#dce7dd] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-base font-bold">Platform activity over time</h2><p className="text-xs text-slate-500">Reports received and cleared by month</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-800">Last 6 months</span></div>
        <div className="flex h-44 items-end justify-around gap-3 border-b border-slate-100 px-2">
          {months.map((month) => <div key={month.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-[82%] w-full max-w-10 items-end overflow-hidden rounded-t-md bg-amber-100"><div className="w-full bg-emerald-700" style={{ height: `${month.count ? Math.max(10, (month.cleaned / maxCount) * 100) : 0}%` }} /><div className="w-full bg-amber-400" style={{ height: `${month.count ? Math.max(8, ((month.count - month.cleaned) / maxCount) * 100) : 0}%` }} /></div>
            <span className="pb-2 text-[10px] text-slate-500">{month.label}</span>
          </div>)}
        </div>
        <div className="mt-3 flex gap-4 text-[10px] text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-emerald-700" />Reports cleared</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-amber-400" />Reports received</span></div>
      </section>

      <section className="rounded-2xl border border-[#dce7dd] bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-display text-base font-bold">Platform reports by category</h2><p className="mb-5 text-xs text-slate-500">Current report totals by waste category</p>
        <div className="space-y-4">{wasteCounts.map((item, index) => <div key={item.type}>
          <div className="mb-1.5 flex justify-between text-xs"><span>{item.type}</span><span className="font-semibold">{reports.length ? Math.round(item.count / reports.length * 100) : 0}%</span></div>
          <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${['bg-emerald-700', 'bg-amber-400', 'bg-orange-500'][index]}`} style={{ width: `${item.count / maxWaste * 100}%` }} /></div>
          <p className="mt-1 text-[10px] text-slate-400">{item.count} reports</p>
        </div>)}</div>
        <p className="mt-5 border-t border-slate-100 pt-3 text-[10px] text-slate-400">Impact is calculated from reports currently in the portal.</p>
      </section>
    </div>

    <section className="rounded-2xl border border-[#dce7dd] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-end justify-between"><div><h2 className="font-display text-base font-bold">Green belts by sponsorship tier</h2><p className="text-xs text-slate-500">Current platform sponsorship records</p></div><span className="text-xs text-slate-500">{sponsored.length} sponsored</span></div>
      <div className="grid gap-3 sm:grid-cols-3">{tiers.map((tier) => {
        const count = sponsored.filter((belt) => belt.tier === tier.name).length
        const total = greenBelts.length ? Math.round(count / greenBelts.length * 100) : 0
        return <article key={tier.name} className={`rounded-xl border p-4 ${tier.wash}`}><p className={`font-display font-bold ${tier.color}`}>{tier.name}</p><p className="mt-1 text-xs text-slate-600">{count} / {greenBelts.length} parks</p><div className="mt-3 h-1.5 rounded-full bg-black/10"><div className={`h-1.5 rounded-full ${tier.fill}`} style={{ width: `${total}%` }} /></div></article>
      })}</div>
    </section>
  </div>
}
