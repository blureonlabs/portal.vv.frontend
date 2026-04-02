import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, LogOut, Car, UserCheck, Route, DollarSign } from 'lucide-react'
import { cn } from '../lib/utils'
import { supabase, LOGO_URL } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Role } from '../types'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Users', href: '/users', icon: Users, roles: ['super_admin'] },
  { label: 'Drivers', href: '/drivers', icon: UserCheck, roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Vehicles', href: '/vehicles', icon: Car, roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Trips', href: '/trips', icon: Route, roles: ['super_admin', 'accountant', 'hr', 'driver'] },
  { label: 'Finance', href: '/finance', icon: DollarSign, roles: ['super_admin', 'accountant'] },
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
      <aside className="w-60 flex-shrink-0 bg-white border-r border-border flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border">
          <img src={LOGO_URL} alt="Voiture Voyages" className="h-8" />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {visibleNav.map((item) => {
            const active = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent-light text-accent'
                    : 'text-muted hover:bg-surface hover:text-primary'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User + Signout */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
              <span className="text-accent text-sm font-bold">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary truncate">{user?.full_name}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-red-50 hover:text-danger transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
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
