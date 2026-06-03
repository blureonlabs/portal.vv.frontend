import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { Clock, type LucideIcon } from 'lucide-react'
import type { DashboardKpis, Driver, DriverFinancial } from '../../types'
import { KpiGrid } from './KpiGrid'
import { RevenueChart } from './RevenueChart'
import { IncomeBreakdown } from './IncomeBreakdown'
import { AlertsPanel } from './AlertsPanel'
import { DriverPerformance } from './DriverPerformance'
import { BarChart3 } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  schedule: Clock,
  bar_chart_4_bars: BarChart3,
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

const LS_KEY = 'fms-dismissed-notifications'
function getDismissed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')) } catch { return new Set() }
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [filterMonth, setFilterMonth] = useState(currentMonth)
  const [filterDriver, setFilterDriver] = useState('')
  const monthLabel = new Date(filterMonth + '-01').toLocaleString('en-AE', { month: 'long', year: 'numeric' })
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed)
  const dismiss = useCallback((id: string) => {
    setDismissed(prev => {
      const next = new Set(prev); next.add(id)
      localStorage.setItem(LS_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  const { data: allDrivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
    staleTime: 120_000,
  })
  const activeDrivers = allDrivers.filter((d) => d.is_active)

  const dashboardParams = new URLSearchParams()
  if (filterMonth) dashboardParams.set('month', filterMonth)
  if (filterDriver) dashboardParams.set('driver_id', filterDriver)
  const dashboardQs = dashboardParams.toString() ? `?${dashboardParams.toString()}` : ''

  const { data: kpis, isLoading, isError } = useQuery<DashboardKpis>({
    queryKey: ['dashboard', filterMonth, filterDriver],
    queryFn: () => apiGet(`/dashboard${dashboardQs}`),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const { data: driverFinancials } = useQuery<DriverFinancial[]>({
    queryKey: ['dashboard-driver-financials', filterMonth, filterDriver],
    queryFn: () => apiGet(`/dashboard/driver-financials${dashboardQs}`),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  // Revenue trend chart data
  const chartData = kpis?.revenue_trend.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    revenue: parseFloat(d.revenue_aed),
    trips: d.trips_count,
  })) ?? []

  // Income breakdown pie data
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
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">

      {/* Page Header */}
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={filterDriver}
          onChange={(e) => setFilterDriver(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">All Drivers</option>
          {activeDrivers.map((d) => (
            <option key={d.id} value={d.id}>{d.full_name}</option>
          ))}
        </select>
      </div>

      {/* Alerts */}
      <AlertsPanel kpis={kpis} dismissed={dismissed} dismiss={dismiss} />

      {/* KPI Cards */}
      <KpiGrid kpis={kpis} isLoading={isLoading} isError={isError} />

      {/* Charts Row */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MsIcon name="bar_chart_4_bars" className="text-muted text-[20px]" />
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">Revenue Insights</span>
          <div className="flex-1 h-px bg-border ml-1" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RevenueChart chartData={chartData} peakDay={peakDay} kpis={kpis} />
          <IncomeBreakdown kpis={kpis} hasPieBreakdown={!!hasPieBreakdown} pieData={pieData} />
        </div>
      </section>

      {/* Driver Performance */}
      <DriverPerformance kpis={kpis} driverFinancials={driverFinancials} />

    </div>
  )
}
