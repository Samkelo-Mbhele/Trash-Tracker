import { useMemo, useState, type FormEvent } from 'react'
import { useAppState } from '../../lib/store'
import type { CrewStatus } from '../../lib/types'

const statusStyle: Record<CrewStatus, string> = { Available: 'bg-emerald-100 text-emerald-800', 'En route': 'bg-blue-100 text-blue-800', Cleaning: 'bg-amber-100 text-amber-800', 'Off duty': 'bg-red-100 text-red-700' }
const statusDot: Record<CrewStatus, string> = { Available: 'bg-emerald-500', 'En route': 'bg-blue-500', Cleaning: 'bg-amber-500', 'Off duty': 'bg-red-500' }

export default function Crews() {
  const { crews, reports, startCleaning, createCrew } = useAppState()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<CrewStatus | 'All status'>('All status')
  const [name, setName] = useState('')
  const [size, setSize] = useState('')
  const [newStatus, setNewStatus] = useState<CrewStatus>('Available')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const active = crews.filter((crew) => crew.status === 'En route' || crew.status === 'Cleaning').length
  const offDuty = crews.filter((crew) => crew.status === 'Off duty').length
  const filtered = useMemo(() => crews.filter((crew) => (filter === 'All status' || crew.status === filter) && crew.name.toLowerCase().includes(search.toLowerCase())), [crews, filter, search])

  const addCrew = async (event: FormEvent) => {
    event.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await createCrew(name, Number(size), newStatus)
      setName('')
      setSize('')
      setNewStatus('Available')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not create crew.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="space-y-4">
    <section className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[0.12em] text-emerald-700">CREW MANAGEMENT</p><h1 className="mt-1 font-display text-2xl font-bold">Crews</h1><p className="mt-1 text-sm text-slate-500">Manage crews, assignments and live status.</p></div><span className="rounded-full bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">{crews.length} total crews</span></section>
    <section className="grid grid-cols-3 gap-2"><Stat label="Total crews" value={crews.length} dot="bg-sky-700"/><Stat label="Active crews" value={active} dot="bg-emerald-500"/><Stat label="Off duty" value={offDuty} dot="bg-red-500"/></section>
    <form onSubmit={addCrew} className="grid gap-3 rounded-2xl border border-[#dce7dd] bg-white p-4 sm:grid-cols-4">
      <input required value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Crew name" aria-label="Crew name" className="min-h-11 rounded-xl border border-[#dce7dd] px-3 text-sm" />
      <input required type="number" min="1" step="1" value={size} onChange={(event) => setSize(event.target.value)} placeholder="Crew size" aria-label="Crew size" className="min-h-11 rounded-xl border border-[#dce7dd] px-3 text-sm" />
      <select value={newStatus} onChange={(event) => setNewStatus(event.target.value as CrewStatus)} aria-label="Crew status" className="min-h-11 rounded-xl border border-[#dce7dd] bg-white px-3 text-sm">{(['Available', 'En route', 'Cleaning', 'Off duty'] as CrewStatus[]).map((status) => <option key={status}>{status}</option>)}</select>
      <button disabled={saving} className="min-h-11 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Adding...' : 'Add crew'}</button>
      {formError && <p role="alert" className="text-sm text-red-700 sm:col-span-4">{formError}</p>}
    </form>
    <div className="flex flex-col gap-2 sm:flex-row"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[#dce7dd] bg-white px-3 text-slate-400"><span aria-hidden="true">Search:</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search crews..." className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"/></label><select value={filter} onChange={(event) => setFilter(event.target.value as CrewStatus | 'All status')} className="min-h-11 rounded-xl border border-[#dce7dd] bg-white px-3 text-xs text-slate-700"><option>All status</option><option>Available</option><option>En route</option><option>Cleaning</option><option>Off duty</option></select></div>
    <section className="space-y-2">{filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-10 text-center"><p className="font-semibold">{crews.length ? 'No crews match your filters' : 'No crews added yet'}</p><p className="mt-1 text-sm text-slate-500">Crew records will appear here when they are available.</p></div> : filtered.map((crew) => {
      const task = reports.find((report) => report.id === crew.currentTask)
      const stage = crew.status === 'Available' ? 0 : crew.status === 'En route' ? 1 : crew.status === 'Cleaning' ? 2 : -1
      return <article key={crew.id} className="flex items-center gap-3 rounded-2xl border border-[#dce7dd] bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
        <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-[9px] text-slate-400">No image</div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-sm font-bold">{crew.name}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyle[crew.status]}`}><i className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${statusDot[crew.status]}`}/>{crew.status}</span></div><p className="mt-1 truncate text-xs text-slate-500">{task ? `Current task: ${task.displayId}  |  ${task.location}` : crew.status === 'Off duty' ? 'Off duty for the day' : 'No active assignment'}</p>
          <div className="mt-3 hidden items-center gap-1 sm:flex">{['Available', 'En route', 'Cleaning', 'Completed'].map((label, step) => <div key={label} className="flex flex-1 items-center gap-1"><i className={`h-2.5 w-2.5 shrink-0 rounded-full ${stage >= step ? 'bg-emerald-500' : 'bg-slate-300'}`}/><span className={`truncate text-[9px] ${stage === step ? 'font-semibold text-emerald-800' : 'text-slate-400'}`}>{label}</span>{step < 3 && <span className={`h-px flex-1 ${stage > step ? 'bg-emerald-400' : 'bg-slate-200'}`}/>}</div>)}</div>
        </div>
        {crew.status === 'En route' && task && <button onClick={() => startCleaning(crew.id)} className="shrink-0 rounded-lg bg-amber-500 px-3 py-2 text-[11px] font-semibold text-white">Start cleaning</button>}
        {task && <span className="hidden rounded-full bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-800 lg:block">{task.displayId}</span>}
      </article>
    })}</section>
  </div>
}

function Stat({ label, value, dot }: { label: string; value: number; dot: string }) {
  return <article className="rounded-xl border border-[#e0e9e1] bg-white px-3 py-2.5 shadow-sm"><div className="flex items-center gap-2"><i className={`h-2.5 w-2.5 rounded-full ${dot}`}/><span className="text-xs text-slate-500">{label}</span></div><p className="mt-1 font-display text-xl font-bold">{value}</p></article>
}

