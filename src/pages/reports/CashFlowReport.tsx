import { formatAed } from '../../lib/utils'
import { EmptyState } from '../../components/ui/EmptyState'
import { Inbox } from 'lucide-react'
import type { CashFlowReport } from '../../types'

export function CashFlowTable({ rows, loading }: { rows: CashFlowReport[]; loading: boolean }) {
  const totals = rows.reduce(
    (acc, r) => ({
      received: acc.received + parseFloat(r.total_cash_received),
      submitted: acc.submitted + parseFloat(r.total_cash_submitted),
      shortfall: acc.shortfall + parseFloat(r.shortfall),
    }),
    { received: 0, submitted: 0, shortfall: 0 }
  )

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-surface">
            <th className="py-3 px-4 text-left font-medium text-muted">Driver</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Cash Received (AED)</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Cash Submitted (AED)</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Shortfall (AED)</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} className="py-12 text-center text-muted">Loading...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={4} className="py-0"><EmptyState icon={Inbox} title="No cash flow data for selected period" /></td></tr>
          ) : (
            <>
              {rows.map((r, idx) => (
                <tr key={r.driver_name} className={`border-b border-border last:border-0 hover:bg-surface/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface/30'}`}>
                  <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-primary">{formatAed(r.total_cash_received)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-green-700">{formatAed(r.total_cash_submitted)}</td>
                  <td className={`py-2.5 px-4 text-right tabular-nums font-semibold ${parseFloat(r.shortfall) > 0 ? 'text-red-700' : 'text-primary'}`}>
                    {formatAed(r.shortfall)}
                  </td>
                </tr>
              ))}
              <tr className="bg-surface font-semibold text-sm border-t-2 border-border">
                <td className="py-3 px-4 text-primary">Total</td>
                <td className="py-3 px-4 text-right tabular-nums">{formatAed(totals.received)}</td>
                <td className="py-3 px-4 text-right tabular-nums text-green-700">{formatAed(totals.submitted)}</td>
                <td className={`py-3 px-4 text-right tabular-nums ${totals.shortfall > 0 ? 'text-red-700' : 'text-primary'}`}>
                  {formatAed(totals.shortfall)}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}
