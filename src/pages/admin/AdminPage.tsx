import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import {
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { useAuthUser } from '../../lib/authContext'
import { formatTimestamp } from '../../lib/format'
import {
  MUNICIPALITIES,
  PILOT_MUNICIPALITY_ID,
  UNASSIGNED_MUNICIPALITY_ID,
  getMunicipality,
  municipalityForPoint,
  reportMunicipality,
} from '../../lib/municipalities'
import type { Crew, Report } from '../../lib/types'
import Logo from '../../components/ui/Logo'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

interface OperationsAccount {
  id: string
  orgName?: string
  email?: string
  municipalityId?: string
}

const RULES_HINT = 'Firebase refused this. Publish the rules in firestore.rules, then reload.'

/**
 * Trash Tracker's own admin page: approves operations accounts by linking
 * them to a municipality, and sorts out reports that fell outside every
 * boundary. Only accounts with `admin: true` on their /users doc (set by
 * hand in the Firebase console) get in; firestore.rules enforces the same.
 */
export default function AdminPage() {
  const { user, loading } = useAuthUser()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => { if (!cancelled) setIsAdmin(snap.data()?.admin === true) })
      .catch(() => { if (!cancelled) setIsAdmin(false) })
    return () => { cancelled = true }
  }, [user])

  if (loading || (user && isAdmin === null)) return null
  if (!user) return <Navigate to="/start" replace />

  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <Logo />
        <Button variant="ghost" onClick={() => signOut(auth)} className="!py-2">Sign out</Button>
      </header>
      <main className="max-w-7xl mx-auto px-5 pb-16 space-y-8">
        <div>
          <p className="tag text-moss mb-2">ADMIN</p>
          <h1 className="font-display text-2xl font-bold">Municipalities</h1>
        </div>
        <OperationsAccounts />
        <ReportsAndCrews />
      </main>
    </div>
  )
}

function MunicipalitySelect({
  value,
  emptyLabel,
  onChange,
}: {
  value: string
  emptyLabel: string
  onChange: (municipalityId: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-11 shrink-0 rounded-xl border border-[--line] bg-white px-3 text-sm"
    >
      <option value="">{emptyLabel}</option>
      {MUNICIPALITIES.map((municipality) => (
        <option key={municipality.id} value={municipality.id}>{municipality.name}</option>
      ))}
    </select>
  )
}

function OperationsAccounts() {
  const [accounts, setAccounts] = useState<OperationsAccount[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const operationsUsers = query(collection(db, 'users'), where('role', '==', 'operations'))
    return onSnapshot(
      operationsUsers,
      (snap) => setAccounts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OperationsAccount, 'id'>) }))),
      () => setError(RULES_HINT),
    )
  }, [])

  const setMunicipality = async (accountId: string, municipalityId: string) => {
    setError(null)
    try {
      await updateDoc(doc(db, 'users', accountId), { municipalityId: municipalityId || deleteField() })
    } catch {
      setError(RULES_HINT)
    }
  }

  const waiting = accounts?.filter((account) => !account.municipalityId).length ?? 0

  return (
    <section aria-labelledby="accounts-heading">
      <h2 id="accounts-heading" className="font-display text-lg font-semibold">Municipal accounts</h2>
      <p className="text-sm text-ink/60 mt-1 mb-3">
        Pick a municipality to approve an account. {waiting > 0 ? `${waiting} waiting for approval.` : ''}
      </p>
      {error && <p className="text-xs text-rust mb-3">{error}</p>}
      {accounts?.length === 0 && <Card className="text-sm text-ink/60">No municipal accounts have signed up yet.</Card>}
      <div className="space-y-2">
        {accounts?.map((account) => (
          <Card key={account.id} className="flex items-center justify-between gap-3 !p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{account.orgName || 'Unnamed organisation'}</p>
              <p className="text-xs text-ink/55 truncate">{account.email ?? 'Email appears after their next sign-in'}</p>
            </div>
            <MunicipalitySelect
              value={account.municipalityId ?? ''}
              emptyLabel="Not approved"
              onChange={(municipalityId) => setMunicipality(account.id, municipalityId)}
            />
          </Card>
        ))}
      </div>
    </section>
  )
}

