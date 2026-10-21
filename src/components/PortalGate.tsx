import { useEffect, useState, type ReactNode } from 'react'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { sendEmailVerification, signOut } from 'firebase/auth'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { useAuthUser } from '../lib/authContext'
import { PORTAL_AUTH_CONFIG, type PortalRole } from '../pages/auth/portalAuthConfig'
import { getMunicipality, MUNICIPALITIES } from '../lib/municipalities'
import Logo from './ui/Logo'
import Card from './ui/Card'
import Button from './ui/Button'

/**
 * Gates a portal's routes: redirects signed-out visitors to that portal's
 * sign-in page, claims a role on a brand-new account the first time it
 * signs in anywhere (a `role` field on its /users/{uid} Firestore doc), and
 * \u2014 for company/operations accounts, which sign up with email/password \u2014
 * blocks access until that email is verified. An account that
 * already claimed a *different* portal's role is bounced to the portal
 * picker rather than allowed to switch portals silently \u2014 one account is
 * one role for this pilot (see README for the real-auth caveat).
 */
export default function PortalGate({ role, children }: { role: PortalRole; children: ReactNode }) {
  const { user, loading: authLoading } = useAuthUser()
  const location = useLocation()
  const [roleLoading, setRoleLoading] = useState(true)
  const [currentRole, setCurrentRole] = useState<PortalRole | null>(null)
  const [municipalityId, setMunicipalityId] = useState<string | null>(null)
  const [profileError, setProfileError] = useState(false)

  useEffect(() => {
    if (!user) {
      setRoleLoading(false)
      return
    }
    let cancelled = false
    setRoleLoading(true)
    setProfileError(false)
    const ref = doc(db, 'users', user.uid)
    getDoc(ref)
      .then(async (snap) => {
        if (cancelled) return
        const existing = snap.exists() ? snap.data() : {}
        setMunicipalityId(existing.municipalityId ?? null)
        // The admin page lists operations accounts by email, so make sure
        // accounts created before that page existed have one saved too.
        if (role === 'operations' && !existing.email && user.email) {
          await setDoc(ref, { email: user.email }, { merge: true })
        }
        if (existing.role) {
          setCurrentRole(existing.role as PortalRole)
        } else {
          // Brand-new account, or one that already wrote some fields before
          // a role existed (e.g. PhoneAuthPage's nickname step runs before
          // this). Fill in only what's still missing \u2014 never clobber a
          // value that's already there, or it'll wipe out things like a
          // nickname the person just set.
          const profileDefaults =
            role === 'citizen'
              ? {
                  nickname: existing.nickname ?? '',
                  reportsSubmitted: existing.reportsSubmitted ?? 0,
                  reportsVerified: existing.reportsVerified ?? 0,
                }
              : {}
          await setDoc(ref, { role, createdAt: existing.createdAt ?? Date.now(), ...profileDefaults }, { merge: true })
          setCurrentRole(role)
        }
      })
      .finally(() => {
        if (!cancelled) setRoleLoading(false)
      })
      .catch(() => {
        if (!cancelled) setProfileError(true)
      })
    return () => {
      cancelled = true
    }
  }, [user, role])

  if (authLoading || (user && roleLoading)) return null

  if (!user) {
    return <Navigate to={PORTAL_AUTH_CONFIG[role].signInPath} state={{ from: location }} replace />
  }

  if (profileError) return <div className="p-8 text-center text-sm">Could not load your account profile. Check your connection and reload.</div>

  if (currentRole && currentRole !== role) {
    // Tell them why, rather than silently bouncing to the portal picker \u2014
    // PortalPicker reads this from location state and shows a clear banner.
    return (
      <Navigate
        to="/start"
        state={{ blockedFrom: role, accountRole: currentRole }}
        replace
      />
    )
  }

  if (!user.emailVerified) {
    return <VerifyEmailNotice email={user.email} />
  }

  if (role === 'operations' && !getMunicipality(municipalityId)) {
    return <ChooseMunicipalityNotice email={user.email} onChoose={async (id) => {
      await updateDoc(doc(db, 'users', user.uid), { municipalityId: id })
      setMunicipalityId(id)
    }} />
  }

  return <>{children}</>
}

