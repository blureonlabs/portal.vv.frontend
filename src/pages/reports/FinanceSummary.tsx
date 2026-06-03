import { formatAed } from '../../lib/utils'
import type { FinanceSummaryReport } from '../../types'

export function FinanceSummaryView({ data, loading }: { data?: FinanceSummaryReport; loading: boolean }) {
  if (loading) return <div className="py-12 text-center text-muted">Loading...</div>
  if (!data) return null

  return (
    <div className="space-y-5">
      {/* Revenue breakdown */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-primary mb-3">Revenue Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted">Cash</p>
            <p className="text-base font-semibold tabular-nums text-green-700">{formatAed(data.trip_revenue_cash)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Card</p>
            <p className="text-base font-semibold tabular-nums text-green-700">{formatAed(data.trip_revenue_card)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Other</p>
            <p className="text-base font-semibold tabular-nums text-green-700">{formatAed(data.trip_revenue_other)}</p>
          </div>
        </div>
      </div>

      {/* Expenses by category */}
      {data.expense_by_category.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-x-auto">
          <div className="px-4 py-3 border-b border-border bg-surface rounded-t-2xl">
            <h3 className="text-sm font-semibold text-primary">Expenses by Category</h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {data.expense_by_category.map((cat, idx) => (
                <tr key={cat.category} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? '' : 'bg-surface/30'}`}>
                  <td className="py-2.5 px-4 text-primary capitalize">{cat.category.replace(/_/g, ' ')}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-medium text-red-600">{formatAed(cat.total_aed)}</td>
                </tr>
              ))}
              <tr className="bg-surface font-semibold border-t-2 border-border">
                <td className="py-3 px-4 text-primary">Total</td>
                <td className="py-3 px-4 text-right tabular-nums text-red-700">{formatAed(data.total_expenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
