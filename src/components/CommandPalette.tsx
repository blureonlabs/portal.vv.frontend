import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ArrowRight, LayoutDashboard, UsersRound, BadgeCheck, Car, BookUser,
  Route as RouteIcon, CreditCard, CalendarX, Wallet, Receipt, BarChart3,
  Settings, Shield, Megaphone,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SearchResult {
  id: string
  label: string
  description?: string
  href: string
  icon: ReactNode
  group: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

/* ------------------------------------------------------------------ */
/*  Static page list                                                   */
/* ------------------------------------------------------------------ */

const PAGES: SearchResult[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Overview & metrics', href: '/', icon: <LayoutDashboard size={16} />, group: 'Pages' },
  { id: 'team', label: 'Team', description: 'User management', href: '/users', icon: <UsersRound size={16} />, group: 'Pages' },
  { id: 'drivers', label: 'Drivers', description: 'Driver directory', href: '/drivers', icon: <BadgeCheck size={16} />, group: 'Pages' },
  { id: 'vehicles', label: 'Vehicles', description: 'Fleet management', href: '/vehicles', icon: <Car size={16} />, group: 'Pages' },
  { id: 'owners', label: 'Owners', description: 'Vehicle owners', href: '/owners', icon: <BookUser size={16} />, group: 'Pages' },
  { id: 'trips', label: 'Trips', description: 'Trip records', href: '/trips', icon: <RouteIcon size={16} />, group: 'Pages' },
  { id: 'finance', label: 'Finance', description: 'Financial overview', href: '/finance', icon: <CreditCard size={16} />, group: 'Pages' },
  { id: 'advances', label: 'Advances', description: 'Advance requests', href: '/advances', icon: <CreditCard size={16} />, group: 'Pages' },
  { id: 'leave', label: 'Leave Requests', description: 'HR leave management', href: '/hr', icon: <CalendarX size={16} />, group: 'Pages' },
  { id: 'salary', label: 'Salary', description: 'Salary processing', href: '/salary', icon: <Wallet size={16} />, group: 'Pages' },
  { id: 'invoices', label: 'Invoices', description: 'Invoice management', href: '/invoices', icon: <Receipt size={16} />, group: 'Pages' },
  { id: 'reports', label: 'Reports', description: 'Analytics & reports', href: '/reports', icon: <BarChart3 size={16} />, group: 'Pages' },
  { id: 'broadcasts', label: 'Broadcasts', description: 'Notifications broadcast', href: '/broadcasts', icon: <Megaphone size={16} />, group: 'Pages' },
  { id: 'settings', label: 'Settings', description: 'App settings', href: '/settings', icon: <Settings size={16} />, group: 'Pages' },
  { id: 'audit', label: 'Audit Log', description: 'Activity audit trail', href: '/audit', icon: <Shield size={16} />, group: 'Pages' },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Filter results
  const filtered = query.trim()
    ? PAGES.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
    : PAGES

  // Reset on open/query change
  useEffect(() => { setActiveIndex(0) }, [query])
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // Small delay to let animation start before focusing
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  // Navigate to result
  const go = useCallback(
    (result: SearchResult) => {
      onClose()
      navigate(result.href)
    },
    [navigate, onClose],
  )

  // Keyboard handling
  useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter' && filtered[activeIndex]) {
        e.preventDefault()
        go(filtered[activeIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, filtered, activeIndex, go, onClose])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // Group results
  const groups = filtered.reduce<Record<string, SearchResult[]>>((acc, r) => {
    ;(acc[r.group] ??= []).push(r)
    return acc
  }, {})

  let runningIndex = 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />

          {/* Dialog */}
          <motion.div
            className="relative w-full max-w-lg mx-4 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-border dark:border-slate-700">
              <Search size={18} className="text-muted dark:text-slate-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages..."
                className="flex-1 h-12 bg-transparent text-sm text-primary dark:text-slate-200 placeholder:text-muted dark:placeholder:text-slate-500 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center rounded-md border border-border dark:border-slate-600 px-1.5 py-0.5 text-[10px] font-medium text-muted dark:text-slate-400">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="text-sm text-muted dark:text-slate-400 text-center py-8">
                  No results found
                </p>
              )}
              {Object.entries(groups).map(([group, items]) => {
                const startIdx = runningIndex
                runningIndex += items.length
                return (
                  <div key={group}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-slate-500 px-3 pt-2 pb-1">
                      {group}
                    </p>
                    {items.map((item, i) => {
                      const idx = startIdx + i
                      return (
                        <button
                          key={item.id}
                          data-index={idx}
                          onClick={() => go(item)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                            idx === activeIndex
                              ? 'bg-primary/10 dark:bg-slate-700 text-primary dark:text-white'
                              : 'text-primary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <span className="flex-shrink-0 text-muted dark:text-slate-400">{item.icon}</span>
                          <span className="flex-1 text-left">
                            <span className="font-medium">{item.label}</span>
                            {item.description && (
                              <span className="ml-2 text-xs text-muted dark:text-slate-500">{item.description}</span>
                            )}
                          </span>
                          {idx === activeIndex && (
                            <ArrowRight size={14} className="text-muted dark:text-slate-400 flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border dark:border-slate-700 text-[11px] text-muted dark:text-slate-500">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> open</span>
              <span><kbd className="font-mono">esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
