export type PortalRole = 'citizen' | 'company' | 'operations'

interface PortalAuthConfig {
  label: string
  accent: string
  signInPath: string
  signUpPath: string
  /** Where a signed-in, correctly-roled user lands. */
  homePath: string
}

export const PORTAL_AUTH_CONFIG: Record<PortalRole, PortalAuthConfig> = {
  citizen: {
    label: 'Citizen app',
    accent: '#D9A441', // gold
    signInPath: '/citizen/sign-in',
    signUpPath: '/citizen/sign-up',
    homePath: '/citizen/home',
  },
  company: {
    label: 'Company portal',
    accent: '#3F7387', // sky
    signInPath: '/company/sign-in',
    signUpPath: '/company/sign-up',
    homePath: '/company/overview',
  },
  operations: {
    label: 'Municipal portal',
    accent: '#2F5233', // moss
    signInPath: '/operations/sign-in',
    signUpPath: '/operations/sign-up',
    homePath: '/operations/dispatch',
  },
}
