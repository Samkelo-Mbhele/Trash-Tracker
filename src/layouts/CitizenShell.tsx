import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import AccountMenu from '../components/AccountMenu'

export const tabs = [
  { to: '/citizen/home', label: 'Home', icon: 'home' },
  { to: '/citizen/report', label: 'Report', icon: 'report' },
  { to: '/citizen/wallet', label: 'Wallet', icon: 'wallet' },
  { to: '/citizen/profile', label: 'Profile', icon: 'profile' },
]

export function TabIcon({ icon }: { icon: string }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 }
  if (icon === 'map')
    return (
      <svg {...common}>
        <path d="M9 4 L3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" strokeLinejoin="round" />
        <path d="M9 4v14M15 6v14" />
      </svg>
    )
  if (icon === 'report')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    )
  if (icon === 'home')
    return (
      <svg {...common}>
        <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />
      </svg>
    )
  if (icon === 'wallet')
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M16 14h2" />
      </svg>
    )
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 5-5.5 7.5-5.5s6 1.5 7.5 5.5" />
    </svg>
  )
}

export default function CitizenShell() {
  const navigate = useNavigate()
  return (
    // The app fills the viewport at every size. Mobile keeps a compact
    // single-column layout; desktop uses the available browser width.
    <div className="h-[100dvh] min-h-0 overflow-hidden bg-gradient-to-b from-[#063927] via-[#032c20] to-[#001b14] text-paper flex flex-col">
      <header
        className="shrink-0 border-b border-paper/10"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="max-w-[440px] md:max-w-7xl mx-auto w-full flex items-center justify-between px-5 pb-3">
          <button onClick={() => navigate('/citizen/home')} className="flex items-center gap-2.5 font-display text-base font-semibold text-left leading-tight">
            <span className="w-8 h-8 rounded-full bg-gold/15 border border-gold/35 flex items-center justify-center text-gold" aria-hidden="true">TT</span>
            <span>Trash <span className="text-gold">Tracker</span></span>
          </button>
          <AccountMenu />
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-[440px] md:max-w-7xl mx-auto w-full px-4 py-4 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>

      <nav
        className="shrink-0 border-t border-paper/10"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-[440px] md:max-w-7xl mx-auto w-full grid grid-cols-4 px-1 pt-2 md:px-8">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] tag transition-colors ${
                  isActive ? 'text-gold' : 'text-paper/55'
                }`
              }
            >
              <TabIcon icon={t.icon} />
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
