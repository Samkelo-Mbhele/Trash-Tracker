import { useAppState } from '../../lib/store'

const colors = ['#10b981', '#f4bd35', '#f04438']

export default function Analytics() {
  const { reports, crews } = useAppState()
  const cleared = reports.filter((report) => report.status === 'Cleared').length
  const active = reports.filter((report) => report.status !== 'Cleared').length
  const verified = reports.filter((report) => report.verification === 'Verified').length
  const clearRate = reports.length ? Math.round(cleared / reports.length * 100) : 0
  const byType = (['Plastic', 'Organic', 'Hazardous'] as const).map((type) => ({ type, count: reports.filter((report) => report.wasteType === type).length }))
  const total = Math.max(1, reports.length)
  const typePercent = byType.map((item) => item.count / total * 100)
  const donut = `conic-gradient(${colors.map((color, index) => `${color} ${typePercent.slice(0, index).reduce((sum, value) => sum + value, 0)}% ${typePercent.slice(0, index + 1).reduce((sum, value) => sum + value, 0)}%`).join(', ')})`
  const weeks = Array.from({ length: 5 }, (_, index) => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (4 - index) * 7 - start.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return { label: start.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }), count: reports.filter((report) => { const date = report.reportedAt?.toDate(); return date && date >= start && date < end }).length }
  })
  const maxWeek = Math.max(1, ...weeks.map((week) => week.count))
  const points = weeks.map((week, index) => `${30 + index * 70},${125 - week.count / maxWeek * 85}`).join(' ')

  return <div className="space-y-4">
    <section className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[0.12em] text-emerald-700">ANALYTICS</p><h1 className="mt-1 font-display text-2xl font-bold">Pilot performance</h1><p className="mt-1 text-sm text-slate-500">Live insights from reports and cleanups.</p></div><span className="rounded-full bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">All time</span></section>
    <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">{[
      { label: 'Active tickets', value: active, sub: `${reports.length} reports total`, mark: '!', color: 'text-red-500' },
      { label: 'Cleared', value: cleared, sub: `${clearRate}% clear rate`, mark: '', color: 'text-emerald-600' },
      { label: 'Verified', value: verified, sub: 'Approved reports', mark: '', color: 'text-amber-600' },
      { label: 'Crews active', value: crews.filter((crew) => crew.status === 'En route' || crew.status === 'Cleaning').length, sub: `${crews.length} total crews`, mark: '+', color: 'text-sky-700' },
    ].map((metric) => <article key={metric.label} className="rounded-2xl border border-[#e0e9e1] bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><p className="text-xs text-slate-500">{metric.label}</p><span className={`text-lg ${metric.color}`}>{metric.mark}</span></div><p className="mt-2 font-display text-3xl font-bold">{metric.value}</p><p className="mt-1 text-[10px] text-slate-400">{metric.sub}</p></article>)}</section>

    <section className="rounded-2xl border border-[#e0e9e1] bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between"><div><h2 className="font-display text-base font-bold">Reports over time</h2><p className="text-xs text-slate-500">Reports submitted each week</p></div><span className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] text-slate-600">Weekly</span></div>
      <div className="mt-4 overflow-hidden"><svg viewBox="0 0 340 155" className="h-44 w-full" preserveAspectRatio="none" role="img" aria-label="Weekly report submission chart"><line x1="25" y1="125" x2="330" y2="125" stroke="#e2e8e3"/><line x1="25" y1="82" x2="330" y2="82" stroke="#edf1ed"/><line x1="25" y1="39" x2="330" y2="39" stroke="#edf1ed"/><text x="0" y="128" fontSize="9" fill="#87938c">0</text><text x="0" y="85" fontSize="9" fill="#87938c">{Math.ceil(maxWeek / 2)}</text><text x="0" y="42" fontSize="9" fill="#87938c">{maxWeek}</text><polyline points={points} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{weeks.map((week, index) => <g key={week.label}><circle cx={30 + index * 70} cy={125 - week.count / maxWeek * 85} r="4" fill="#10b981"/><text x={30 + index * 70} y="148" textAnchor="middle" fontSize="9" fill="#87938c">{week.label}</text></g>)}</svg></div>
      <div className="mt-1 flex flex-wrap gap-4 text-[10px] text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500"/>Report submissions</span><span>Weekly totals reflect report submission dates.</span></div>
    </section>

    <section className="rounded-2xl border border-[#e0e9e1] bg-white p-4 shadow-sm sm:p-5"><h2 className="font-display text-base font-bold">Reports by waste type</h2><p className="text-xs text-slate-500">Distribution across all submitted reports</p>
      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[190px_1fr]"><div className="flex justify-center"><div className="relative h-40 w-40 rounded-full" style={{ background: donut }}><div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white"><span className="font-display text-2xl font-bold">{reports.length}</span><span className="text-[10px] text-slate-500">total reports</span></div></div></div>
        <div className="space-y-3">{byType.map((item, index) => <div key={item.type} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index] }}/>{item.type}</span><span className="text-slate-500">{item.count} &nbsp; | &nbsp; {Math.round(item.count / total * 100)}%</span></div>)}</div></div>
    </section>
  </div>
}
