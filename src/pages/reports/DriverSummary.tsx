import { formatAed } from '../../lib/utils'
import { EmptyState } from '../../components/ui/EmptyState'
import { Inbox } from 'lucide-react'
import type { DriverSummaryReport } from '../../types'

export function DriverSummaryTable({ rows, loading }: { rows: DriverSummaryReport[]; loading: boolean }) {
  const totals = rows.reduce(
    (acc, r) => ({
      trips: acc.trips + r.trips_count,
      revenue: acc.revenue + parseFloat(r.total_revenue_aed),
      expenses: acc.expenses + parseFloat(r.total_expenses_aed),
      net: acc.net + parseFloat(r.net_aed),
    }),
    { trips: 0, revenue: 0, expenses: 0, net: 0 }
  )

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-surface">
            <th className="py-3 px-4 text-left font-medium text-muted">Driver</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Trips</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Revenue (AED)</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Expenses (AED)</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Net (AED)</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="py-12 text-center text-muted">Loading...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={5} className="py-0"><EmptyState icon={Inbox} title="No data for selected period" /></td></tr>
          ) : (
            <>
              {rows.map((r, idx) => (
                <tr key={r.driver_id} className={`border-b border-border last:border-0 hover:bg-surface/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface/30'}`}>
                  <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-primary">{r.trips_count}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-green-700">{formatAed(r.total_revenue_aed)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-red-600">{formatAed(r.total_expenses_aed)}</td>
                  <td className={`py-2.5 px-4 text-right tabular-nums font-semibold ${parseFloat(r.net_aed) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatAed(r.net_aed)}
                  </td>
                </tr>
              ))}
              <tr className="bg-surface font-semibold text-sm border-t-2 border-border">
                <td className="py-3 px-4 text-primary">Total</td>
                <td className="py-3 px-4 text-right tabular-nums">{totals.trips}</td>
                <td className="py-3 px-4 text-right tabular-nums text-green-700">{formatAed(totals.revenue)}</td>
                <td className="py-3 px-4 text-right tabular-nums text-red-600">{formatAed(totals.expenses)}</td>
                <td className={`py-3 px-4 text-right tabular-nums ${totals.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatAed(totals.net)}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}
