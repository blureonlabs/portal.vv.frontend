import { EmptyState } from '../../components/ui/EmptyState'
import { Inbox } from 'lucide-react'
import type { LeaveReport } from '../../types'

export function LeaveReportTable({ rows, loading }: { rows: LeaveReport[]; loading: boolean }) {
  const totals = rows.reduce(
    (acc, r) => ({
      days: acc.days + r.total_leave_days,
      permissions: acc.permissions + r.total_permissions,
      pending: acc.pending + r.pending_count,
      approved: acc.approved + r.approved_count,
      rejected: acc.rejected + r.rejected_count,
    }),
    { days: 0, permissions: 0, pending: 0, approved: 0, rejected: 0 }
  )

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-surface">
            <th className="py-3 px-4 text-left font-medium text-muted">Driver</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Leave Days</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Permissions</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Pending</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Approved</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Rejected</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="py-12 text-center text-muted">Loading...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={6} className="py-0"><EmptyState icon={Inbox} title="No leave data for selected period" /></td></tr>
          ) : (
            <>
              {rows.map((r, idx) => (
                <tr key={r.driver_name} className={`border-b border-border last:border-0 hover:bg-surface/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface/30'}`}>
                  <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-primary">{r.total_leave_days}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-primary">{r.total_permissions}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-yellow-600">{r.pending_count}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-green-700">{r.approved_count}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-red-600">{r.rejected_count}</td>
                </tr>
              ))}
              <tr className="bg-surface font-semibold text-sm border-t-2 border-border">
                <td className="py-3 px-4 text-primary">Total</td>
                <td className="py-3 px-4 text-right tabular-nums">{totals.days}</td>
                <td className="py-3 px-4 text-right tabular-nums">{totals.permissions}</td>
                <td className="py-3 px-4 text-right tabular-nums text-yellow-600">{totals.pending}</td>
                <td className="py-3 px-4 text-right tabular-nums text-green-700">{totals.approved}</td>
                <td className="py-3 px-4 text-right tabular-nums text-red-600">{totals.rejected}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}
