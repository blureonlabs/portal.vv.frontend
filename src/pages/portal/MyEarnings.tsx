import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { formatAed } from '../../lib/utils'
import type { EarningsReport } from '../../types'

function currentMonth() { return new Date().toISOString().slice(0, 7) }

function prevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function nextMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function MyEarnings() {
  const [month, setMonth] = useState(currentMonth())
  const isCurrentMonth = month === currentMonth()

  const { data: earnings, isLoading } = useQuery<EarningsReport>({
    queryKey: ['portal-earnings', month],
    queryFn: () => apiGet(`/me/earnings?month=${month}`),
  })

  const monthLabel = new Date(month + '-01').toLocaleString('en-AE', { month: 'long', year: 'numeric' })

  return (
    <div className="p-4 space-y-4">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(prevMonth(month))} className="p-2 rounded-lg hover:bg-surface">
          <span className="material-symbols-rounded text-[20px] text-muted">chevron_left</span>
        </button>
        <h2 className="text-base font-bold text-primary">{monthLabel}</h2>
        <button
          onClick={() => setMonth(nextMonth(month))}
          disabled={isCurrentMonth}
          className="p-2 rounded-lg hover:bg-surface disabled:opacity-30"
        >
          <span className="material-symbols-rounded text-[20px] text-muted">chevron_right</span>
        </button>
      </div>

      {/* Summary */}
      {earnings && (
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-white">
          <p className="text-sm opacity-80 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold">{formatAed(earnings.grand_total)}</p>
          <div className="flex gap-4 mt-3 text-sm opacity-80">
            <span>Cash {formatAed(earnings.total_cash)}</span>
            <span>Card {formatAed(earnings.total_card)}</span>
            {parseFloat(earnings.total_other) > 0 && <span>Other {formatAed(earnings.total_other)}</span>}
          </div>
        </div>
      )}

      {/* Daily breakdown */}
      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : !earnings || earnings.days.length === 0 ? (
        <div className="py-12 text-center text-muted">No earnings data for this month</div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface">
            <p className="text-sm font-semibold text-primary">Daily Breakdown</p>
          </div>
          {earnings.days.map((d) => (
            <div key={d.date} className="px-4 py-3 border-b border-border last:border-0 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">
                  {new Date(d.date).toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'short'
                  })}
                </p>
                <p className="text-xs text-muted">
                  C {formatAed(d.cash_aed)}
                  {parseFloat(d.card_aed) > 0 && ` · K ${formatAed(d.card_aed)}`}
                  {parseFloat(d.other_aed) > 0 && ` · O ${formatAed(d.other_aed)}`}
                </p>
              </div>
              <p className="text-sm font-bold text-primary">{formatAed(d.total_aed)}</p>
            </div>
          ))}
          {/* Total row */}
          <div className="px-4 py-3 bg-surface flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">Total</p>
            <p className="text-sm font-bold text-primary">{formatAed(earnings.grand_total)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
