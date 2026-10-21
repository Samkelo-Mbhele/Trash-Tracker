import { useNavigate } from 'react-router-dom'
import { useAppState } from '../lib/store'
import { DURBAN_CENTER } from '../lib/mapConfig'
import LeafletMap, { type MapMarker } from '../components/LeafletMap'

/**
 * Public landing page, styled like the signed-in citizen home. Every action
 * that needs an account routes to a gated citizen page, so PortalGate sends
 * the visitor to sign-in and back to where they were heading afterwards.
 */
export default function Home() {
  const navigate = useNavigate()
  const { reports, role } = useAppState()
  const visibleReports = reports.filter((report) => report.verification !== 'Rejected')
  const active = visibleReports.filter((report) => report.status !== 'Cleared')

  const markers: MapMarker[] = visibleReports
    .filter((report) => report.lat !== undefined && report.lng !== undefined)
    .map((report) => {
      const color = report.status === 'Cleared' ? '#35bf58' : report.status === 'En route' ? '#e5ad32' : '#df543a'
      return { id: report.id, lat: report.lat!, lng: report.lng!, color, label: `${report.status}  |  ${report.wasteType}  |  ${report.location}` }
    })

  return (
    <div className="h-[100dvh] min-h-0 overflow-hidden bg-gradient-to-b from-[#063927] via-[#032c20] to-[#001b14] text-paper flex flex-col md:min-h-screen md:h-auto md:overflow-visible">
      <header
        className="shrink-0 border-b border-paper/10"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2 px-5 pb-3">
          <div className="flex items-center gap-2.5 font-display text-base font-semibold leading-tight">
            <span className="w-8 h-8 rounded-full bg-gold/15 border border-gold/35 flex items-center justify-center text-gold" aria-hidden="true">TT</span>
            <span>Trash <span className="text-gold">Tracker</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/start')} className="rounded-full border border-gold/50 px-3 py-1.5 text-sm text-gold">
              Log in
            </button>
            <button onClick={() => navigate('/sign-up')} className="rounded-full bg-gold px-3 py-1.5 text-sm font-semibold text-ink">
              Sign up
            </button>
          </div>
        </div>
      </header>

      <main className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain md:overflow-visible">
        <div className="max-w-6xl mx-auto w-full px-6 pt-6 pb-10 space-y-3.5 relative md:grid md:grid-cols-2 md:items-start md:gap-x-12 md:gap-y-5 md:space-y-0 md:px-8 md:pt-12">
          <div className="pointer-events-none absolute right-[8%] top-12 h-40 w-28 opacity-25 hidden md:block" aria-hidden="true">
            <svg viewBox="0 0 110 160" className="h-full w-full fill-emerald-400"><path d="M92 3C49 12 28 44 41 80 65 71 91 43 92 3ZM39 79C8 62 2 34 13 14 38 31 46 53 39 79ZM48 91C28 106 18 130 24 154 47 140 55 116 48 91ZM52 92C69 112 89 121 108 118 98 98 77 87 52 92Z"/></svg>
          </div>
          <section className="relative pt-1 pr-8 md:col-start-1 md:row-start-1 md:pt-6 md:pr-12">
            <h1 className="font-display text-[25px] leading-[1.08] font-extrabold">Help keep your<br />community <span className="text-gold">clean.</span></h1>
            <p className="text-paper/70 text-[13px] leading-snug mt-2">Report litter in seconds and help<br />cleanup teams know where to go.</p>
          </section>

          <section className="relative h-[240px] rounded-2xl overflow-hidden border border-paper/20 shadow-lg md:col-start-2 md:row-start-1 md:h-[390px]" aria-label="Community waste reports map">
            <LeafletMap center={DURBAN_CENTER} zoom={11} markers={markers} className="w-full h-full" />
            <span className="absolute z-[1000] top-2 left-2 rounded-full bg-white text-ink border border-ink/10 px-3 py-1.5 text-[11px] font-semibold shadow">{role ? `${active.length} Active Reports` : 'Sign in to view reports'}</span>
            <button onClick={() => navigate('/citizen/map')} className="absolute z-[1000] bottom-2 right-2 rounded-full bg-emerald-950/95 px-3.5 py-2 text-xs font-semibold text-paper shadow">View map</button>
          </section>

          <button onClick={() => navigate('/citizen/report')} className="w-full min-h-[56px] rounded-xl bg-gold text-ink px-5 py-2.5 font-display shadow-lg flex items-center gap-4 text-left md:col-start-2 md:row-start-1 md:mt-[410px]" aria-label="Report waste using the camera">
            <span aria-hidden="true"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h3l1.5-2h7L17 7h3v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg></span><span className="flex-1"><span className="block text-base font-extrabold leading-tight">Report Waste</span><span className="block text-[11px] font-medium">Take a photo and report a location</span></span>
          </button>

          <section className="rounded-2xl border border-emerald-300/20 bg-black/10 px-4 py-3 md:col-start-1 md:row-start-2">
            <div className="h-[3px] w-7 rounded-full bg-emerald-400 mb-2" />
            <h2 id="about-heading" className="font-display text-base font-bold">How Trash Tracker works</h2>
            <p className="text-[11px] leading-snug text-paper/70 mt-0.5">A simple way to report litter and keep our<br className="hidden min-[380px]:block" /> parks and public spaces clean.</p>
            <ol className="mt-2 grid grid-cols-3 gap-2 text-left">
              <li className="px-0.5"><span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700/70 font-display text-base font-bold text-gold" aria-hidden="true">01</span><p className="text-[11px] font-bold">REPORT</p><p className="text-[10px] leading-tight text-paper/65">Take a photo of<br/>the waste.</p></li>
              <li className="px-0.5"><span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700/70 font-display text-base font-bold text-gold" aria-hidden="true">02</span><p className="text-[11px] font-bold">LOCATE</p><p className="text-[10px] leading-tight text-paper/65">Your location is<br/>added automatically.</p></li>
              <li className="px-0.5"><span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700/70 font-display text-base font-bold text-gold" aria-hidden="true">03</span><p className="text-[11px] font-bold">CLEAN</p><p className="text-[10px] leading-tight text-paper/65">Cleanup teams know<br/>exactly where to go.</p></li>
            </ol>
          </section>

          <section className="rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3 md:col-start-2 md:row-start-2">
            <div className="h-[3px] w-7 rounded-full bg-gold mb-2" />
            <h2 id="collector-heading" className="font-display text-base font-bold">Want to collect trash?</h2>
            <p className="text-[11px] leading-snug text-paper/75 mt-0.5">
              Anyone can register as a trash collector. Sign up, see reported waste near you on the map and help get it cleaned up.
            </p>
            <button
              onClick={() => navigate('/company/sign-up?type=individual')}
              className="mt-3 w-full min-h-11 rounded-xl border border-gold/60 px-4 py-2 text-sm font-semibold text-gold flex items-center justify-between"
            >
              <span>Register as a collector</span><span aria-hidden="true">&gt;</span>
            </button>
          </section>
        </div>
      </main>
    </div>
  )
}