function ReportsAndCrews() {
  const [reports, setReports] = useState<Report[]>([])
  const [crews, setCrews] = useState<Crew[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tagging, setTagging] = useState(false)

  useEffect(() => {
    const unsubReports = onSnapshot(
      query(collection(db, 'reports'), orderBy('reportedAt', 'desc')),
      (snap) => setReports(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Report, 'id'>) }))),
      () => setError(RULES_HINT),
    )
    const unsubCrews = onSnapshot(
      collection(db, 'crews'),
      (snap) => setCrews(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Crew, 'id'>) }))),
      () => setError(RULES_HINT),
    )
    return () => {
      unsubReports()
      unsubCrews()
    }
  }, [])

  const unassigned = reports.filter((report) => reportMunicipality(report) === UNASSIGNED_MUNICIPALITY_ID)
  const untaggedReports = reports.filter((report) => report.municipalityId === undefined)
  const untaggedCrews = crews.filter((crew) => crew.municipalityId === undefined)
  const untaggedCount = untaggedReports.length + untaggedCrews.length

  const assignReport = async (reportId: string, municipalityId: string) => {
    if (!municipalityId) return
    setError(null)
    try {
      await updateDoc(doc(db, 'reports', reportId), { municipalityId })
    } catch {
      setError(RULES_HINT)
    }
  }

  // Records saved before municipalities existed. The security rules only see
  // the saved municipalityId, never the browser's GPS lookup, so until these
  // are tagged no municipal account can read them. Reports are placed by
  // their GPS point, crews go to the pilot municipality.
  const tagOldRecords = async () => {
    setError(null)
    setTagging(true)
    try {
      const writes = [
        ...untaggedReports.map((report) => ({
          ref: doc(db, 'reports', report.id),
          municipalityId: municipalityForPoint(report.lat, report.lng),
        })),
        ...untaggedCrews.map((crew) => ({ ref: doc(db, 'crews', crew.id), municipalityId: PILOT_MUNICIPALITY_ID })),
      ]
      // Firestore caps a batch at 500 writes.
      for (let start = 0; start < writes.length; start += 400) {
        const batch = writeBatch(db)
        for (const write of writes.slice(start, start + 400)) batch.update(write.ref, { municipalityId: write.municipalityId })
        await batch.commit()
      }
    } catch {
      setError(RULES_HINT)
    } finally {
      setTagging(false)
    }
  }

  return (
    <>
      {untaggedCount > 0 && (
        <section role="alert" aria-labelledby="old-records-heading" className="rounded-2xl border-2 border-rust/50 bg-rust/5 p-5">
          <h2 id="old-records-heading" className="font-display text-lg font-semibold text-rust">
            {untaggedCount} older records are hidden from municipal teams
          </h2>
          <p className="text-sm text-ink/75 mt-1 mb-4">
            {untaggedReports.length} reports and {untaggedCrews.length} crews have no municipality saved on them, so
            no municipal account can see or change them. Tagging saves each report under the municipality its GPS point
            is in, and each crew under {getMunicipality(PILOT_MUNICIPALITY_ID)?.name}.
          </p>
          <Button onClick={tagOldRecords} disabled={tagging}>
            {tagging ? 'Tagging...' : `Tag ${untaggedCount} older records`}
          </Button>
        </section>
      )}

      <section aria-labelledby="unassigned-heading">
        <h2 id="unassigned-heading" className="font-display text-lg font-semibold">Unassigned reports</h2>
        <p className="text-sm text-ink/60 mt-1 mb-3">
          Reports outside every municipality boundary, or sent without GPS. No municipal team sees these until you
          assign them.
        </p>
        {error && <p className="text-xs text-rust mb-3">{error}</p>}
        {unassigned.length === 0 && <Card className="text-sm text-ink/60">No unassigned reports.</Card>}
        <div className="space-y-2">
          {unassigned.map((report) => (
            <Card key={report.id} className="flex items-center justify-between gap-3 !p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{report.displayId}  |  {report.wasteType} waste</p>
                <p className="text-xs text-ink/55 truncate">
                  {report.location}  |  {formatTimestamp(report.reportedAt)}
                  {report.lat === undefined ? '  |  no GPS' : ''}
                </p>
              </div>
              <MunicipalitySelect value="" emptyLabel="Assign to..." onChange={(municipalityId) => assignReport(report.id, municipalityId)} />
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}
