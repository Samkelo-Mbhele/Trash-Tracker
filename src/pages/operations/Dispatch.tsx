import { useState } from 'react'
import { useAppState } from '../../lib/store'
import { formatTimestamp } from '../../lib/format'
import { DURBAN_CENTER } from '../../lib/mapConfig'
import { getMunicipality } from '../../lib/municipalities'
import LeafletMap, { type MapMarker } from '../../components/LeafletMap'

const markerColors: Record<string, string> = { New: '#f04438', Clustered: '#3b82f6', 'En route': '#f4bd35', Cleared: '#10b981' }

export default function Dispatch() {
  const { reports, crews, municipalityId, assignCrew, markCleared, reviewReport } = useAppState()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const selected = reports.find((report) => report.id === selectedId) ?? null
  const availableCrews = crews.filter((crew) => crew.status === 'Available')
  const cleared = reports.filter((report) => report.status === 'Cleared').length
  const inProgress = reports.filter((report) => report.status === 'En route').length
  const unassigned = reports.filter((report) => report.status !== 'Cleared' && report.status !== 'En route' && report.verification === 'Verified' && !report.crewId).length
  const onHold = reports.length - cleared - inProgress - unassigned
  const markers: MapMarker[] = reports.filter((report) => report.lat !== undefined && report.lng !== undefined).map((report) => ({
    id: report.id, lat: report.lat!, lng: report.lng!, color: markerColors[report.status] ?? '#f4bd35', label: `${report.displayId}  |  ${report.wasteType}  |  ${report.location}`,
  }))

  const stats = [
    { label: 'Unassigned', value: unassigned, color: 'bg-red-500', dot: 'bg-red-500' },
    { label: 'In progress', value: inProgress, color: 'bg-amber-400', dot: 'bg-amber-400' },
    { label: 'Completed', value: cleared, color: 'bg-emerald-500', dot: 'bg-emerald-500' },
    { label: 'On hold', value: onHold, color: 'bg-slate-400', dot: 'bg-slate-400' },
  ]

  return <div className="space-y-4">
    <section className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[0.12em] text-emerald-700">DISPATCH QUEUE</p><h1 className="mt-1 font-display text-2xl font-bold">Active reports</h1><p className="mt-1 text-sm text-slate-500">Assign crews and track cleanup progress.</p></div><span className="rounded-full bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">{reports.length} total reports</span></section>
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">{stats.map((stat) => <article key={stat.label} className="rounded-xl border border-[#e0e9e1] bg-white px-3 py-2.5 shadow-sm"><div className="flex items-center gap-2"><i className={`h-2.5 w-2.5 rounded-full ${stat.dot}`} /><span className="text-xs text-slate-500">{stat.label}</span></div><p className="mt-1 font-display text-xl font-bold">{stat.value}</p></article>)}</section>

    <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
      <div className="space-y-4">
        <section className="relative h-[230px] overflow-hidden rounded-2xl border border-[#dce7dd] bg-white shadow-sm sm:h-[280px]"><LeafletMap center={getMunicipality(municipalityId)?.center ?? DURBAN_CENTER} zoom={11} markers={markers} onMarkerClick={setSelectedId} className="h-full w-full"/><div className="absolute bottom-2 left-2 z-[1000] flex flex-wrap gap-3 rounded-lg bg-white/95 px-3 py-2 text-[10px] shadow"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-red-500"/>Unassigned</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-400"/>In progress</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500"/>Completed</span></div></section>
        <section className="space-y-2"><div className="flex items-center justify-between"><h2 className="font-display text-base font-bold">Recent reports</h2><span className="text-xs text-emerald-800">{reports.length} reports</span></div>
          {reports.length === 0 ? <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-8 text-center text-sm text-slate-500">No reports have been submitted yet.</div> : reports.map((report) => <button key={report.id} onClick={() => setSelectedId(report.id)} className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition-colors ${selectedId === report.id ? 'border-emerald-600 ring-1 ring-emerald-600/20' : 'border-[#dce7dd] hover:border-emerald-300'}`}>
            {report.photoThumbnail ? <img src={report.photoThumbnail} alt={`${report.wasteType} waste`} className="h-14 w-16 shrink-0 rounded-xl object-cover"/> : <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-[9px] text-slate-400">No photo</div>}
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="text-sm">#{report.displayId}</b><span className={`rounded-full px-2 py-0.5 text-[10px] ${report.verification === 'Verified' ? 'bg-emerald-100 text-emerald-800' : report.verification === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{report.verification ?? 'Pending'}</span></span><span className="mt-1 block truncate text-xs text-slate-600">{report.location}</span><span className="mt-1 block text-[10px] text-slate-500">{report.wasteType} waste  |  {formatTimestamp(report.reportedAt)}</span></span>
            <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] sm:inline">{report.status === 'Cleared' ? 'Completed' : report.status}</span>
          </button>)}
        </section>
      </div>

      <section className="self-start rounded-2xl border border-[#dce7dd] bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-500">TICKET DETAIL</p>
        {!selected ? <div className="flex min-h-44 items-center justify-center text-center text-sm text-slate-400">Select a report to review<br/>and dispatch it.</div> : <div className="mt-3">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-xl font-bold">#{selected.displayId}</h2><p className="mt-1 text-sm text-slate-600">{selected.wasteType} waste  |  {selected.location}</p></div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">{selected.status}</span></div>
          <p className="mt-2 text-[11px] text-slate-400">Reported {formatTimestamp(selected.reportedAt)}</p>
          {selected.photoThumbnail && <img src={selected.photoThumbnail} alt={`Evidence for ${selected.displayId}`} className="mt-4 max-h-52 w-full rounded-xl object-cover"/>}
          {reviewError && <p role="alert" className="mt-3 text-xs text-red-600">{reviewError}</p>}
          {(selected.verification ?? 'Pending') === 'Pending' && <div className="mt-4 rounded-xl bg-amber-50 p-3"><p className="mb-3 text-xs text-amber-900">Review the report before assigning a cleanup crew.</p><div className="flex gap-2"><button disabled={reviewing} className="flex-1 rounded-lg bg-[#003b2c] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50" onClick={async () => { setReviewing(true); setReviewError(''); try { await reviewReport(selected.id, 'Verified') } catch (error) { setReviewError(error instanceof Error ? error.message : 'Could not verify this report.') } finally { setReviewing(false) } }}>Verify report</button><button disabled={reviewing} className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-50" onClick={async () => { setReviewing(true); setReviewError(''); try { await reviewReport(selected.id, 'Rejected') } catch (error) { setReviewError(error instanceof Error ? error.message : 'Could not reject this report.') } finally { setReviewing(false) } }}>Reject</button></div></div>}
          {selected.verification === 'Rejected' && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">Rejected reports cannot be dispatched.</p>}
          {selected.verification === 'Verified' && selected.status !== 'Cleared' && selected.status !== 'En route' && <div className="mt-4"><p className="mb-2 text-xs font-semibold">Assign to crew</p>{availableCrews.length === 0 ? <p className="text-xs text-slate-500">No crews are available right now.</p> : <div className="space-y-2">{availableCrews.map((crew) => <button key={crew.id} onClick={() => assignCrew(selected.id, crew.id)} className="w-full rounded-lg border border-[#dce7dd] px-3 py-2.5 text-left text-xs font-semibold hover:bg-emerald-50">+ &nbsp;{crew.name}</button>)}</div>}</div>}
          {selected.verification === 'Verified' && selected.status === 'En route' && <button className="mt-4 w-full rounded-lg bg-emerald-600 px-3 py-3 text-xs font-semibold text-white" onClick={() => markCleared(selected.id)}>Mark cleanup completed</button>}
        </div>}
      </section>
    </div>
  </div>
}

