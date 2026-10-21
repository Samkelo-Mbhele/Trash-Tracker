import { useState } from 'react'
import { useAppState } from '../../lib/store'
import type { WasteType } from '../../lib/types'

const statusStyle: Record<string, string> = { New: 'bg-amber-100 text-amber-800', Clustered: 'bg-sky-100 text-sky-800', 'En route': 'bg-blue-100 text-blue-800', Cleared: 'bg-emerald-100 text-emerald-800' }

export default function Reports() {
  const { reports } = useAppState()
  const [filter, setFilter] = useState<WasteType | 'All'>('All')
  const filtered = (filter === 'All' ? reports : reports.filter((report) => report.wasteType === filter)).slice().sort((a, b) => (b.reportedAt?.toMillis() ?? 0) - (a.reportedAt?.toMillis() ?? 0))
  const exportCsv = () => {
    const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
    const rows = [['ID', 'Type', 'Location', 'Status', 'Verification', 'Reported at'], ...filtered.map((report) => [report.displayId, report.wasteType, report.location, report.status, report.verification ?? 'Pending', report.reportedAt?.toDate().toISOString() ?? ''])]
    const blob = new Blob([rows.map((row) => row.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'trash-tracker-reports.csv'
    link.click()
    URL.revokeObjectURL(url)
  }
  const filters: (WasteType | 'All')[] = ['All', 'Plastic', 'Organic', 'Hazardous']

  return <div className="space-y-5">
    <section className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[0.12em] text-emerald-700">SPONSOR DASHBOARD</p><h1 className="mt-1 font-display text-2xl font-bold">Community reports</h1><p className="mt-1 text-sm text-slate-500">Reports currently recorded on the platform.</p></div><button onClick={exportCsv} className="rounded-xl bg-[#003b2c] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-900">Export CSV</button></section>
    <div className="flex gap-2 overflow-x-auto pb-1">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${filter === item ? 'border-[#003b2c] bg-[#003b2c] text-white' : 'border-[#dce7dd] bg-white text-slate-600 hover:bg-emerald-50'}`}>{item}</button>)}</div>
    <section className="space-y-2">{filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-5 py-12 text-center"><p className="font-semibold">No reports in this category yet</p><p className="mt-1 text-sm text-slate-500">New community reports will appear here.</p></div> : filtered.map((report) => <article key={report.id} className="flex items-center gap-3 rounded-2xl border border-[#dce7dd] bg-white p-3 shadow-sm sm:gap-4 sm:p-3.5">
      {report.photoThumbnail ? <img src={report.photoThumbnail} alt={`${report.wasteType} waste`} className="h-[72px] w-[76px] shrink-0 rounded-xl object-cover sm:h-[78px] sm:w-[88px]"/> : <div className="flex h-[72px] w-[76px] shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-[10px] text-slate-400 sm:h-[78px] sm:w-[88px]">No photo</div>}
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold">#{report.displayId}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyle[report.status] ?? 'bg-slate-100 text-slate-700'}`}>{report.verification ?? 'Pending'}</span></div><p className="mt-1 truncate text-xs text-slate-600">Location: &nbsp;{report.location}</p><p className="mt-1 text-[11px] text-slate-500">Waste: &nbsp;{report.wasteType} waste</p><p className="mt-1 text-[11px] text-slate-500">{report.status === 'Cleared' ? 'Completed' : report.status}</p></div>
      <time className="hidden shrink-0 text-[10px] text-slate-400 sm:block">{report.reportedAt?.toDate().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) ?? '-'}</time>
    </article>)}</section>
  </div>
}

