import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import type { DashboardKpis } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = 'insurance' | 'advance' | 'leave'

export interface NotificationItem {
  id: string
  type: NotificationType
  icon: string
  message: string
  timestamp: string // ISO or human-readable label
  iconColor: string
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = 'fms-dismissed-notifications'

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveDismissed(ids: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...ids]))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildNotifications(kpis: DashboardKpis): NotificationItem[] {
  const items: NotificationItem[] = []

  // Insurance expiry alerts
  for (const alert of kpis.insurance_expiring_soon ?? []) {
    const label = alert.is_expired
      ? `Vehicle ${alert.plate_number} insurance has expired`
      : `Vehicle ${alert.plate_number} insurance expires in ${alert.days_left} day${alert.days_left === 1 ? '' : 's'}`

    items.push({
      id: `insurance-${alert.vehicle_id}`,
      type: 'insurance',
      icon: 'shield_with_heart',
      message: label,
      timestamp: alert.insurance_expiry,
      iconColor: alert.is_expired ? 'text-danger' : 'text-warning',
    })
  }

  // Pending advances
  if ((kpis.pending_advances ?? 0) > 0) {
    items.push({
      id: 'advance-pending',
      type: 'advance',
      icon: 'credit_card',
      message: `${kpis.pending_advances} advance request${kpis.pending_advances === 1 ? '' : 's'} awaiting approval`,
      timestamp: new Date().toISOString(),
      iconColor: 'text-accent',
    })
  }

  // Pending leave
  if ((kpis.pending_leave ?? 0) > 0) {
    items.push({
      id: 'leave-pending',
      type: 'leave',
      icon: 'event_busy',
      message: `${kpis.pending_leave} leave request${kpis.pending_leave === 1 ? '' : 's'} awaiting approval`,
      timestamp: new Date().toISOString(),
      iconColor: 'text-accent',
    })
  }

  return items
}

/** Returns a short relative-time label for display */
function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  if (isNaN(then)) return ''
  const diff = now - then
  if (diff < 0) {
    // Future date (e.g. expiry date)
    const futureDiff = -diff
    const days = Math.floor(futureDiff / 86_400_000)
    if (days === 0) return 'today'
    if (days === 1) return 'tomorrow'
    return `in ${days} days`
  }
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB')
}

// ─── Panel Component ───────────────────────────────────────────────────────────

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [tab, setTab] = useState<'unread' | 'all'>('unread')
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed)
  const panelRef = useRef<HTMLDivElement>(null)

  const { data: kpis } = useQuery<DashboardKpis>({
    queryKey: ['dashboard'],
    queryFn: () => apiGet('/dashboard'),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const allNotifications: NotificationItem[] = kpis ? buildNotifications(kpis) : []
  const unread = allNotifications.filter((n) => !dismissed.has(n.id))
  const displayed = tab === 'unread' ? unread : allNotifications

  // Dismiss a notification (mark as read)
  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      saveDismissed(next)
      return next
    })
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            ref={panelRef}
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 h-full w-[380px] z-50 flex flex-col shadow-2xl"
            style={{ maxWidth: '95vw' }}
          >
            {/* Header */}
            <div className="bg-primary px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-[22px] text-white">notifications</span>
                <h2 className="text-base font-semibold text-white">Notifications</h2>
                {unread.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-danger text-white text-[10px] font-bold">
                    {unread.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close notifications"
              >
                <span className="material-symbols-rounded text-[20px]">close</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-primary border-b border-white/10 flex flex-shrink-0">
              {(['unread', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                    tab === t
                      ? 'text-white border-b-2 border-white'
                      : 'text-white/50 hover:text-white/80 border-b-2 border-transparent'
                  }`}
                >
                  {t === 'unread' ? `Unread${unread.length > 0 ? ` (${unread.length})` : ''}` : 'All'}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 bg-surface overflow-y-auto">
              {displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center px-8">
                  <span className="material-symbols-rounded text-[48px] text-muted/40">
                    {tab === 'unread' ? 'notifications_off' : 'inbox'}
                  </span>
                  <p className="text-sm font-medium text-muted">
                    {tab === 'unread' ? 'All caught up!' : 'No notifications yet'}
                  </p>
                  <p className="text-xs text-muted/70">
                    {tab === 'unread'
                      ? 'No unread notifications at the moment.'
                      : 'Notifications will appear here when there are alerts.'}
                  </p>
                </div>
              ) : (
                <ul className="p-4 space-y-3">
                  <AnimatePresence initial={false}>
                    {displayed.map((item) => {
                      const isRead = dismissed.has(item.id)
                      return (
                        <motion.li
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.2 }}
                        >
                          <div
                            className={`rounded-2xl border px-4 py-3.5 flex items-start gap-3 transition-colors ${
                              isRead
                                ? 'bg-white border-border opacity-60'
                                : 'bg-white border-border shadow-sm'
                            }`}
                          >
                            {/* Icon */}
                            <div className="mt-0.5 flex-shrink-0">
                              <span
                                className={`material-symbols-rounded text-[22px] ${item.iconColor}`}
                              >
                                {item.icon}
                              </span>
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm leading-snug ${
                                  isRead ? 'text-muted' : 'text-primary font-medium'
                                }`}
                              >
                                {item.message}
                              </p>
                              {item.timestamp && (
                                <p className="text-xs text-muted mt-1">
                                  {relativeTime(item.timestamp)}
                                </p>
                              )}
                              {isRead && (
                                <span className="inline-block mt-1 text-[10px] font-semibold text-muted/60 uppercase tracking-wide">
                                  Read
                                </span>
                              )}
                            </div>

                            {/* Dismiss button (only for unread) */}
                            {!isRead && (
                              <button
                                onClick={() => dismiss(item.id)}
                                className="flex-shrink-0 p-1 rounded-lg text-muted hover:text-primary hover:bg-accent-light transition-colors mt-0.5"
                                aria-label="Mark as read"
                                title="Mark as read"
                              >
                                <span className="material-symbols-rounded text-[16px]">close</span>
                              </button>
                            )}
                          </div>
                        </motion.li>
                      )
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer: mark all read */}
            {unread.length > 0 && (
              <div className="bg-white border-t border-border px-4 py-3 flex-shrink-0">
                <button
                  onClick={() => {
                    const next = new Set(dismissed)
                    allNotifications.forEach((n) => next.add(n.id))
                    saveDismissed(next)
                    setDismissed(next)
                  }}
                  className="w-full text-sm font-medium text-primary/70 hover:text-primary transition-colors py-1"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Hook for unread count (used in AppLayout) ─────────────────────────────────

export function useNotificationCount(): { unreadCount: number } {
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed)

  const { data: kpis } = useQuery<DashboardKpis>({
    queryKey: ['dashboard'],
    queryFn: () => apiGet('/dashboard'),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  // Re-sync dismissed from localStorage whenever kpis change
  useEffect(() => {
    setDismissed(getDismissed())
  }, [kpis])

  const allNotifications = kpis ? buildNotifications(kpis) : []
  const unreadCount = allNotifications.filter((n) => !dismissed.has(n.id)).length

  return { unreadCount }
}
