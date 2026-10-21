import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthUser } from '../lib/authContext'
import { useAppState } from '../lib/store'
import { getMunicipality } from '../lib/municipalities'
import Logo from '../components/ui/Logo'
import AccountMenu from '../components/AccountMenu'

export interface NavItem {
  to: string
  label: string
}

export default function DashboardLayout({
  navItems,
  portalLabel,
  accent,
}: {
  navItems: NavItem[]
  portalLabel: string
  accent: string
}) {
  const navigate = useNavigate()
  const { user } = useAuthUser()
  const { orgName, municipalityId } = useAppState()
  const municipalityName = getMunicipality(municipalityId)?.name
  const accountLabel = user?.email ?? 'Signed in'
  // Individual collectors share the company portal's layout, with their own wording.
  const isCollector = portalLabel === 'COLLECTOR'
  const isCompany = portalLabel === 'SPONSOR DASHBOARD' || isCollector
  const companyLabel = isCollector ? 'Collector' : 'Company Portal'
  const isOperations = portalLabel === 'OPERATIONS'
  const initials = (orgName || accountLabel).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('')

  if (isCompany || isOperations) return (
    <div className="min-h-screen bg-[#f3f6ef] text-[#102c24]">
      <header className="sticky top-0 z-30 bg-[#003b2c] text-white shadow-lg shadow-emerald-950/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-[70px] items-center justify-between gap-3">
            <button onClick={() => navigate('/')} className="text-left"><Logo light /><span className="ml-10 -mt-1 hidden text-[10px] text-white/65 sm:block">{isCompany ? companyLabel : 'Municipal Portal'}</span></button>
            <div className="flex items-center gap-3 sm:gap-5">
              <span className="hidden text-right sm:block"><span className="block max-w-52 truncate text-xs font-semibold">{orgName || (isCollector ? 'Collector account' : isCompany ? 'Company account' : 'Municipal team')}</span><span className="block text-[10px] text-white/65">{isCompany ? companyLabel : municipalityName ? `Municipal Portal  |  ${municipalityName}` : 'Municipal Portal'}</span></span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-900 text-[11px] font-semibold">{isOperations ? 'OP' : initials || 'CO'}</span>
              <AccountMenu />
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-3 scrollbar-none" aria-label="Company portal">
            {navItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `shrink-0 rounded-full px-5 py-2 text-xs font-semibold transition-colors ${isActive ? 'bg-[#f4bd35] text-[#102c24]' : 'bg-white/10 text-white/85 hover:bg-white/15'}`}>{item.label}</NavLink>)}
          </nav>
        </div>
      </header>
      <main className={`mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 ${isOperations ? 'pb-24 md:pb-7' : ''}`}><Outlet /></main>
      {isOperations && <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-emerald-900/10 bg-[#003b2c] px-2 pb-[max(.6rem,env(safe-area-inset-bottom))] pt-2 text-white md:hidden" aria-label="Municipal portal">
        {navItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex min-w-16 flex-col items-center gap-1 text-[10px] ${isActive ? 'font-semibold text-[#f4bd35]' : 'text-white/65'}`}><span className="text-lg leading-none" aria-hidden="true">{item.label.slice(0, 1)}</span>{item.label}</NavLink>)}
      </nav>}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-paper text-ink">
      {/* Mobile: top bar + horizontally scrollable nav. Hidden md: and up. */}
      <div
        className="md:hidden sticky top-0 z-20 bg-paper border-b border-[--line] px-4 flex items-center justify-between"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        <button onClick={() => navigate('/')}>
          <Logo />
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/start')} className="text-xs text-ink/45 hover:text-ink">
            Switch
          </button>
          <AccountMenu />
        </div>
      </div>
      <nav className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-[--line] bg-paper sticky top-[49px] z-10">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isActive ? 'bg-ink text-paper' : 'text-ink/70 border border-[--line]'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Desktop: fixed left sidebar. Hidden below md:. */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 border-r border-[--line] flex-col p-5">
        <button onClick={() => navigate('/')} className="text-left mb-8">
          <Logo />
        </button>
        <p className="tag mb-4" style={{ color: accent }}>
          {portalLabel}
        </p>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-ink text-paper' : 'text-ink/70 hover:bg-ink/5'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-5 border-t border-[--line]">
          <p className="text-xs text-ink/45 mb-1">Signed in as</p>
          {orgName && <p className="text-sm font-medium truncate">{orgName}</p>}
          <p className={orgName ? 'text-xs text-ink/45 truncate' : 'text-sm font-medium truncate'}>{accountLabel}</p>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => navigate('/start')} className="text-xs text-ink/45 hover:text-ink">
              Switch portal
            </button>
            <span className="text-ink/20"> | </span>
            <AccountMenu />
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
