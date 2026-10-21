import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  increment,
  writeBatch,
  runTransaction,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { useAuthUser } from './authContext'
import { municipalityForPoint } from './municipalities'
import type { Report, Crew, WalletTransaction, GreenBelt, CitizenUser, WasteType, ReportVerification } from './types'

interface AppState {
  reports: Report[]
  crews: Crew[]
  wallet: WalletTransaction[]
  greenBelts: GreenBelt[]
  citizen: CitizenUser
  /** Set at sign-up for company/operations accounts - empty for citizens. */
  orgName: string
  /** The one municipality an operations account may see; null for everyone else. */
  municipalityId: string | null
  /** Role claimed on the account's /users doc; null until that doc has loaded. */
  role: string | null
  /** Company-portal accounts only: a sponsor company or an individual collector. */
  accountType: 'individual' | 'company' | null
  admin: boolean

  assignCrew: (reportId: string, crewId: string) => Promise<void>
  markCleared: (reportId: string) => Promise<void>
  /** Crew has reached its assigned report and started cleaning it up. */
  startCleaning: (crewId: string) => Promise<void>
  reviewReport: (reportId: string, decision: Extract<ReportVerification, 'Verified' | 'Rejected'>) => Promise<void>
  submitReport: (
    wasteType: WasteType,
    location: string,
    extras?: { lat?: number; lng?: number; photoThumbnail?: string },
  ) => Promise<Report>
  updateNickname: (nickname: string) => Promise<void>
  createCrew: (name: string, size: number, status: Crew['status']) => Promise<void>
}

interface AccountProfile {
  uid: string
  role: string | null
  municipalityId: string | null
  accountType: 'individual' | 'company' | null
  admin: boolean
}

const AppContext = createContext<AppState | null>(null)

