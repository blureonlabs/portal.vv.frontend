import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { AvatarUpload } from './AvatarUpload'
import { NotificationPanel, useNotificationCount } from './NotificationPanel'
import {
  Bell, Lock, LogOut, Menu,
  LayoutDashboard, UsersRound, BadgeCheck, Car, BookUser, Route, CreditCard,
  CalendarX, Wallet, Receipt, BarChart3, Megaphone, Settings, Shield,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '../types'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Team', href: '/users', icon: UsersRound, roles: ['super_admin'] },
  { label: 'Drivers', href: '/drivers', icon: BadgeCheck, roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Vehicles', href: '/vehicles', icon: Car, roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Owners', href: '/owners', icon: BookUser, roles: ['super_admin'] },
  { label: 'Trips', href: '/trips', icon: Route, roles: ['super_admin', 'accountant', 'hr', 'driver'] },
  { label: 'Finance', href: '/finance', icon: CreditCard, roles: ['super_admin', 'accountant'] },
  { label: 'Advances', href: '/advances', icon: CreditCard, roles: ['super_admin', 'accountant', 'hr', 'driver'] },
  { label: 'Leave', href: '/hr', icon: CalendarX, roles: ['super_admin', 'accountant', 'hr', 'driver'] },
  { label: 'Salary', href: '/salary', icon: Wallet, roles: ['super_admin', 'accountant'] },
  { label: 'Invoices', href: '/invoices', icon: Receipt, roles: ['super_admin', 'accountant'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['super_admin', 'accountant', 'hr'] },
  { label: 'Broadcasts', href: '/broadcasts', icon: Megaphone, roles: ['super_admin'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['super_admin', 'accountant'] },
  { label: 'Audit Log', href: '/audit', icon: Shield, roles: ['super_admin'] },
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
          <Bell size={24} className="text-white/60 hover:text-white" />
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
              <item.icon size={20} />
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
          <Lock size={20} />
          Change Password
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/8 hover:text-white/80 transition-all duration-200 w-full cursor-pointer"
        >
          <LogOut size={20} />
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
            <Menu size={24} className="text-white" />
          </button>
          <span className="text-white font-bold text-base tracking-tight">Voiture Voyages</span>
          <button
            onClick={() => setPanelOpen(true)}
            className="relative p-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Open notifications"
          >
            <Bell size={24} className="text-white/70 hover:text-white" />
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
