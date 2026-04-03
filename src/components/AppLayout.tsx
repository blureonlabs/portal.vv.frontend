import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Role } from '../types'

interface NavItem {
  label: string
  href: string
  icon: string
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: 'dashboard', roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Users', href: '/users', icon: 'group', roles: ['super_admin'] },
  { label: 'Drivers', href: '/drivers', icon: 'badge', roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Vehicles', href: '/vehicles', icon: 'directions_car', roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Trips', href: '/trips', icon: 'route', roles: ['super_admin', 'accountant', 'hr', 'driver'] },
  { label: 'Finance', href: '/finance', icon: 'payments', roles: ['super_admin', 'accountant'] },
  { label: 'Advances', href: '/advances', icon: 'credit_card', roles: ['super_admin', 'accountant', 'hr', 'driver'] },
  { label: 'Leave', href: '/hr', icon: 'event_busy', roles: ['super_admin', 'accountant', 'hr', 'driver'] },
  { label: 'Salary', href: '/salary', icon: 'account_balance_wallet', roles: ['super_admin', 'accountant'] },
  { label: 'Invoices', href: '/invoices', icon: 'receipt_long', roles: ['super_admin', 'accountant'] },
  { label: 'Reports', href: '/reports', icon: 'analytics', roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Settings', href: '/settings', icon: 'settings', roles: ['super_admin', 'accountant'] },
  { label: 'Audit Log', href: '/audit', icon: 'shield', roles: ['super_admin'] },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clear } = useAuthStore()

  const visibleNav = NAV_ITEMS.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    clear()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-primary flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6">
          <span className="text-white font-bold text-lg tracking-tight">Voiture Voyages</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                )}
              >
                <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User + Signout */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/8 hover:text-white/80 transition-all duration-200 w-full"
          >
            <span className="material-symbols-rounded text-[20px]">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
