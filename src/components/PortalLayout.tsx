import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const NAV = [
  { label: 'Home', href: '/portal', icon: 'home', exact: true },
  { label: 'Trips', href: '/portal/trips', icon: 'route' },
  { label: 'Earnings', href: '/portal/earnings', icon: 'trending_up' },
  { label: 'Advances', href: '/portal/advances', icon: 'credit_card' },
  { label: 'Leave', href: '/portal/leave', icon: 'event_busy' },
  { label: 'Cash', href: '/portal/cash', icon: 'account_balance' },
  { label: 'Slips', href: '/portal/slips', icon: 'receipt' },
  { label: 'Alerts', href: '/portal/notifications', icon: 'notifications' },
  { label: 'Profile', href: '/portal/profile', icon: 'person' },
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
      <header className="bg-primary px-4 h-14 flex items-center justify-between sticky top-0 z-20">
        <span className="text-white font-bold text-base tracking-tight">Voiture Voyages</span>
        <button
          onClick={handleSignOut}
          className="p-2 text-white/60 hover:text-white rounded-xl transition-colors"
        >
          <span className="material-symbols-rounded text-[22px]">logout</span>
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-20">
        <div className="flex">
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
              <span className="material-symbols-rounded text-[22px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
