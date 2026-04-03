import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import type { Advance, LeaveRequest, Salary } from '../../types'

// ── Unified notification item ──────────────────────────────────────────────

type NotifKind = 'advance' | 'leave' | 'salary'

interface NotifItem {
  id: string
  kind: NotifKind
  icon: string
  iconColor: string
  title: string
  subtitle: string
  date: string
}

function advanceToNotif(a: Advance): NotifItem {
  const map: Record<string, { icon: string; iconColor: string; title: string }> = {
    pending:  { icon: 'pending',       iconColor: 'text-yellow-500', title: 'Advance request submitted' },
    approved: { icon: 'check_circle',  iconColor: 'text-emerald-500', title: 'Advance approved' },
    rejected: { icon: 'cancel',        iconColor: 'text-red-500',     title: 'Advance rejected' },
    paid:     { icon: 'payments',      iconColor: 'text-blue-500',    title: 'Advance paid out' },
  }
  const meta = map[a.status] ?? map.pending
  return {
    id: `advance-${a.id}`,
    kind: 'advance',
    icon: meta.icon,
    iconColor: meta.iconColor,
    title: meta.title,
    subtitle: `AED ${parseFloat(a.amount_aed).toFixed(2)}${a.rejection_reason ? ` — ${a.rejection_reason}` : ''}`,
    date: a.updated_at,
  }
}

function leaveToNotif(l: LeaveRequest): NotifItem {
  const map: Record<string, { icon: string; iconColor: string; title: string }> = {
    pending:  { icon: 'schedule',      iconColor: 'text-yellow-500', title: 'Leave request submitted' },
    approved: { icon: 'event_available', iconColor: 'text-emerald-500', title: 'Leave approved' },
    rejected: { icon: 'event_busy',    iconColor: 'text-red-500',     title: 'Leave rejected' },
  }
  const meta = map[l.status] ?? map.pending
  const typeLabel = l.type === 'leave' ? 'Leave' : 'Permission'
  return {
    id: `leave-${l.id}`,
    kind: 'leave',
    icon: meta.icon,
    iconColor: meta.iconColor,
    title: `${typeLabel} — ${meta.title.split(' ').slice(1).join(' ')}`,
    subtitle: `${formatDate(l.from_date)}${l.from_date !== l.to_date ? ` → ${formatDate(l.to_date)}` : ''}${l.rejection_reason ? ` — ${l.rejection_reason}` : ''}`,
    date: l.created_at,
  }
}

function salaryToNotif(s: Salary): NotifItem {
  const [year, month] = s.period_month.split('-')
  const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-AE', {
    month: 'long',
    year: 'numeric',
  })
  return {
    id: `salary-${s.id}`,
    kind: 'salary',
    icon: 'account_balance_wallet',
    iconColor: 'text-primary',
    title: `Salary generated — ${label}`,
    subtitle: `Net payable: AED ${parseFloat(s.net_payable_aed).toFixed(2)}`,
    date: s.generated_at,
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function MyNotifications() {
  const { data: advances = [], isLoading: loadingAdv } = useQuery<Advance[]>({
    queryKey: ['portal-advances'],
    queryFn: () => apiGet('/advances'),
  })

  const { data: leaves = [], isLoading: loadingLeave } = useQuery<LeaveRequest[]>({
    queryKey: ['portal-leave'],
    queryFn: () => apiGet('/hr/requests'),
  })

  const { data: salaries = [], isLoading: loadingSal } = useQuery<Salary[]>({
    queryKey: ['portal-salary-slips'],
    queryFn: () => apiGet('/salaries'),
  })

  const isLoading = loadingAdv || loadingLeave || loadingSal

  const items: NotifItem[] = [
    ...advances.map(advanceToNotif),
    ...leaves.map(leaveToNotif),
    ...salaries.map(salaryToNotif),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h2 className="text-lg font-bold text-primary">Alerts</h2>
        <p className="text-sm text-muted">Updates on your requests and payments</p>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
          <span className="material-symbols-rounded text-[48px] opacity-30">notifications_none</span>
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <NotifCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotifCard({ item }: { item: NotifItem }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex items-start gap-3">
      <div className={`mt-0.5 shrink-0 ${item.iconColor}`}>
        <span className="material-symbols-rounded text-[26px]">{item.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary leading-snug">{item.title}</p>
        <p className="text-sm text-muted mt-0.5 leading-snug truncate">{item.subtitle}</p>
        <p className="text-xs text-muted/70 mt-1">{formatDate(item.date)}</p>
      </div>
    </div>
  )
}
