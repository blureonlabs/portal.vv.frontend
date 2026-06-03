import { useNavigate } from 'react-router-dom'
import { formatAed } from '../../lib/utils'
import {
  TrendingUp, Landmark, Receipt, Users, Car, CreditCard, CalendarX, ShieldAlert,
  Gauge, Clock, AlertCircle, CloudOff, Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { DashboardKpis } from '../../types'

const ICON_MAP: Record<string, LucideIcon> = {
  trending_up: TrendingUp,
  account_balance: Landmark,
  receipt_long: Receipt,
  group: Users,
  directions_car: Car,
  payments: CreditCard,
  event_busy: CalendarX,
  shield_with_heart: ShieldAlert,
  speed: Gauge,
  schedule: Clock,
  error: AlertCircle,
  cloud_off: CloudOff,
  account_balance_wallet: Wallet,
}

function MsIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name]
  if (!Icon) return null
  const sizeMatch = className?.match(/text-\[(\d+)px\]/) || className?.match(/text-(\w+)/)
  let size = 20
  if (sizeMatch) {
    const val = parseInt(sizeMatch[1])
    if (!isNaN(val)) size = val
  }
  if (className?.includes('text-4xl')) size = 36
  if (className?.includes('text-lg')) size = 18
  const filteredClass = (className ?? '')
    .replace(/text-\[\d+px\]/g, '')
    .replace(/text-4xl/g, '')
    .replace(/text-lg/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return <Icon size={size} className={filteredClass || undefined} />
}

function KpiCard({
  label, value, sub, icon, accent, onClick,
}: {
  label: string
  value: string | number
  sub?: string
  icon: string
  accent: string
  onClick?: () => void
}) {
  const inner = (
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-primary mt-1 truncate">{value}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <MsIcon name={icon} className="text-[20px]" />
      </div>
    </div>
  )
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="bg-white rounded-2xl border border-border p-5 text-left w-full hover-lift motion-reduce:transform-none cursor-pointer"
      >
        {inner}
      </button>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-border p-5 hover-lift motion-reduce:transform-none">
      {inner}
    </div>
  )
}

export function KpiGrid({ kpis, isLoading, isError }: {
  kpis?: DashboardKpis
  isLoading: boolean
  isError: boolean
}) {
  const navigate = useNavigate()

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <MsIcon name="speed" className="text-muted text-[20px]" />
        <span className="text-xs font-semibold text-muted uppercase tracking-widest">Month at a Glance</span>
        <div className="flex-1 h-px bg-border ml-1" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-5 h-28 animate-pulse">
              <div className="h-2.5 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-7 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <MsIcon name="cloud_off" className="text-red-400 text-4xl" />
          <p className="text-red-800 font-semibold mt-3">Failed to load dashboard data</p>
          <p className="text-red-600 text-sm mt-1">Check your connection and refresh the page.</p>
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Revenue MTD"
            value={formatAed(kpis.revenue_mtd)}
            sub={`${kpis.trips_mtd} trips this month`}
            icon="trending_up"
            accent="bg-primary/10 text-primary"
          />
          <KpiCard
            label="Net Profit MTD"
            value={formatAed(kpis.net_profit)}
            sub="After all expenses"
            icon="account_balance"
            accent={parseFloat(kpis.net_profit) >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}
          />
          <KpiCard
            label="Total Expenses MTD"
            value={formatAed(kpis.total_expenses_mtd)}
            icon="receipt_long"
            accent="bg-primary/10 text-primary"
          />
          <KpiCard
            label="Active Drivers"
            value={kpis.active_drivers}
            icon="group"
            accent="bg-success/10 text-success"
            onClick={() => navigate('/drivers')}
          />
          <KpiCard
            label="Active Vehicles"
            value={kpis.active_vehicles}
            icon="directions_car"
            accent="bg-primary/10 text-primary"
            onClick={() => navigate('/vehicles')}
          />
          <KpiCard
            label="Pending Advances"
            value={kpis.pending_advances}
            icon="payments"
            accent={kpis.pending_advances > 0 ? 'bg-warning/10 text-warning' : 'bg-gray-100 text-gray-400'}
            onClick={() => navigate('/advances')}
          />
          <KpiCard
            label="Outstanding Advances"
            value={formatAed(kpis.outstanding_advances ?? '0')}
            icon="account_balance_wallet"
            accent="bg-warning/10 text-warning"
          />
          <KpiCard
            label="Pending Leave"
            value={kpis.pending_leave}
            icon="event_busy"
            accent={kpis.pending_leave > 0 ? 'bg-warning/10 text-warning' : 'bg-gray-100 text-gray-400'}
            onClick={() => navigate('/hr')}
          />
          <KpiCard
            label="Insurance Alerts"
            value={kpis.insurance_expiring_soon.length}
            icon="shield_with_heart"
            accent={kpis.insurance_expiring_soon.length > 0 ? 'bg-danger/10 text-danger' : 'bg-gray-100 text-gray-400'}
            onClick={() => navigate('/vehicles')}
          />
        </div>
      ) : null}
    </section>
  )
}
