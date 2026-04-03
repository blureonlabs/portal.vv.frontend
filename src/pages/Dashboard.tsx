import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { apiGet } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { formatAed } from '../lib/utils'
import type { DashboardKpis } from '../types'

/** Material Symbols icon helper */
function MsIcon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className ?? ''}`}>{name}</span>
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
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl border border-border p-5 text-left w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="text-2xl font-bold text-primary mt-1">{value}</p>
          {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <MsIcon name={icon} className="text-white text-xl" />
        </div>
      </div>
    </button>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const monthLabel = new Date().toLocaleString('en-AE', { month: 'long', year: 'numeric' })

  const { data: kpis, isLoading, isError } = useQuery<DashboardKpis>({
    queryKey: ['dashboard'],
    queryFn: () => apiGet('/dashboard'),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const chartData = kpis?.revenue_trend.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    revenue: parseFloat(d.revenue_aed),
    trips: d.trips_count,
  })) ?? []

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-muted text-sm">Welcome back, {user?.full_name} · {monthLabel}</p>
      </div>

      {/* Insurance alerts */}
      {kpis && kpis.insurance_expiring_soon.length > 0 && (
        <div className="space-y-2">
          {kpis.insurance_expiring_soon.map((a) => (
            <div
              key={a.vehicle_id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                a.days_left <= 7
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              <MsIcon name="warning" className="text-lg flex-shrink-0" />
              <span>
                Vehicle <strong>{a.plate_number}</strong> insurance expires in{' '}
                <strong>{a.days_left} day{a.days_left !== 1 ? 's' : ''}</strong>{' '}
                ({new Date(a.insurance_expiry).toLocaleDateString('en-GB')})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-5 h-28 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-7 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <MsIcon name="cloud_off" className="text-red-400 text-3xl" />
          <p className="text-red-800 font-medium mt-2">Failed to load dashboard data</p>
          <p className="text-red-600 text-sm mt-1">Please check your connection and try refreshing the page.</p>
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard
            label={`Revenue MTD`}
            value={formatAed(kpis.revenue_mtd)}
            sub={`${kpis.trips_mtd} trips`}
            icon="trending_up"
            accent="bg-primary"
          />
          <KpiCard
            label="Active Drivers"
            value={kpis.active_drivers}
            icon="group"
            accent="bg-emerald-500"
            onClick={() => navigate('/drivers')}
          />
          <KpiCard
            label="Active Vehicles"
            value={kpis.active_vehicles}
            icon="directions_car"
            accent="bg-sky-500"
            onClick={() => navigate('/vehicles')}
          />
          <KpiCard
            label="Pending Advances"
            value={kpis.pending_advances}
            icon="payments"
            accent={kpis.pending_advances > 0 ? 'bg-amber-500' : 'bg-gray-400'}
            onClick={() => navigate('/advances')}
          />
          <KpiCard
            label="Pending Leave"
            value={kpis.pending_leave}
            icon="event_busy"
            accent={kpis.pending_leave > 0 ? 'bg-amber-500' : 'bg-gray-400'}
            onClick={() => navigate('/hr')}
          />
          <KpiCard
            label="Insurance Alerts"
            value={kpis.insurance_expiring_soon.length}
            icon="shield_with_heart"
            accent={kpis.insurance_expiring_soon.length > 0 ? 'bg-red-500' : 'bg-gray-400'}
            onClick={() => navigate('/vehicles')}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue trend chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5">
          <p className="text-sm font-semibold text-primary mb-4">Revenue — Last 30 Days</p>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand, #161f3f)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-brand, #161f3f)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(val) => [`AED ${Number(val).toLocaleString('en-AE', { minimumFractionDigits: 0 })}`, 'Revenue']}
                  labelStyle={{ fontSize: 11 }}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-brand, #161f3f)"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top drivers */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <p className="text-sm font-semibold text-primary mb-3">Top Drivers (MTD)</p>
          {!kpis || kpis.top_drivers.length === 0 ? (
            <div className="text-muted text-sm py-8 text-center">No trips this month</div>
          ) : (
            <div className="space-y-3">
              {kpis.top_drivers.map((d, i) => (
                <div key={d.driver_id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{d.driver_name}</p>
                    <p className="text-xs text-muted">{d.trips_count} trips</p>
                  </div>
                  <p className="text-sm font-bold text-primary whitespace-nowrap">{formatAed(d.revenue_aed)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
