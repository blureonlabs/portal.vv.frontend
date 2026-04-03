import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { formatAed } from '../../lib/utils'
import type { Advance, DriverContext, EarningsReport, LeaveRequest } from '../../types'

function today() {
  return new Date().toISOString().slice(0, 10)
}
function monthStart() {
  const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10)
}

export default function PortalHome() {
  const { data: ctx } = useQuery<DriverContext>({
    queryKey: ['portal-me'],
    queryFn: () => apiGet('/portal/me'),
  })

  const currentMonth = new Date().toISOString().slice(0, 7)
  const { data: earnings } = useQuery<EarningsReport>({
    queryKey: ['portal-earnings', currentMonth],
    queryFn: () => apiGet(`/portal/me/earnings?month=${currentMonth}`),
  })

  const { data: advances = [] } = useQuery<Advance[]>({
    queryKey: ['portal-advances'],
    queryFn: () => apiGet('/advances'),
  })

  const { data: leaves = [] } = useQuery<LeaveRequest[]>({
    queryKey: ['portal-leave'],
    queryFn: () => apiGet(`/hr/requests?from=${monthStart()}&to=${today()}`),
  })

  const pendingAdvance = advances.find((a) => a.status === 'pending')
  const approvedAdvance = advances.find((a) => a.status === 'approved')
  const activeLeave = leaves.find(
    (l) => l.status === 'approved' && l.from_date <= today() && l.to_date >= today()
  )

  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-sm text-muted">Welcome back,</p>
        <h1 className="text-2xl font-bold text-primary">{ctx?.full_name ?? '—'}</h1>
        {ctx?.vehicle && (
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted">
            <span className="material-symbols-rounded text-[16px]">directions_car</span>
            <span>{ctx.vehicle.plate_number} · {ctx.vehicle.make} {ctx.vehicle.model}</span>
          </div>
        )}
      </div>

      {/* Monthly earnings card */}
      <div className="bg-primary rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-1 opacity-80">
          <span className="material-symbols-rounded text-[18px]">trending_up</span>
          <span className="text-sm font-medium">
            {new Date().toLocaleString('en-AE', { month: 'long', year: 'numeric' })} Earnings
          </span>
        </div>
        <p className="text-3xl font-bold tracking-tight">
          {earnings ? formatAed(earnings.grand_total) : '—'}
        </p>
        {earnings && (
          <div className="flex gap-4 mt-3 text-sm opacity-80">
            <span>Cash {formatAed(earnings.total_cash)}</span>
            <span>Card {formatAed(earnings.total_card)}</span>
            {parseFloat(earnings.total_other) > 0 && <span>Other {formatAed(earnings.total_other)}</span>}
          </div>
        )}
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatusCard
          icon="credit_card"
          label="Advance"
          value={
            pendingAdvance
              ? `${formatAed(pendingAdvance.amount_aed)} pending`
              : approvedAdvance
              ? `${formatAed(approvedAdvance.amount_aed)} approved`
              : 'No active advance'
          }
          accent={pendingAdvance ? 'yellow' : approvedAdvance ? 'green' : 'gray'}
        />
        <StatusCard
          icon="event_busy"
          label="Leave"
          value={activeLeave ? `On ${activeLeave.type} today` : 'No active leave'}
          accent={activeLeave ? 'blue' : 'gray'}
        />
      </div>

      {/* Quick stats */}
      {earnings && earnings.days.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold text-primary mb-3">Recent Days</h3>
          <div className="space-y-2">
            {earnings.days.slice(-5).reverse().map((d) => (
              <div key={d.date} className="flex items-center justify-between">
                <span className="text-sm text-muted">
                  {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="text-sm font-semibold text-primary">{formatAed(d.total_aed)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusCard({
  icon, label, value, accent,
}: {
  icon: string
  label: string
  value: string
  accent: 'green' | 'yellow' | 'blue' | 'gray'
}) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700',
    yellow: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    gray: 'bg-surface text-muted',
  }
  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <div className={`inline-flex p-2 rounded-xl mb-2 ${colors[accent]}`}>
        <span className="material-symbols-rounded text-[20px]">{icon}</span>
      </div>
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="text-sm font-medium text-primary">{value}</p>
    </div>
  )
}
