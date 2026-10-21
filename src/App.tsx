import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './lib/store'

import Home from './pages/Home'
import PortalPicker from './pages/PortalPicker'

import PortalGate from './components/PortalGate'
import AdminPage from './pages/admin/AdminPage'
import EmailAuthPage from './pages/auth/EmailAuthPage'

import CitizenShell from './layouts/CitizenShell'
import MapScreen from './pages/citizen/MapScreen'
import CitizenHome from './pages/citizen/CitizenHome'
import ReportScreen from './pages/citizen/ReportScreen'
import WalletScreen from './pages/citizen/WalletScreen'
import ProfileScreen from './pages/citizen/ProfileScreen'

import DashboardLayout from './layouts/DashboardLayout'
import CompanyPortal from './layouts/CompanyPortal'
import NearbyReports from './pages/company/NearbyReports'
import Overview from './pages/company/Overview'
import Sponsorships from './pages/company/Sponsorships'
import Reports from './pages/company/Reports'
import Dispatch from './pages/operations/Dispatch'
import Crews from './pages/operations/Crews'
import Analytics from './pages/operations/Analytics'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/start" element={<PortalPicker />} />
          <Route path="/sign-up" element={<PortalPicker mode="sign-up" />} />

          {/* Firebase email/password sign-in for all portals. */}
          <Route path="/citizen/sign-in" element={<EmailAuthPage portal="citizen" mode="sign-in" />} />
          <Route path="/citizen/sign-up" element={<EmailAuthPage portal="citizen" mode="sign-up" />} />
          <Route path="/company/sign-in" element={<EmailAuthPage portal="company" mode="sign-in" />} />
          <Route path="/company/sign-up" element={<EmailAuthPage portal="company" mode="sign-up" />} />
          <Route path="/operations/sign-in" element={<EmailAuthPage portal="operations" mode="sign-in" />} />
          <Route path="/operations/sign-up" element={<EmailAuthPage portal="operations" mode="sign-up" />} />

          <Route
            element={
              <PortalGate role="citizen">
                <CitizenShell />
              </PortalGate>
            }
          >
            <Route path="/citizen/home" element={<CitizenHome />} />
            <Route path="/citizen/map" element={<MapScreen />} />
            <Route path="/citizen/report" element={<ReportScreen />} />
            <Route path="/citizen/wallet" element={<WalletScreen />} />
            <Route path="/citizen/profile" element={<ProfileScreen />} />
          </Route>

          <Route element={<PortalGate role="company"><CompanyPortal allowedAccountType="individual" /></PortalGate>}>
            <Route path="/company/nearby" element={<NearbyReports />} />
          </Route>
          <Route element={<PortalGate role="company"><CompanyPortal allowedAccountType="company" /></PortalGate>}>
            <Route path="/company/overview" element={<Overview />} />
            <Route path="/company/sponsorships" element={<Sponsorships />} />
            <Route path="/company/reports" element={<Reports />} />
          </Route>

          <Route
            element={
              <PortalGate role="operations">
                <DashboardLayout
                  portalLabel="OPERATIONS"
                  accent="#2F5233"
                  navItems={[
                    { to: '/operations/dispatch', label: 'Dispatch' },
                    { to: '/operations/crews', label: 'Crews' },
                    { to: '/operations/analytics', label: 'Analytics' },
                  ]}
                />
              </PortalGate>
            }
          >
            <Route path="/operations/dispatch" element={<Dispatch />} />
            <Route path="/operations/crews" element={<Crews />} />
            <Route path="/operations/analytics" element={<Analytics />} />
          </Route>

          <Route path="/admin" element={<AdminPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
