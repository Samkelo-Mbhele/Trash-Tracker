import { Navigate } from 'react-router-dom'
import { useAppState } from '../lib/store'
import DashboardLayout from './DashboardLayout'

export const COLLECTOR_HOME = '/company/nearby'

/**
 * The company portal holds two kinds of account. Companies get the sponsor
 * dashboard; individuals (independent collectors) get only the nearby-reports
 * map, and each is redirected away from the other's pages.
 */
export default function CompanyPortal({ allowedAccountType }: { allowedAccountType: 'individual' | 'company' }) {
  const { accountType } = useAppState()

  // Still loading the account's /users doc.
  if (accountType === null) return null

  if (accountType !== allowedAccountType) {
    return <Navigate to={accountType === 'individual' ? COLLECTOR_HOME : '/company/overview'} replace />
  }

  if (allowedAccountType === 'individual') {
    return (
      <DashboardLayout
        portalLabel="COLLECTOR"
        accent="#3F7387"
        navItems={[{ to: COLLECTOR_HOME, label: 'Nearby reports' }]}
      />
    )
  }

  return (
    <DashboardLayout
      portalLabel="SPONSOR DASHBOARD"
      accent="#3F7387"
      navItems={[
        { to: '/company/overview', label: 'Overview' },
        { to: '/company/sponsorships', label: 'Sponsorships' },
        { to: '/company/reports', label: 'Community reports' },
      ]}
    />
  )
}

