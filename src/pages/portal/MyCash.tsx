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

export default function MyCash() {
  const [month, setMonth] = useState(currentMonth())
  const isCurrentMonth = month === currentMonth()

  const { data: earnings, isLoading } = useQuery<EarningsReport>({
    queryKey: ['portal-earnings', month],
    queryFn: () => apiGet(`/portal/me/earnings?month=${month}`),
  })

  const monthLabel = new Date(month + '-01').toLocaleString('en-AE', { month: 'long', year: 'numeric' })

  const totalCashReceived = earnings ? parseFloat(earnings.total_cash) : 0

  // Cash submitted is derived: total earnings minus the cash not handed over.
  // We use earnings.total_cash as received from trips.
  // Without a dedicated handover endpoint, we surface what we know from trip data.
  // Show received vs card/other so the driver can see what's cash vs non-cash clearly.
  const totalCard = earnings ? parseFloat(earnings.total_card) : 0
  const totalOther = earnings ? parseFloat(earnings.total_other) : 0
  const grandTotal = earnings ? parseFloat(earnings.grand_total) : 0

  return (
    <div className="p-4 space-y-4">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(prevMonth(month))} className="p-2 rounded-lg hover:bg-surface">
          <span className="material-symbols-rounded text-[20px] text-muted">chevron_left</span>
        </button>
        <div className="text-center">
          <h2 className="text-base font-bold text-primary">{monthLabel}</h2>
          <p className="text-xs text-muted">Cash Summary</p>
        </div>
        <button
          onClick={() => setMonth(nextMonth(month))}
          disabled={isCurrentMonth}
          className="p-2 rounded-lg hover:bg-surface disabled:opacity-30"
        >
          <span className="material-symbols-rounded text-[20px] text-muted">chevron_right</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : !earnings ? (
        <div className="py-12 text-center text-muted">No data for this month</div>
      ) : (
        <>
          {/* Cash received hero */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <span className="material-symbols-rounded text-[18px]">payments</span>
              <span className="text-sm font-medium">Total Cash Received</span>
            </div>
            <p className="text-3xl font-bold tracking-tight">{formatAed(totalCashReceived)}</p>
            <p className="text-sm mt-2 opacity-70">From {earnings.days.length} working day{earnings.days.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <CashCard
              icon="account_balance_wallet"
              label="Cash Trips"
              value={formatAed(totalCashReceived)}
              sub="Total cash collected"
              accent="green"
            />
            <CashCard
              icon="credit_card"
              label="Card + Other"
              value={formatAed(totalCard + totalOther)}
              sub="Non-cash collections"
              accent="blue"
            />
          </div>

          {/* Grand total */}
          <div className="bg-white rounded-2xl border border-border px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <span className="material-symbols-rounded text-[20px] text-primary">summarize</span>
              </div>
              <div>
                <p className="text-xs text-muted">Total All Collections</p>
                <p className="text-sm font-semibold text-primary">Cash + Card + Other</p>
              </div>
            </div>
            <p className="text-lg font-bold text-primary">{formatAed(grandTotal)}</p>
          </div>

          {/* Daily cash breakdown */}
          {earnings.days.length > 0 && (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-surface flex items-center gap-2">
                <span className="material-symbols-rounded text-[18px] text-muted">calendar_today</span>
                <p className="text-sm font-semibold text-primary">Daily Cash Breakdown</p>
              </div>
              {earnings.days.map((d) => {
                const cashAmt = parseFloat(d.cash_aed)
                return (
                  <div key={d.date} className="px-4 py-3 border-b border-border last:border-0 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary">
                        {new Date(d.date).toLocaleDateString('en-GB', {
                          weekday: 'short', day: 'numeric', month: 'short',
                        })}
                      </p>
                      {parseFloat(d.card_aed) > 0 && (
                        <p className="text-xs text-muted">Card {formatAed(d.card_aed)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{formatAed(cashAmt)}</p>
                      {cashAmt === 0 && (
                        <p className="text-xs text-muted">no cash</p>
                      )}
                    </div>
                  </div>
                )
              })}
              <div className="px-4 py-3 bg-surface flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">Cash Total</p>
                <p className="text-sm font-bold text-primary">{formatAed(totalCashReceived)}</p>
              </div>
            </div>
          )}

          {earnings.days.length === 0 && (
            <div className="py-10 text-center text-muted">No trip data for this month</div>
          )}
        </>
      )}
    </div>
  )
}

function CashCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string
  label: string
  value: string
  sub: string
  accent: 'green' | 'blue' | 'red'
}) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
  }
  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <div className={`inline-flex p-2 rounded-xl mb-2 ${colors[accent]}`}>
        <span className="material-symbols-rounded text-[20px]">{icon}</span>
      </div>
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="text-sm font-bold text-primary leading-tight">{value}</p>
      <p className="text-xs text-muted mt-0.5">{sub}</p>
    </div>
  )
}
