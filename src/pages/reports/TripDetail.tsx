import { formatAed } from '../../lib/utils'
import { EmptyState } from '../../components/ui/EmptyState'
import { Inbox } from 'lucide-react'
import type { TripDetailReport } from '../../types'

export function TripDetailTable({ rows, loading }: { rows: TripDetailReport[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-surface">
            <th className="py-3 px-4 text-left font-medium text-muted">Driver</th>
            <th className="py-3 px-4 text-left font-medium text-muted">Date</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Cash</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Card</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Other</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Total</th>
            <th className="py-3 px-4 text-left font-medium text-muted">Notes</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="py-12 text-center text-muted">Loading...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={7} className="py-0"><EmptyState icon={Inbox} title="No trips in selected period" /></td></tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={r.trip_id} className={`border-b border-border last:border-0 hover:bg-surface/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface/30'}`}>
                <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                <td className="py-2.5 px-4 text-muted">{r.trip_date}</td>
                <td className="py-2.5 px-4 text-right tabular-nums text-primary">{formatAed(r.cash_aed)}</td>
                <td className="py-2.5 px-4 text-right tabular-nums text-primary">{formatAed(r.card_aed)}</td>
                <td className="py-2.5 px-4 text-right tabular-nums text-primary">{formatAed(r.other_aed)}</td>
                <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-primary">{formatAed(r.total_aed)}</td>
                <td className="py-2.5 px-4 text-muted text-xs">{r.notes ?? '--'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
