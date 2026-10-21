import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../../lib/store'
import { formatTimestamp } from '../../lib/format'
import { DURBAN_CENTER } from '../../lib/mapConfig'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LeafletMap, { type MapMarker, type HeatPoint } from '../../components/LeafletMap'
import { getCurrentPosition, type Coords } from '../../lib/geolocation'
import { distanceKm } from '../../lib/distance'

const NEARBY_RADIUS_KM = 25

const statusTone: Record<string, 'gold' | 'sky' | 'moss' | 'rust'> = {
  New: 'rust',
  Clustered: 'sky',
  'En route': 'gold',
  Cleared: 'moss',
}

const statusColor: Record<string, string> = {
  New: '#B5502E',
  Clustered: '#3F7387',
  'En route': '#D9A441',
  Cleared: '#2F5233',
}

const weightForStatus: Record<string, number> = {
  New: 1,
  Clustered: 0.85,
  'En route': 0.6,
  Cleared: 0.3,
}

export default function MapScreen() {
  const { reports } = useAppState()
  const navigate = useNavigate()
  const [view, setView] = useState<'pins' | 'heat'>('pins')
  const [location, setLocation] = useState<Coords | null>(null)
  const [locationMessage, setLocationMessage] = useState('')
  const [locating, setLocating] = useState(false)
  const locatedReports = location
    ? reports.filter((r) => r.lat !== undefined && r.lng !== undefined && distanceKm(location, r) <= NEARBY_RADIUS_KM)
    : reports
  const visibleReports = locatedReports.filter((r) => r.verification !== 'Rejected')
  const active = visibleReports.filter((r) => r.status !== 'Cleared')

  const resolved = visibleReports.filter((r) => r.lat !== undefined && r.lng !== undefined)

  const markers: MapMarker[] = resolved.map((r) => ({
    id: r.id,
    lat: r.lat!,
    lng: r.lng!,
    color: statusColor[r.status] ?? '#D9A441',
    label: `${r.wasteType} \u00b7 ${r.location}`,
  }))

  const heatPoints: HeatPoint[] = resolved.map((r) => ({
    lat: r.lat!,
    lng: r.lng!,
    weight: weightForStatus[r.status] ?? 0.5,
  }))

  const center: [number, number] = location ? [location.lat, location.lng] : markers.length > 0 ? [markers[0].lat, markers[0].lng] : DURBAN_CENTER

  return (
    <div className="pt-1 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] md:gap-6">
      <div className="flex items-center gap-2 mb-3 md:col-span-2">
        <button
          onClick={() => setView('pins')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            view === 'pins' ? 'bg-gold text-ink border-gold' : 'border-paper/20 text-paper/60'
          }`}
        >
          Pins
        </button>
        <button
          onClick={() => setView('heat')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            view === 'heat' ? 'bg-gold text-ink border-gold' : 'border-paper/20 text-paper/60'
          }`}
        >
          Heat map
        </button>
      </div>
      <button
        type="button"
        disabled={locating}
        onClick={async () => {
          setLocating(true)
          setLocationMessage('')
          try {
            setLocation(await getCurrentPosition())
            setLocationMessage('Showing reports within 25 km of your location.')
          } catch {
            setLocationMessage('Location was unavailable. Showing all geotagged reports.')
          } finally { setLocating(false) }
        }}
        className="mb-3 rounded-full border border-paper/20 px-3 py-2 text-xs text-paper/75 disabled:opacity-50 md:col-span-2 md:justify-self-start"
      >{locating ? 'Finding you...' : location ? 'Refresh nearby location' : 'Find reports near me'}</button>
      {locationMessage && <p className="text-xs text-paper/55 mb-3 md:col-span-2" role="status">{locationMessage}</p>}
      <div className="rounded-2xl overflow-hidden relative h-48 mb-4 border border-paper/10 md:col-start-1 md:row-start-4 md:mb-0 md:h-[min(68vh,760px)] md:min-h-[480px]">
        <LeafletMap
          center={center}
          zoom={12}
          markers={view === 'pins' ? markers : []}
          heatPoints={view === 'heat' ? heatPoints : undefined}
          className="w-full h-full"
        />
        <span className="absolute bottom-2 left-3 tag text-paper bg-ink/70 px-2 py-1 rounded-full pointer-events-none z-[1000]">
          {active.length} active {location ? 'nearby' : 'reports'}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3 md:col-start-2 md:row-start-4 md:self-start">
        <h1 className="font-display text-lg font-semibold">Nearby reports</h1>
        <Button onClick={() => navigate('/citizen/report')} className="!py-2 !px-3.5">
          + Report
        </Button>
      </div>

      <div className="flex flex-col gap-2 pb-4 md:col-start-2 md:row-start-4 md:mt-14 md:max-h-[calc(68vh-4rem)] md:overflow-y-auto">
        {visibleReports.length === 0 && (
          <p className="text-xs text-paper/40 text-center py-6">{location ? 'No reports within 25 km yet.' : 'No reports have been submitted yet.'}</p>
        )}
        {visibleReports.map((r) => (
          <div key={r.id} className="rounded-xl border border-paper/10 px-3.5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm">{r.wasteType}  |  {r.location}</p>
              <p className="text-xs text-paper/45">{r.displayId}  |  {formatTimestamp(r.reportedAt)}</p>
              <p className="text-[10px] text-paper/40 mt-1">Review: {r.verification ?? 'Pending'}</p>
            </div>
            <Badge tone={statusTone[r.status]}>{r.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
