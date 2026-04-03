import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { apiGet } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { formatAed } from '../lib/utils'
import type { DashboardKpis } from '../types'

/** Material Symbols icon helper */
function MsIcon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className ?? ''}`}>{name}</span>
}

function SectionHeading({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <MsIcon name={icon} className="text-muted text-[18px]" />
      <span className="text-xs font-semibold text-muted uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-border ml-1" />
    </div>
  )
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
      className={`bg-white rounded-2xl border border-border p-5 text-left w-full hover-lift ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-primary mt-1 truncate">{value}</p>
          {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
          <MsIcon name={icon} className="text-white text-[20px]" />
        </div>
      </div>
    </button>
  )
}

function PlaceholderCard({
  icon,
  title,
  message,
  colSpan,
}: {
  icon: string
  title: string
  message: string
  colSpan?: string
}) {
  return (
    <div className={`bg-white rounded-2xl border border-border p-6 hover-lift flex flex-col ${colSpan ?? ''}`}>
      <p className="text-sm font-semibold text-primary mb-4">{title}</p>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
        <div className="w-12 h-12 rounded-2xl bg-accent-light flex items-center justify-center">
          <MsIcon name={icon} className="text-primary text-2xl" />
        </div>
        <p className="text-sm text-muted text-center">{message}</p>
      </div>
    </div>
  )
}

// Custom tooltip for area chart
function AreaTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-muted mb-1">{label}</p>
      <p className="font-bold text-primary">
        AED {Number(payload[0].value).toLocaleString('en-AE', { minimumFractionDigits: 0 })}
      </p>
    </div>
  )
}

