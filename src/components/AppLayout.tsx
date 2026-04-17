import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { AvatarUpload } from './AvatarUpload'
import { NotificationPanel, useNotificationCount } from './NotificationPanel'
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
  { label: 'Owners', href: '/owners', icon: 'person_book', roles: ['super_admin'] },
  { label: 'Trips', href: '/trips', icon: 'route', roles: ['super_admin', 'accountant', 'hr', 'driver'] },
  { label: 'Finance', href: '/finance', icon: 'payments', roles: ['super_admin', 'accountant'] },
  { label: 'Advances', href: '/advances', icon: 'credit_card', roles: ['super_admin', 'accountant', 'hr', 'driver'] },
  { label: 'Leave', href: '/hr', icon: 'event_busy', roles: ['super_admin', 'accountant', 'hr', 'driver'] },
  { label: 'Salary', href: '/salary', icon: 'account_balance_wallet', roles: ['super_admin', 'accountant'] },
  { label: 'Invoices', href: '/invoices', icon: 'receipt_long', roles: ['super_admin', 'accountant'] },
  { label: 'Reports', href: '/reports', icon: 'analytics', roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Broadcasts', href: '/broadcasts', icon: 'campaign', roles: ['super_admin'] },
  { label: 'Settings', href: '/settings', icon: 'settings', roles: ['super_admin', 'accountant'] },
  { label: 'Audit Log', href: '/audit', icon: 'shield', roles: ['super_admin'] },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clear } = useAuthStore()
  const [panelOpen, setPanelOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { unreadCount } = useNotificationCount()

  const visibleNav = NAV_ITEMS.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    clear()
    navigate('/login')
  }

  const sidebarContent = (
    <>
      {/* Logo + Bell */}
      <div className="h-16 flex items-center justify-between px-6">
        <span className="text-white font-bold text-lg tracking-tight">Voiture Voyages</span>
        <button
          onClick={() => setPanelOpen(true)}
          className="relative p-2.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Open notifications"
        >
          <span className="material-symbols-rounded text-[22px] text-white/60 hover:text-white">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const active = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
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

      {/* User + Actions */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <AvatarUpload size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-white/50 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { navigate('/change-password'); setSidebarOpen(false) }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/8 hover:text-white/80 transition-all duration-200 w-full cursor-pointer"
        >
          <span className="material-symbols-rounded text-[20px]">lock</span>
          Change Password
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/8 hover:text-white/80 transition-all duration-200 w-full cursor-pointer"
        >
          <span className="material-symbols-rounded text-[20px]">logout</span>
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar — desktop: always visible; mobile: hidden by default */}
      <aside className="hidden md:flex w-[260px] flex-shrink-0 bg-primary flex-col z-10">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="relative z-10 w-[260px] flex-shrink-0 bg-primary flex flex-col h-full shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Right side: mobile top bar + main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden h-14 flex items-center justify-between px-4 bg-primary flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <span className="material-symbols-rounded text-[22px] text-white">menu</span>
          </button>
          <span className="text-white font-bold text-base tracking-tight">Voiture Voyages</span>
          <button
            onClick={() => setPanelOpen(true)}
            className="relative p-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Open notifications"
          >
            <span className="material-symbols-rounded text-[22px] text-white/70 hover:text-white">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>

    <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  )
}
