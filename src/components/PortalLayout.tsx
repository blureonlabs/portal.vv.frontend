import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Route, TrendingUp, CreditCard, CalendarDays, LogOut } from 'lucide-react'
import { cn } from '../lib/utils'
import { supabase, LOGO_URL } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const NAV = [
  { label: 'Home', href: '/portal', icon: Home, exact: true },
  { label: 'Trips', href: '/portal/trips', icon: Route },
  { label: 'Earnings', href: '/portal/earnings', icon: TrendingUp },
  { label: 'Advances', href: '/portal/advances', icon: CreditCard },
  { label: 'Leave', href: '/portal/leave', icon: CalendarDays },
]

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { clear } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    clear()
    navigate('/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Top bar */}
      <header className="bg-white border-b border-border px-4 h-14 flex items-center justify-between sticky top-0 z-20">
        <img src={LOGO_URL} alt="Voiture Voyages" className="h-7" />
        <button
          onClick={handleSignOut}
          className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-20 safe-area-pb">
        <div className="flex">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors',
                  isActive ? 'text-brand' : 'text-gray-400'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