// Custom tooltip for pie chart
function PieTooltip({ active, payload }: {
  active?: boolean
  payload?: { name: string; value: number }[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-muted mb-1">{payload[0].name}</p>
      <p className="font-bold text-primary">
        AED {Number(payload[0].value).toLocaleString('en-AE', { minimumFractionDigits: 0 })}
      </p>
    </div>
  )
}

const PIE_COLORS = {
  cash:  '#161f3f',
  card:  '#4f6bcd',
  other: '#9baad6',
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

  // Revenue trend chart data
  const chartData = kpis?.revenue_trend.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    revenue: parseFloat(d.revenue_aed),
    trips: d.trips_count,
  })) ?? []

  // Income breakdown pie data — use backend fields if available, else single-slice fallback
  const hasPieBreakdown =
    kpis &&
    (kpis.revenue_cash_mtd !== undefined ||
      kpis.revenue_card_mtd !== undefined ||
      kpis.revenue_other_mtd !== undefined)

  const pieData = hasPieBreakdown
    ? [
        { name: 'Cash',  value: parseFloat(kpis!.revenue_cash_mtd  ?? '0') },
        { name: 'Card',  value: parseFloat(kpis!.revenue_card_mtd  ?? '0') },
        { name: 'Other', value: parseFloat(kpis!.revenue_other_mtd ?? '0') },
      ].filter((d) => d.value > 0)
    : kpis
      ? [{ name: 'Total Revenue', value: parseFloat(kpis.revenue_mtd) }]
      : []

  // Revenue peak day
  const peakDay = chartData.reduce<{ date: string; revenue: number } | null>(
    (best, d) => (!best || d.revenue > best.revenue ? d : best),
    null,
  )

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">
            Welcome back, {user?.full_name} · {monthLabel}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-accent-light rounded-xl px-3 py-1.5 text-xs font-medium text-primary">
          <MsIcon name="schedule" className="text-[16px]" />
          Live · refreshes every 2 min
        </div>
      </div>

      {/* TODO: Document expiry alerts when backend endpoint is added */}

      {/* ── Insurance Alerts ── */}
      {kpis && kpis.insurance_expiring_soon.length > 0 && (
        <div className="space-y-2">
          {kpis.insurance_expiring_soon.map((a) => (
            <div
              key={a.vehicle_id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                a.is_expired
                  ? 'bg-red-100 border border-red-300 text-red-900'
                  : a.days_left <= 7
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              <MsIcon name="warning" className="text-lg flex-shrink-0" />
              <span>
                Vehicle <strong>{a.plate_number}</strong>{' '}
                {a.is_expired
                  ? <>insurance <strong>expired</strong> on {new Date(a.insurance_expiry).toLocaleDateString('en-GB')}</>
                  : <>insurance expires in <strong>{a.days_left} day{a.days_left !== 1 ? 's' : ''}</strong>{' '}({new Date(a.insurance_expiry).toLocaleDateString('en-GB')})</>
                }
              </span>
              <button
                onClick={() => navigate('/vehicles')}
                className="ml-auto text-xs underline underline-offset-2 whitespace-nowrap"
              >
                View vehicles
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <section>
        <SectionHeading icon="speed" label="Month at a Glance" />

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
              accent="bg-primary"
            />
            <KpiCard
              label="Net Profit MTD"
              value={formatAed(kpis.net_profit)}
              sub="After all expenses"
              icon="account_balance"
              accent={parseFloat(kpis.net_profit) >= 0 ? 'bg-emerald-600' : 'bg-red-500'}
            />
            <KpiCard
              label="Total Expenses MTD"
              value={formatAed(kpis.total_expenses_mtd)}
              icon="receipt_long"
              accent="bg-orange-500"
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
      </section>

      {/* ── Charts Row ── */}
      <section>
        <SectionHeading icon="bar_chart_4_bars" label="Revenue Insights" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue Trend (area chart) — spans 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 hover-lift">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-sm font-semibold text-primary">Revenue — Last 30 Days</p>
                {peakDay && (
                  <p className="text-xs text-muted mt-0.5">
                    Peak: <span className="font-medium text-primary">{peakDay.date}</span>{' '}
                    · AED {peakDay.revenue.toLocaleString('en-AE', { minimumFractionDigits: 0 })}
                  </p>
                )}
              </div>
              {kpis && (
                <div className="text-right">
                  <p className="text-xs text-muted">MTD Total</p>
                  <p className="text-sm font-bold text-primary">{formatAed(kpis.revenue_mtd)}</p>
                </div>
              )}
            </div>

            <div className="mt-4">
              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted text-sm">
                  No trip data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#161f3f" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#161f3f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      width={32}
                    />
                    <Tooltip content={<AreaTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#161f3f"
                      strokeWidth={2}
                      fill="url(#revGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#161f3f', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Income Breakdown Pie */}
          <div className="bg-white rounded-2xl border border-border p-5 hover-lift flex flex-col">
            <p className="text-sm font-semibold text-primary">Income Breakdown</p>
            <p className="text-xs text-muted mt-0.5 mb-4">Current month · by payment type</p>

            {!kpis ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full bg-gray-100 animate-pulse" />
              </div>
            ) : hasPieBreakdown && pieData.length > 0 ? (
              <div className="flex-1 flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            index === 0
                              ? PIE_COLORS.cash
                              : index === 1
                              ? PIE_COLORS.card
                              : PIE_COLORS.other
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2 mt-2">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              index === 0
                                ? PIE_COLORS.cash
                                : index === 1
                                ? PIE_COLORS.card
                                : PIE_COLORS.other,
                          }}
                        />
                        <span className="text-muted">{entry.name}</span>
                      </div>
                      <span className="font-semibold text-primary">
                        AED {entry.value.toLocaleString('en-AE', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Fallback: single-slice pie showing total */
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={[{ name: 'Revenue', value: parseFloat(kpis?.revenue_mtd ?? '0') }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={64}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        <Cell fill="#161f3f" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-muted leading-tight">Total</p>
                    <p className="text-xs font-bold text-primary leading-tight">
                      {formatAed(kpis?.revenue_mtd ?? '0')}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-muted">Cash / Card breakdown</p>
                  <div className="inline-flex items-center gap-1 mt-1 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1">
                    <MsIcon name="construction" className="text-amber-500 text-[14px]" />
                    <span className="text-[11px] font-medium text-amber-700">Coming soon</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Drivers & Ops Row ── */}
      <section>
        <SectionHeading icon="groups" label="Driver Performance" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Top Drivers */}
          <div className="bg-white rounded-2xl border border-border p-5 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-primary">Top Drivers</p>
              <span className="text-[10px] font-semibold text-muted bg-accent-light rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                MTD
              </span>
            </div>

            {!kpis || kpis.top_drivers.length === 0 ? (
              <div className="text-muted text-sm py-8 text-center">No trips this month</div>
            ) : (
              <div className="space-y-3">
                {kpis.top_drivers.map((d, i) => {
                  const pct =
                    kpis.top_drivers.length > 0
                      ? (parseFloat(d.revenue_aed) /
                          parseFloat(kpis.top_drivers[0].revenue_aed)) *
                        100
                      : 0
                  return (
                    <div key={d.driver_id} className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            i === 0
                              ? 'bg-primary text-white'
                              : i === 1
                              ? 'bg-gray-200 text-primary'
                              : 'bg-gray-100 text-muted'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{d.driver_name}</p>
                          <p className="text-xs text-muted">{d.trips_count} trip{d.trips_count !== 1 ? 's' : ''}</p>
                        </div>
                        <p className="text-sm font-bold text-primary whitespace-nowrap">
                          {formatAed(d.revenue_aed)}
                        </p>
                      </div>
                      {/* Revenue bar relative to #1 */}
                      <div className="ml-8 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%`, opacity: 1 - i * 0.15 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bottom Drivers */}
          <div className="bg-white rounded-2xl border border-border p-5 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-primary">Bottom Drivers</p>
              <span className="text-[10px] font-semibold text-muted bg-accent-light rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                MTD
              </span>
            </div>

            {!kpis || kpis.bottom_drivers.length === 0 ? (
              <div className="text-muted text-sm py-8 text-center">No trips this month</div>
            ) : (
              <div className="space-y-3">
                {kpis.bottom_drivers.map((d, i) => {
                  const maxRev = kpis.bottom_drivers.length > 0
                    ? parseFloat(kpis.bottom_drivers[kpis.bottom_drivers.length - 1].revenue_aed)
                    : 1
                  const pct = maxRev > 0 ? (parseFloat(d.revenue_aed) / maxRev) * 100 : 0
                  return (
                    <div key={d.driver_id} className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 text-red-700"
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{d.driver_name}</p>
                          <p className="text-xs text-muted">{d.trips_count} trip{d.trips_count !== 1 ? 's' : ''}</p>
                        </div>
                        <p className="text-sm font-bold text-primary whitespace-nowrap">
                          {formatAed(d.revenue_aed)}
                        </p>
                      </div>
                      <div className="ml-8 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Per-Driver Financials placeholder */}
          <PlaceholderCard
            icon="manage_accounts"
            title="Per-Driver Financials"
            message="Drill-down into individual driver revenue, expenses, and net earnings coming soon."
          />
        </div>
      </section>

    </div>
  )
}
