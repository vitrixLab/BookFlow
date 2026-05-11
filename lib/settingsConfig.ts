// lib/settingsConfig.ts
export interface SettingsBucket {
  key: string
  label: string
  icon: string         // FontAwesome class without "fas fa-"
  roles: string[]      // e.g. ['ADMIN']
}

export const ADMIN_BUCKETS: SettingsBucket[] = [
  { key: 'account',       label: 'Account',       icon: 'building',      roles: ['ADMIN'] },
  { key: 'roles',         label: 'Roles & Access', icon: 'users-cog',     roles: ['ADMIN'] },
  { key: 'notifications', label: 'Notifications',  icon: 'bell',          roles: ['ADMIN'] },
  { key: 'billing',       label: 'Billing & Plan', icon: 'credit-card',   roles: ['ADMIN'] },
  { key: 'integrations',  label: 'Integrations',   icon: 'puzzle-piece',  roles: ['ADMIN'] },
  { key: 'security',      label: 'Security',       icon: 'lock', roles: ['ADMIN'] },
]

export const EMPLOYEE_BUCKETS: SettingsBucket[] = [
  { key: 'profile',       label: 'Profile',       icon: 'user-circle',  roles: ['EMPLOYEE'] },
  { key: 'notifications', label: 'Notifications',  icon: 'bell',          roles: ['EMPLOYEE'] },
  { key: 'security',      label: 'Security',       icon: 'lock', roles: ['EMPLOYEE'] },
]

export const CLIENT_BUCKETS: SettingsBucket[] = [
  { key: 'profile',       label: 'Profile',       icon: 'user-circle',  roles: ['CLIENT'] },
  { key: 'notifications', label: 'Notifications',  icon: 'bell',          roles: ['CLIENT'] },
  { key: 'security',      label: 'Security',       icon: 'lock', roles: ['CLIENT'] },
]

export function getBucketsForRole(role: string): SettingsBucket[] {
  switch (role.toUpperCase()) {
    case 'ADMIN':    return ADMIN_BUCKETS
    case 'EMPLOYEE': return EMPLOYEE_BUCKETS
    default:         return CLIENT_BUCKETS
  }
}