function ChooseMunicipalityNotice({ email, onChoose }: { email: string | null; onChoose: (id: string) => Promise<void> }) {
  const [municipalityId, setMunicipalityId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#063927] via-[#032c20] to-[#001b14] px-5 py-16 gap-6 text-paper">
      <Logo light />
      <Card className="w-full max-w-sm text-center !bg-[#073b2d] !border-paper/15">
        <h1 className="font-display text-lg font-semibold mb-2">Choose your municipality</h1>
        <p className="text-sm text-paper/70 mb-5">{email ? <span className="text-paper font-medium">{email}</span> : 'Your account'} needs a municipality to show its reports and crews.</p>
        <select value={municipalityId} onChange={(event) => setMunicipalityId(event.target.value)} className="w-full min-h-11 border border-paper/20 bg-[#052f23] text-paper rounded-xl px-4 py-3 text-sm focus-visible:outline-gold">
          <option value="" disabled>Select your municipality</option>
          {MUNICIPALITIES.map((municipality) => <option key={municipality.id} value={municipality.id}>{municipality.name}</option>)}
        </select>
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        <Button disabled={!municipalityId || saving} onClick={async () => {
          setSaving(true)
          setError('')
          try { await onChoose(municipalityId) } catch { setError('Could not save your municipality. Please try again.') } finally { setSaving(false) }
        }} className="w-full mt-4">{saving ? 'Saving...' : 'Continue'}</Button>
        <div className="mt-5 pt-4 border-t border-paper/15 flex justify-center gap-5">
          <button onClick={() => signOut(auth)} className="text-xs text-paper/50 hover:text-paper">Sign out</button>
        </div>
      </Card>
    </div>
  )
}

function VerifyEmailNotice({ email }: { email: string | null }) {
  const navigate = useNavigate()
  const { user } = useAuthUser()
  const [resent, setResent] = useState(false)
  const [checking, setChecking] = useState(false)
  const [busy, setBusy] = useState(false)

  const resend = async () => {
    if (!user || busy) return
    setBusy(true)
    try {
      await sendEmailVerification(user)
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    } finally {
      setBusy(false)
    }
  }

  const checkAgain = async () => {
    if (!user) return
    setChecking(true)
    await user.reload()
    // Firebase's onAuthStateChanged doesn't refire just from reload(), so a
    // full reload is the simplest reliable way to pick up the fresh
    // emailVerified flag on the next render.
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#063927] via-[#032c20] to-[#001b14] px-5 py-16 gap-6 text-paper">
      <Logo light />
      <Card className="w-full max-w-sm text-center !bg-[#073b2d] !border-paper/15">
        <div className="w-12 h-12 rounded-full bg-gold/18 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D9A441" strokeWidth="2">
            <path d="M4 6h16v12H4z" />
            <path d="M4 7l8 6 8-6" />
          </svg>
        </div>
        <h1 className="font-display text-lg font-semibold mb-2">Verify your email</h1>
        <p className="text-sm text-paper/70 mb-6">
          We sent a link to {email ? <span className="text-paper font-medium">{email}</span> : 'your email'}. Click
          it, then come back here.
        </p>
        <Button onClick={checkAgain} disabled={checking} className="w-full mb-3">
          {checking ? 'Checking\u2026' : "I've verified \u2014 continue"}
        </Button>
        <button onClick={resend} disabled={busy} className="text-xs text-paper/50 hover:text-paper">
          {resent ? 'Sent \u2014 check your inbox' : "Didn't get it? Resend"}
        </button>
        <div className="mt-5 pt-4 border-t border-[--line]">
          <button onClick={() => navigate('/start')} className="text-xs text-paper/50 hover:text-paper">
            Switch portal
          </button>
        </div>
      </Card>
    </div>
  )
}
