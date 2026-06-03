import { formatAed } from '../../lib/utils'
import { Badge } from '../../components/ui/Badge'
import { Users, type LucideIcon } from 'lucide-react'
import type { DashboardKpis, DriverFinancial } from '../../types'

const ICON_MAP: Record<string, LucideIcon> = {
  groups: Users,
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

export function DriverPerformance({ kpis, driverFinancials }: {
  kpis?: DashboardKpis
  driverFinancials?: DriverFinancial[]
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <MsIcon name="groups" className="text-muted text-[20px]" />
        <span className="text-xs font-semibold text-muted uppercase tracking-widest">Driver Performance</span>
        <div className="flex-1 h-px bg-border ml-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Drivers */}
        <div className="bg-white rounded-2xl border border-border p-5 hover-lift motion-reduce:transform-none">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-primary">Top Drivers</p>
            <Badge variant="default" className="text-[10px] uppercase tracking-wide">MTD</Badge>
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
        <div className="bg-white rounded-2xl border border-border p-5 hover-lift motion-reduce:transform-none">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-primary">Bottom Drivers</p>
            <Badge variant="default" className="text-[10px] uppercase tracking-wide">MTD</Badge>
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

        {/* Per-Driver Financials */}
        <div className="bg-white rounded-2xl border border-border p-5 hover-lift motion-reduce:transform-none flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-primary">Per-Driver Financials</p>
            <Badge variant="default" className="text-[10px] uppercase tracking-wide">MTD</Badge>
          </div>

          {!driverFinancials ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : driverFinancials.length === 0 ? (
            <div className="text-muted text-sm py-8 text-center">No data this month</div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted uppercase tracking-wide border-b border-border">
                    <th className="text-left pb-2 pr-2 font-semibold">Driver</th>
                    <th className="text-right pb-2 pr-2 font-semibold">Cash In</th>
                    <th className="text-right pb-2 pr-2 font-semibold">Submitted</th>
                    <th className="text-right pb-2 pr-2 font-semibold">Card</th>
                    <th className="text-right pb-2 font-semibold">Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {driverFinancials.map((d) => {
                    const shortfall = parseFloat(d.shortfall)
                    return (
                      <tr key={d.driver_id} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-2 font-medium text-primary truncate max-w-[80px]">
                          {d.driver_name}
                        </td>
                        <td className="py-2 pr-2 text-right text-primary">{formatAed(d.cash_received)}</td>
                        <td className="py-2 pr-2 text-right">
                          <span className={shortfall > 0 ? 'text-red-600 font-semibold' : 'text-primary'}>
                            {formatAed(d.cash_submitted)}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-right text-primary">{formatAed(d.card_total)}</td>
                        <td className="py-2 text-right text-orange-600">{formatAed(d.expenses_total)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
