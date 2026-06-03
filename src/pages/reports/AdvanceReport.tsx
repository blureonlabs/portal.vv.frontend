import { formatAed } from '../../lib/utils'
import { EmptyState } from '../../components/ui/EmptyState'
import { Inbox } from 'lucide-react'
import type { AdvanceReport } from '../../types'

export function AdvanceReportTable({ rows, loading }: { rows: AdvanceReport[]; loading: boolean }) {
  const totals = rows.reduce(
    (acc, r) => ({
      requested: acc.requested + parseFloat(r.total_requested),
      approved: acc.approved + parseFloat(r.total_approved),
      paid: acc.paid + parseFloat(r.total_paid),
      outstanding: acc.outstanding + parseFloat(r.outstanding_balance),
    }),
    { requested: 0, approved: 0, paid: 0, outstanding: 0 }
  )

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-surface">
            <th className="py-3 px-4 text-left font-medium text-muted">Driver</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Requested (AED)</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Approved (AED)</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Paid (AED)</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Outstanding (AED)</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="py-12 text-center text-muted">Loading...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={5} className="py-0"><EmptyState icon={Inbox} title="No advance data for selected period" /></td></tr>
          ) : (
            <>
              {rows.map((r, idx) => (
                <tr key={r.driver_name} className={`border-b border-border last:border-0 hover:bg-surface/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface/30'}`}>
                  <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-primary">{formatAed(r.total_requested)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-primary">{formatAed(r.total_approved)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-green-700">{formatAed(r.total_paid)}</td>
                  <td className={`py-2.5 px-4 text-right tabular-nums font-semibold ${parseFloat(r.outstanding_balance) > 0 ? 'text-red-700' : 'text-primary'}`}>
                    {formatAed(r.outstanding_balance)}
                  </td>
                </tr>
              ))}
              <tr className="bg-surface font-semibold text-sm border-t-2 border-border">
                <td className="py-3 px-4 text-primary">Total</td>
                <td className="py-3 px-4 text-right tabular-nums">{formatAed(totals.requested)}</td>
                <td className="py-3 px-4 text-right tabular-nums">{formatAed(totals.approved)}</td>
                <td className="py-3 px-4 text-right tabular-nums text-green-700">{formatAed(totals.paid)}</td>
                <td className={`py-3 px-4 text-right tabular-nums ${totals.outstanding > 0 ? 'text-red-700' : 'text-primary'}`}>
                  {formatAed(totals.outstanding)}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}
