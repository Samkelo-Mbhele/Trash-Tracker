import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { useAuthUser } from '../../lib/authContext'
import Logo from '../../components/ui/Logo'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { PORTAL_AUTH_CONFIG, type PortalRole } from './portalAuthConfig'
import { MUNICIPALITIES } from '../../lib/municipalities'

interface PasswordCheck {
  label: string
  test: (pw: string) => boolean
}

const PASSWORD_RULES: PasswordCheck[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One symbol (!@#$...)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

function passwordFailures(pw: string): PasswordCheck[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(pw))
}

export default function EmailAuthPage({
  portal,
  mode,
}: {
  portal: PortalRole
  mode: 'sign-in' | 'sign-up'
}) {
  const navigate = useNavigate()
  const cfg = PORTAL_AUTH_CONFIG[portal]
  const { user } = useAuthUser()

  const [orgName, setOrgName] = useState('')
  const [municipalityId, setMunicipalityId] = useState('')
  // Company-portal sign-ups can be a business or a single person (e.g. an
  // independent trash collector). Links can preselect one with ?type=.
  const [searchParams] = useSearchParams()
  const [accountType, setAccountType] = useState<'individual' | 'company'>(
    searchParams.get('type') === 'company' ? 'company' : 'individual',
  )
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [resetBusy, setResetBusy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [verifySentTo, setVerifySentTo] = useState<string | null>(null)
  // Set right after a successful sign-in \u2014 we then wait for the app's own
  // auth context (a separate Firebase listener) to actually reflect that
  // before navigating, instead of navigating immediately. Firebase's
  // sign-in promise can resolve a beat before that listener fires, and
  // navigating too early makes PortalGate briefly see "signed out" and
  // bounce straight back to this page.
  const [awaitingAuthState, setAwaitingAuthState] = useState(false)

  const failures = passwordFailures(password)

  useEffect(() => {
    if (awaitingAuthState && user) {
      navigate(cfg.homePath)
    }
  }, [awaitingAuthState, user, navigate, cfg.homePath])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'sign-up' && failures.length > 0) {
      setPasswordTouched(true)
      setError('Your password needs to meet every requirement below before you can continue.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'sign-up') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (portal === 'citizen') {
          // PortalGate assigns the citizen role and fills any other defaults.
          await setDoc(doc(db, 'users', cred.user.uid), { nickname: nickname.trim() }, { merge: true })
          await sendEmailVerification(cred.user)
          setVerifySentTo(cred.user.email)
          return
        }
        // Written before PortalGate ever touches this doc \u2014 PortalGate only
        // fills in `role` + citizen-only defaults on first claim, so it never
        // overwrites orgName (same pattern that already protects nicknames).
        await setDoc(
          doc(db, 'users', cred.user.uid),
          {
            orgName: orgName.trim(),
            email: cred.user.email,
            ...(portal === 'company' ? { accountType } : {}),
            ...(portal === 'operations' ? { municipalityId } : {}),
          },
          { merge: true },
        )
        await sendEmailVerification(cred.user)
        setVerifySentTo(cred.user.email)
        return // Company and operations accounts verify before continuing.
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        // Don't navigate yet \u2014 the effect above does it once `user` from
        // context is actually populated. Leave `submitting` true so the
        // button stays disabled during that brief gap.
        setAwaitingAuthState(true)
        return
      }
    } catch (err) {
      setError(err instanceof Error ? friendlyAuthError(err.message) : 'Something went wrong \u2014 try again.')
      setSubmitting(false)
    }
  }

  const handlePasswordReset = async () => {
    setError(null)
    setResetMessage(null)
    const address = email.trim()
    if (!address) {
      setError('Enter your email address first, then choose "Forgot password?".')
      return
    }
    setResetBusy(true)
    try {
      await sendPasswordResetEmail(auth, address)
      setResetMessage(`If an account exists for ${address}, Firebase has sent a password reset link.`)
    } catch (err) {
      setError(err instanceof Error ? friendlyAuthError(err.message) : 'Could not send a reset email. Try again.')
    } finally {
      setResetBusy(false)
    }
  }

  const otherMode = mode === 'sign-in' ? 'sign-up' : 'sign-in'
  const otherPath = mode === 'sign-in' ? cfg.signUpPath : cfg.signInPath

  if (verifySentTo) {
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
          <h1 className="font-display text-lg font-semibold mb-2">Check your email</h1>
          <p className="text-sm text-paper/70 mb-6">
            We sent a verification link to <span className="text-paper font-medium">{verifySentTo}</span>. Click it,
            then continue below.
          </p>
          <Button onClick={() => navigate(cfg.homePath)} className="w-full">
            I&apos;ve verified - continue
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#063927] via-[#032c20] to-[#001b14] px-5 py-16 gap-6 text-paper">
      <Logo light />
      <p className="tag" style={{ color: cfg.accent }}>
        {cfg.label.toUpperCase()}  |  {mode === 'sign-in' ? 'SIGN IN' : 'CREATE ACCOUNT'}
      </p>

        <Card className="w-full max-w-sm !bg-[#073b2d] !border-paper/15">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'sign-up' && portal === 'citizen' && (
            <div>
                <label className="text-xs tag text-paper/65 block mb-1.5">NICKNAME</label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                autoComplete="nickname"
                placeholder="e.g. Sam"
                className="w-full border border-paper/20 bg-[#052f23] text-paper rounded-xl px-4 py-3 text-sm focus-visible:outline-gold"
              />
              <p className="text-xs text-paper/50 mt-1.5">Shown on your profile and reports.</p>
            </div>
          )}
          {mode === 'sign-up' && portal === 'company' && (
            <div>
              <label className="text-xs tag text-paper/65 block mb-1.5">SIGN UP AS</label>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-paper/20 p-1" role="radiogroup" aria-label="Account type">
                {(['individual', 'company'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={accountType === type}
                    onClick={() => setAccountType(type)}
                    className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                      accountType === type ? 'bg-gold text-ink' : 'text-paper/65'
                    }`}
                  >
                    {type === 'individual' ? 'Individual' : 'Company'}
                  </button>
                ))}
              </div>
            </div>
          )}
          {mode === 'sign-up' && portal !== 'citizen' && (
            <div>
              <label className="text-xs tag text-paper/65 block mb-1.5">
                {portal === 'operations' ? 'DEPARTMENT OR TEAM' : accountType === 'individual' ? 'FULL NAME' : 'COMPANY NAME'}
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                autoComplete={portal === 'company' && accountType === 'individual' ? 'name' : 'organization'}
                placeholder={
                  portal === 'operations'
                    ? 'e.g. eThekwini Cleansing and Solid Waste'
                    : accountType === 'individual'
                      ? 'e.g. Sam Dlamini'
                      : 'e.g. Acme Holdings'
                }
                className="w-full border border-paper/20 bg-[#052f23] text-paper rounded-xl px-4 py-3 text-sm focus-visible:outline-gold"
              />
              <p className="text-xs text-paper/50 mt-1.5">Shown across the portal instead of a generic label.</p>
            </div>
          )}
          {mode === 'sign-up' && portal === 'operations' && (
            <div>
              <label htmlFor="municipality" className="text-xs tag text-paper/65 block mb-1.5">MUNICIPALITY</label>
              <select id="municipality" required value={municipalityId} onChange={(event) => setMunicipalityId(event.target.value)} className="w-full min-h-11 border border-paper/20 bg-[#052f23] text-paper rounded-xl px-4 py-3 text-sm focus-visible:outline-gold">
                <option value="" disabled>Select your municipality</option>
                {MUNICIPALITIES.map((municipality) => <option key={municipality.id} value={municipality.id}>{municipality.name}</option>)}
              </select>
              <p className="text-xs text-paper/50 mt-1.5">Your account will show reports and crews for this municipality.</p>
            </div>
          )}
          <div>
            <label className="text-xs tag text-paper/65 block mb-1.5">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-paper/20 bg-[#052f23] text-paper rounded-xl px-4 py-3 text-sm focus-visible:outline-gold"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs tag text-paper/65">PASSWORD</label>
              {mode === 'sign-in' && <button type="button" onClick={handlePasswordReset} disabled={resetBusy || submitting} className="text-xs text-paper/65 underline disabled:opacity-50">{resetBusy ? 'Sending link...' : 'Forgot password?'}</button>}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                className="w-full border border-paper/20 bg-[#052f23] text-paper rounded-xl pl-4 pr-12 py-3 text-sm focus-visible:outline-gold"
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-paper/50 hover:text-paper"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="M4 4l16 16" />}
                </svg>
              </button>
            </div>
            {mode === 'sign-up' && (passwordTouched || password.length > 0) && (
              <ul className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password)
                  return (
                    <li key={rule.label} className={`text-xs flex items-center gap-1.5 ${met ? 'text-emerald-300' : 'text-paper/45'}`}>
                      <span>{met ? '\u2713' : '\u2022'}</span>
                      {rule.label}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          {error && <p className="text-xs text-red-300">{error}</p>}
          {resetMessage && <p role="status" className="text-xs text-emerald-300">{resetMessage}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Please wait\u2026' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <p className="text-xs text-paper/55 mt-4 text-center">
          {mode === 'sign-in' ? "Don't have an account? " : 'Already have an account? '}
          <Link to={otherPath} className="text-gold underline">
            {otherMode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </Card>
    </div>
  )
}

function friendlyAuthError(message: string): string {
  if (message.includes('auth/email-already-in-use')) return 'That email already has an account \u2014 try signing in instead.'
  if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) return 'Wrong email or password.'
  if (message.includes('auth/weak-password')) return 'Firebase rejected that password as too weak \u2014 try a longer, more varied one.'
  if (message.includes('auth/user-not-found')) return 'No account found with that email.'
  if (message.includes('auth/too-many-requests')) return 'Too many attempts \u2014 wait a moment and try again.'
  return 'Something went wrong \u2014 try again.'
}
