import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatAed } from '../../lib/utils'
import type { DashboardKpis } from '../../types'

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

export function RevenueChart({ chartData, peakDay, kpis }: {
  chartData: { date: string; revenue: number; trips: number }[]
  peakDay: { date: string; revenue: number } | null
  kpis?: DashboardKpis
}) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 hover-lift motion-reduce:transform-none">
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
  )
}
