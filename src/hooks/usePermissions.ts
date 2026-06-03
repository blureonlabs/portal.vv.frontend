import { useAuthStore } from '../store/authStore'

export function usePermissions() {
  const { user } = useAuthStore()
  return {
    role: user?.role,
    isSuperAdmin: user?.role === 'super_admin',
    isAccountant: user?.role === 'accountant',
    isHr: user?.role === 'hr',
    isDriver: user?.role === 'driver',
    isOwner: user?.role === 'owner',
    canManageFinance: user?.role === 'super_admin' || user?.role === 'accountant',
    canManageHr: user?.role === 'super_admin' || user?.role === 'hr',
    canAdmin: user?.role === 'super_admin' || user?.role === 'accountant',
  }
}
