import { useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import Logo from '../components/ui/Logo'
import { PORTAL_AUTH_CONFIG } from './auth/portalAuthConfig'

const portals = [
  {
    role: 'citizen',
    label: 'Citizen',
    desc: 'Report and map waste in your community. Rewards are still in development.',
    accent: 'text-gold',
    bg: 'bg-gold/15',
    border: 'hover:border-gold',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20c1.5-4 5-5.5 7.5-5.5s6 1.5 7.5 5.5" />
      </svg>
    ),
  },
  {
    role: 'company',
    label: 'Individual or company',
    desc: 'For individuals (like independent trash collectors) and companies.',
    accent: 'text-gold',
    bg: 'bg-gold/15',
    border: 'hover:border-gold',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
      </svg>
    ),
  },
  {
    role: 'operations',
    label: 'Municipality',
    desc: 'For municipal staff: see the waste reported in your municipality and send crews.',
    accent: 'text-emerald-300',
    bg: 'bg-emerald-300/15',
    border: 'hover:border-emerald-300',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 17h1V9l4-4h4l4 4h4v8h1" />
        <circle cx="7.5" cy="17.5" r="1.7" />
        <circle cx="17.5" cy="17.5" r="1.7" />
      </svg>
    ),
  },
] as const

const roleLabel: Record<string, string> = {
  citizen: 'a Citizen app',
  company: 'a Company portal',
  operations: 'a Municipal portal',
}

export default function PortalPicker({ mode = 'sign-in' }: { mode?: 'sign-in' | 'sign-up' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { blockedFrom?: string; accountRole?: string } | null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#063927] via-[#032c20] to-[#001b14] px-5 py-16 text-paper">
      <div className="w-full max-w-3xl">
        <div className="mb-10">
          <button onClick={() => navigate('/')} className="mb-6 block">
            <Logo light />
          </button>
          <h1 className="font-display text-2xl font-bold mb-2">{mode === 'sign-up' ? 'Create an account' : 'Sign in to continue'}</h1>
          <p className="text-sm text-paper/70 max-w-md">{mode === 'sign-up' ? 'Choose who you are signing up as.' : 'Choose who you are signing in as.'}</p>
        </div>

        {state?.blockedFrom && (
          <div className="rounded-xl border border-rust/30 bg-rust/5 px-4 py-3.5 mb-6 flex items-start justify-between gap-4 flex-wrap">
            <p className="text-sm text-paper/85">
              This account is already registered as <span className="font-semibold">{roleLabel[state.accountRole ?? '']}</span> account
              - one account can only belong to one portal. Sign in to {roleLabel[state.accountRole ?? '']} instead, or sign out and use a
              different account for {roleLabel[state.blockedFrom]}.
            </p>
            <button
              onClick={() => signOut(auth)}
              className="text-xs font-medium text-gold whitespace-nowrap hover:underline shrink-0"
            >
              Sign out
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          {portals.map((p) => (
            <button
              key={p.role}
              onClick={() => {
                const cfg = PORTAL_AUTH_CONFIG[p.role]
                navigate(mode === 'sign-up' ? cfg.signUpPath : cfg.signInPath)
              }}
              className="text-left cursor-pointer group focus-visible:outline-gold"
            >
              <div className={`h-full rounded-2xl border border-paper/15 bg-[#073b2d] p-5 shadow-sm transition-all duration-150 group-hover:-translate-y-0.5 group-hover:bg-[#084432] group-hover:shadow-md ${p.border}`}>
                <div className={`w-10 h-10 rounded-full ${p.bg} ${p.accent} flex items-center justify-center mb-4`}>
                  {p.icon}
                </div>
                <h2 className="font-display text-lg font-semibold mb-2">{p.label}</h2>
                <p className="text-sm text-paper/65 leading-relaxed mb-4">{p.desc}</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${p.accent}`}>
                  Continue
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-0.5">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
