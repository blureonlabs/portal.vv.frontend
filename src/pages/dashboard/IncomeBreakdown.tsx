import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatAed } from '../../lib/utils'
import type { DashboardKpis } from '../../types'

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

export function IncomeBreakdown({ kpis, hasPieBreakdown, pieData }: {
  kpis?: DashboardKpis
  hasPieBreakdown: boolean
  pieData: { name: string; value: number }[]
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 hover-lift motion-reduce:transform-none flex flex-col">
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
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-32 h-32 rounded-full border-[6px] border-gray-100 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[10px] text-muted leading-tight">Total</p>
              <p className="text-sm font-bold text-primary leading-tight">
                {formatAed(kpis?.revenue_mtd ?? '0')}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted">No revenue breakdown this month</p>
        </div>
      )}
    </div>
  )
}
