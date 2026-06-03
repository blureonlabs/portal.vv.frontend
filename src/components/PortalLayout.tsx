import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../hooks/useTheme'
import {
  LogOut, Home, Route, TrendingUp, CreditCard, CalendarX, Landmark, Receipt, Bell, User,
  Sun, Moon,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

const DRIVER_NAV: NavItem[] = [
  { label: 'Home', href: '/portal', icon: Home, exact: true },
  { label: 'Trips', href: '/portal/trips', icon: Route },
  { label: 'Earnings', href: '/portal/earnings', icon: TrendingUp },
  { label: 'Advances', href: '/portal/advances', icon: CreditCard },
  { label: 'Leave', href: '/portal/leave', icon: CalendarX },
  { label: 'Cash', href: '/portal/cash', icon: Landmark },
  { label: 'Slips', href: '/portal/slips', icon: Receipt },
  { label: 'Alerts', href: '/portal/notifications', icon: Bell },
  { label: 'Profile', href: '/portal/profile', icon: User },
]

const OWNER_NAV: NavItem[] = [
  { label: 'Home', href: '/owner-portal', icon: Home, exact: true },
]

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { clear } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { dark, toggle: toggleTheme } = useTheme()

  const isOwnerPortal = location.pathname.startsWith('/owner-portal')
  const NAV = isOwnerPortal ? OWNER_NAV : DRIVER_NAV

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    clear()
    navigate('/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Top bar */}
      <header className="bg-primary px-4 h-14 flex items-center justify-between sticky top-0 z-20">
        <span className="text-white font-bold text-base tracking-tight">Voiture Voyages</span>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 text-white/60 hover:text-white rounded-xl transition-colors"
          >
            {dark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="p-2 text-white/60 hover:text-white rounded-xl transition-colors"
          >
            <LogOut size={24} />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-20">
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted'
                )
              }
            >
              <item.icon size={24} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
