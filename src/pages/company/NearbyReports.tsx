import { useState } from 'react'
import { useAppState } from '../../lib/store'
import { formatTimestamp } from '../../lib/format'
import { DURBAN_CENTER } from '../../lib/mapConfig'
import { getCurrentPosition, type Coords } from '../../lib/geolocation'
import { distanceKm } from '../../lib/distance'
import LeafletMap, { type MapMarker } from '../../components/LeafletMap'

const NEARBY_RADIUS_KM = 25

/**
 * Home screen for individual (collector) accounts on the company portal: a
 * read-only map and list of waste that still needs collecting. Collectors
 * cannot claim or update a report here.
 */
export default function NearbyReports() {
  const { reports } = useAppState()
  const [location, setLocation] = useState<Coords | null>(null)
  const [locationMessage, setLocationMessage] = useState('')
  const [locating, setLocating] = useState(false)

  const open = reports.filter(
    (report) => report.status !== 'Cleared' && report.verification !== 'Rejected' && report.lat !== undefined && report.lng !== undefined,
  )
  const nearby = location
    ? open
        .filter((report) => distanceKm(location, report) <= NEARBY_RADIUS_KM)
        .sort((a, b) => distanceKm(location, a) - distanceKm(location, b))
    : open

  const markers: MapMarker[] = [
    ...nearby.map((report) => ({
      id: report.id,
      lat: report.lat!,
      lng: report.lng!,
      color: report.status === 'En route' ? '#e5ad32' : '#df543a',
      label: `${report.wasteType}  |  ${report.location}`,
    })),
    ...(location ? [{ id: 'current-location', lat: location.lat, lng: location.lng, color: '#48a7ff', label: 'Your current location' }] : []),
  ]
  const center: [number, number] = location ? [location.lat, location.lng] : nearby[0] ? [nearby[0].lat!, nearby[0].lng!] : DURBAN_CENTER

  const findMe = async () => {
    setLocating(true)
    setLocationMessage('')
    try {
      setLocation(await getCurrentPosition())
      setLocationMessage(`Showing waste within ${NEARBY_RADIUS_KM} km of you, nearest first.`)
    } catch {
      setLocationMessage('Your location was unavailable. Showing all reported waste.')
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-emerald-700">COLLECTOR</p>
          <h1 className="mt-1 font-display text-2xl font-bold">Nearby reports</h1>
          <p className="mt-1 text-sm text-slate-500">Reported waste that has not been cleared yet.</p>
        </div>
        <button
          type="button"
          onClick={findMe}
          disabled={locating}
          className="min-h-11 rounded-xl bg-[#f4bd35] px-4 text-xs font-semibold text-[#102c24] disabled:opacity-50"
        >
          {locating ? 'Finding you...' : location ? 'Refresh my location' : 'Find waste near me'}
        </button>
      </section>
      {locationMessage && <p className="text-xs text-slate-500" role="status">{locationMessage}</p>}

      <section className="relative h-[300px] overflow-hidden rounded-2xl border border-[#dce7dd] bg-white shadow-sm sm:h-[380px]" aria-label="Map of reported waste">
        <LeafletMap center={center} zoom={12} markers={markers} className="h-full w-full" />
        <span className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-[10px] shadow">
          {nearby.length} open {location ? 'nearby' : 'reports'}
        </span>
      </section>

      <section className="space-y-2">
        {nearby.length === 0 && (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-10 text-center">
            <p className="font-semibold">{location ? `No open reports within ${NEARBY_RADIUS_KM} km` : 'No open reports yet'}</p>
            <p className="mt-1 text-sm text-slate-500">New reports appear here as soon as they are submitted.</p>
          </div>
        )}
        {nearby.map((report) => (
          <article key={report.id} className="flex items-center gap-3 rounded-2xl border border-[#dce7dd] bg-white p-3 shadow-sm">
            {report.photoThumbnail && (
              <img src={report.photoThumbnail} alt={`${report.wasteType} waste at ${report.location}`} className="h-14 w-16 shrink-0 rounded-xl object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold">{report.wasteType} waste  |  {report.location}</h2>
              <p className="mt-1 truncate text-xs text-slate-500">
                {report.displayId}  |  {formatTimestamp(report.reportedAt)}
                {location ? `  |  ${distanceKm(location, report).toFixed(1)} km away` : ''}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${report.status === 'En route' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>
              {report.status === 'En route' ? 'Crew en route' : 'Not collected'}
            </span>
          </article>
        ))}
      </section>
    </div>
  )
}
