import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../../lib/store'
import { formatTimestamp } from '../../lib/format'
import { DURBAN_CENTER } from '../../lib/mapConfig'
import { getCurrentPosition, type Coords } from '../../lib/geolocation'
import { distanceKm } from '../../lib/distance'
import LeafletMap, { type MapMarker } from '../../components/LeafletMap'

export default function CitizenHome() {
  const { reports, citizen } = useAppState()
  const navigate = useNavigate()
  const [currentLocation, setCurrentLocation] = useState<Coords | null>(null)
  const nearbyReports = currentLocation
    ? reports.filter((report) => report.lat !== undefined && report.lng !== undefined && distanceKm(currentLocation, report) <= 25)
    : reports
  const visibleReports = nearbyReports.filter((report) => report.verification !== 'Rejected')
  const active = visibleReports.filter((report) => report.status !== 'Cleared')

  useEffect(() => {
    let cancelled = false
    // Show the user's location only when permission was already granted;
    // opening Home should not trigger an unexpected location prompt.
    navigator.permissions?.query({ name: 'geolocation' }).then((permission) => {
      if (permission.state !== 'granted') return
      getCurrentPosition().then((position) => { if (!cancelled) setCurrentLocation(position) }).catch(() => undefined)
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  const markers: MapMarker[] = [
    ...visibleReports.filter((report) => report.lat !== undefined && report.lng !== undefined).map((report) => {
      const color = report.status === 'Cleared' ? '#35bf58' : report.status === 'En route' ? '#e5ad32' : '#df543a'
      return { id: report.id, lat: report.lat!, lng: report.lng!, color, label: `${report.status}  |  ${report.wasteType}  |  ${report.location}` }
    }),
    ...(currentLocation ? [{ id: 'current-location', lat: currentLocation.lat, lng: currentLocation.lng, color: '#48a7ff', label: 'Your current location' }] : []),
  ]

  return <div className="space-y-3 pb-4 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0">
    <section className="pt-1 md:col-span-2">
      <h1 className="font-display text-2xl font-bold">{citizen.nickname ? `Welcome, ${citizen.nickname}` : 'Welcome'}</h1>
      <p className="text-paper/70 text-sm mt-1">Help keep your community clean.</p>
    </section>

    <section className="relative h-[180px] min-[390px]:h-[200px] min-[412px]:h-[220px] rounded-2xl overflow-hidden border border-paper/20 shadow-lg md:col-start-1 md:row-start-2 md:h-[min(60vh,640px)]" aria-label="Nearby waste reports map">
      <LeafletMap center={currentLocation ? [currentLocation.lat, currentLocation.lng] : DURBAN_CENTER} zoom={11} markers={markers} className="w-full h-full" />
      <span className="absolute z-[1000] top-3 left-3 rounded-full bg-ink/90 border border-paper/30 px-3.5 py-2 text-sm shadow">{active.length} active {currentLocation ? 'nearby reports' : 'reports'}</span>
      <button onClick={() => navigate('/citizen/map')} className="absolute z-[1000] bottom-3 right-3 rounded-full bg-ink/85 px-3.5 py-2 text-sm text-paper shadow">View map</button>
    </section>

    <div className="md:col-start-2 md:row-start-2 md:flex md:flex-col md:gap-6">
    <button onClick={() => navigate('/citizen/report')} className="w-full min-h-[54px] rounded-2xl bg-gold text-ink px-5 py-3 font-display text-lg font-bold shadow-lg flex items-center justify-between md:min-h-16" aria-label="Report waste using the camera">
      <span aria-hidden="true"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h3l1.5-2h7L17 7h3v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg></span><span>Report waste</span>
    </button>

    <section className="rounded-2xl border border-emerald-200/25 bg-black/10 p-3.5 mt-3 md:mt-0" aria-labelledby="citizen-impact-heading">
      <h2 id="citizen-impact-heading" className="font-display text-base font-bold mb-2.5">Your impact</h2>
      <div className="grid grid-cols-2 divide-x divide-paper/20 text-center">
        <div className="px-1"><p className="text-xl font-bold">{citizen.reportsSubmitted}</p><p className="text-[11px] leading-tight text-paper/65">Reports submitted</p></div>
        <div className="px-1"><p className="text-xl font-bold text-green-400">{citizen.reportsVerified}</p><p className="text-[11px] leading-tight text-paper/65">Reports verified</p></div>
      </div>
    </section>
    </div>

    <section className="md:col-span-2">
      <div className="flex items-center justify-between mb-2"><h2 className="font-display text-lg font-bold">Nearby reports</h2><button className="min-h-11 text-gold text-sm" onClick={() => navigate('/citizen/map')}>View all</button></div>
      {visibleReports.length === 0 ? <div className="rounded-2xl border border-paper/15 p-4 text-sm text-paper/60">{currentLocation ? 'No reports within 25 km yet. Be the first to help your community.' : 'No reports have been submitted yet.'}</div> : <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">{visibleReports.slice(0, 6).map((report) => <article key={report.id} className="min-w-[190px] snap-start rounded-2xl border border-paper/15 bg-black/10 overflow-hidden">
        {report.photoThumbnail ? <img src={report.photoThumbnail} alt={`${report.wasteType} waste at ${report.location}`} className="w-full h-24 object-cover" /> : <div className="w-full h-24 bg-black/20 flex items-center justify-center text-xs text-paper/45">No photo</div>}
        <div className="p-3"><span className="text-xs text-gold">{report.status === 'New' ? 'Reported' : report.status}</span><h3 className="font-semibold mt-1">{report.wasteType} waste</h3><p className="text-xs text-paper/65 mt-1">Location: {report.location}</p><p className="text-xs text-paper/45 mt-1">Review: {report.verification ?? 'Pending'}</p><p className="text-xs text-paper/45 mt-2">{formatTimestamp(report.reportedAt)}</p></div>
      </article>)}</div>}
    </section>

  </div>
}