const DEFAULT_CITIZEN: CitizenUser = {
  nickname: '',
  reportsSubmitted: 0,
  reportsVerified: 0,
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthUser()

  const [reports, setReports] = useState<Report[]>([])
  const [crews, setCrews] = useState<Crew[]>([])
  const [greenBelts, setGreenBelts] = useState<GreenBelt[]>([])
  const [wallet, setWallet] = useState<WalletTransaction[]>([])
  const [storedCitizen, setCitizen] = useState<CitizenUser>(DEFAULT_CITIZEN)
  const [orgName, setOrgName] = useState('')
  const [profile, setProfile] = useState<AccountProfile | null>(null)

  // Only trust a profile that belongs to whoever is signed in right now, so
  // one account's role is never used to build another account's queries.
  const loadedProfile = user && profile?.uid === user.uid ? profile : null
  const role = loadedProfile?.role ?? null
  const municipalityId = loadedProfile?.municipalityId ?? null
  const accountType = loadedProfile?.accountType ?? null
  const admin = loadedProfile?.admin === true

  // Firestore rules are not filters: a query that could return a document
  // the account may not read is refused outright. So nothing is subscribed
  // until the role has loaded, and municipal accounts ask only for their own
  // municipality (see firestore.rules). The client never inserts demo data.
  useEffect(() => {
    if (!user || role === null || (role === 'operations' && !municipalityId)) {
      setReports([])
      return
    }
    // No orderBy next to the where(): that pair would need a composite
    // index, so every role's reports are sorted here instead.
    const q =
      role === 'operations'
        ? query(collection(db, 'reports'), where('municipalityId', '==', municipalityId))
        : collection(db, 'reports')
    return onSnapshot(
      q,
      (snap) => {
        const loaded = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Report, 'id'>) }))
        setReports(loaded.sort((a, b) => (b.reportedAt?.toMillis() ?? 0) - (a.reportedAt?.toMillis() ?? 0)))
      },
      () => setReports([]),
    )
  }, [user, role, municipalityId])

  // Crews are for approved municipal accounts only.
  useEffect(() => {
    if (!user || role !== 'operations' || !municipalityId) {
      setCrews([])
      return
    }
    const q = query(collection(db, 'crews'), where('municipalityId', '==', municipalityId))
    return onSnapshot(
      q,
      (snap) => setCrews(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Crew, 'id'>) }))),
      () => setCrews([]),
    )
  }, [user, role, municipalityId])

  // A citizen's verified count comes from the reports themselves, so staff
  // never have to write to a citizen's account document.
  const citizen = useMemo(
    () =>
      user && role === 'citizen'
        ? {
            ...storedCitizen,
            reportsVerified: reports.filter((report) => report.reporterId === user.uid && report.verification === 'Verified').length,
          }
        : storedCitizen,
    [storedCitizen, reports, user, role],
  )

  useEffect(() => {
    if (!user) {
      setGreenBelts([])
      return
    }
    return onSnapshot(collection(db, 'greenBelts'), (snap) => {
      setGreenBelts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GreenBelt, 'id'>) })))
    })
  }, [user])

  // Per-user data - only meaningful once someone's signed in.
  useEffect(() => {
    if (!user) {
      setCitizen(DEFAULT_CITIZEN)
      setOrgName('')
      setProfile(null)
      setWallet([])
      return
    }
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const data = snap.data()
      setProfile({
        uid: user.uid,
        role: data?.role ?? null,
        municipalityId: data?.role === 'operations' ? data.municipalityId ?? null : null,
        accountType: data?.role === 'company' ? (data.accountType === 'individual' ? 'individual' : 'company') : null,
        admin: data?.admin === true,
      })
      if (data) {
        setCitizen({
          nickname: data.nickname ?? '',
          reportsSubmitted: data.reportsSubmitted ?? 0,
          reportsVerified: data.reportsVerified ?? 0,
        })
        setOrgName(data.orgName ?? '')
      }
    })
    const walletQuery = query(collection(db, 'users', user.uid, 'wallet'), orderBy('date', 'desc'))
    const unsubWallet = onSnapshot(walletQuery, (snap) => {
      setWallet(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WalletTransaction, 'id'>) })))
    })
    return () => {
      unsubUser()
      unsubWallet()
    }
  }, [user])

  const assignCrew = async (reportId: string, crewId: string) => {
    await updateDoc(doc(db, 'reports', reportId), { status: 'En route', crewId })
    await updateDoc(doc(db, 'crews', crewId), { status: 'En route', currentTask: reportId })
  }

  const markCleared = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId)
    await updateDoc(doc(db, 'reports', reportId), { status: 'Cleared' })
    if (report?.crewId) {
      await updateDoc(doc(db, 'crews', report.crewId), { status: 'Available', currentTask: null })
    }
  }

  const startCleaning = async (crewId: string) => {
    await updateDoc(doc(db, 'crews', crewId), { status: 'Cleaning' })
  }

  const reviewReport = async (reportId: string, decision: Extract<ReportVerification, 'Verified' | 'Rejected'>) => {
    const reportRef = doc(db, 'reports', reportId)
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reportRef)
      if (!snapshot.exists()) throw new Error('Report no longer exists')
      const report = snapshot.data() as Omit<Report, 'id'>
      if ((report.verification ?? 'Pending') !== 'Pending') throw new Error('Report has already been reviewed')
      transaction.update(reportRef, { verification: decision, reviewedAt: Timestamp.now() })
    })
  }

  const submitReport = async (
    wasteType: WasteType,
    location: string,
    extras?: { lat?: number; lng?: number; photoThumbnail?: string },
  ): Promise<Report> => {
    if (!user) throw new Error('Must be signed in to submit a report')

    const now = Timestamp.now()

    // Firestore rejects `undefined` field values, so only include the
    // optional GPS/photo fields when the caller actually has them.
    const optionalFields: Record<string, number | string> = {}
    if (extras?.lat !== undefined) optionalFields.lat = extras.lat
    if (extras?.lng !== undefined) optionalFields.lng = extras.lng
    if (extras?.photoThumbnail) optionalFields.photoThumbnail = extras.photoThumbnail

    const reportRef = doc(collection(db, 'reports'))
    const displayId = `TT-${reportRef.id.slice(0, 6).toUpperCase()}`
    const batch = writeBatch(db)
    batch.set(reportRef, {
      displayId,
      wasteType,
      location,
      status: 'New',
      verification: 'Pending',
      reportedAt: now,
      reporterId: user.uid,
      municipalityId: municipalityForPoint(extras?.lat, extras?.lng),
      ...optionalFields,
    })
    batch.update(doc(db, 'users', user.uid), { reportsSubmitted: increment(1) })
    await batch.commit()

    return {
      id: reportRef.id,
      displayId,
      wasteType,
      location,
      status: 'New',
      verification: 'Pending',
      reportedAt: now,
      reporterId: user.uid,
    }
  }

  const updateNickname = async (nickname: string) => {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), { nickname })
  }

  const createCrew = async (name: string, size: number, status: Crew['status']) => {
    const cleanName = name.trim()
    if (!user || role !== 'operations' || !municipalityId) throw new Error('An approved operations account is required')
    if (!cleanName || !Number.isInteger(size) || size < 1) throw new Error('Enter a crew name and a valid crew size')
    await addDoc(collection(db, 'crews'), { name: cleanName, size, status, municipalityId })
  }

  const value = useMemo(
    () => ({
      reports,
      crews,
      wallet,
      greenBelts,
      citizen,
      orgName,
      municipalityId,
      role,
      accountType,
      admin,
      assignCrew,
      markCleared,
      startCleaning,
      reviewReport,
      submitReport,
      updateNickname,
      createCrew,
    }),
    [reports, crews, wallet, greenBelts, citizen, orgName, municipalityId, role, accountType, admin],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
} 
