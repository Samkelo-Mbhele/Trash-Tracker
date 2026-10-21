import type { Timestamp } from 'firebase/firestore'

export type WasteType = 'Plastic' | 'Organic' | 'Hazardous'
export type ReportStatus = 'New' | 'Clustered' | 'En route' | 'Cleared'
export type ReportVerification = 'Pending' | 'Verified' | 'Rejected'
export type CrewStatus = 'Available' | 'En route' | 'Cleaning' | 'Off duty'
export type SponsorTier = 'Bronze' | 'Silver' | 'Gold'

export type RewardType = 'Voucher' | 'Points' | 'Cash'

export interface Report {
  /** Firestore document id - used for all reads/writes/keys. */
  id: string
  /** Friendly on-screen label (e.g. "TT-2295") - display only. */
  displayId: string
  wasteType: WasteType
  location: string
  status: ReportStatus
  verification: ReportVerification
  reportedAt: Timestamp
  crewId?: string
  reporterId: string
  /** Real device GPS at capture time, when the browser granted location access. */
  lat?: number
  lng?: number
  /** Municipality the GPS point fell inside at submission (see lib/municipalities). */
  municipalityId?: string
  /** Small compressed JPEG (base64 data URL) from the live camera capture \u2014
   *  kept low-res so it fits comfortably inside a Firestore document. */
  photoThumbnail?: string
}

export interface Crew {
  id: string
  name: string
  size?: number
  status: CrewStatus
  currentTask?: string
  municipalityId?: string
}

export interface WalletTransaction {
  id: string
  label: string
  amount: number
  date: Timestamp
  rewardType?: RewardType
}

export interface GreenBelt {
  id: string
  name: string
  tier: SponsorTier | null
}

export interface CitizenUser {
  nickname: string
  reportsSubmitted: number
  reportsVerified: number
}
