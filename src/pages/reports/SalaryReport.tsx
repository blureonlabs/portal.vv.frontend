import { formatAed } from '../../lib/utils'
import { EmptyState } from '../../components/ui/EmptyState'
import { Inbox } from 'lucide-react'
import type { SalaryReport } from '../../types'

export function SalaryReportTable({ rows, loading }: { rows: SalaryReport[]; loading: boolean }) {
  const totals = rows.reduce(
    (acc, r) => ({
      gross: acc.gross + parseFloat(r.gross),
      deductions: acc.deductions + parseFloat(r.deductions),
      net: acc.net + parseFloat(r.net_payable),
    }),
    { gross: 0, deductions: 0, net: 0 }
  )

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-surface">
            <th className="py-3 px-4 text-left font-medium text-muted">Driver</th>
            <th className="py-3 px-4 text-left font-medium text-muted">Period</th>
            <th className="py-3 px-4 text-left font-medium text-muted">Type</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Gross (AED)</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Deductions (AED)</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Net Payable (AED)</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="py-12 text-center text-muted">Loading...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={6} className="py-0"><EmptyState icon={Inbox} title="No salary data for selected period" /></td></tr>
          ) : (
            <>
              {rows.map((r, idx) => (
                <tr key={idx} className={`border-b border-border last:border-0 hover:bg-surface/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface/30'}`}>
                  <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                  <td className="py-2.5 px-4 text-muted">{r.period}</td>
                  <td className="py-2.5 px-4 text-primary capitalize">{r.salary_type.replace(/_/g, ' ')}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-primary">{formatAed(r.gross)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-red-600">{formatAed(r.deductions)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-green-700">{formatAed(r.net_payable)}</td>
                </tr>
              ))}
              <tr className="bg-surface font-semibold text-sm border-t-2 border-border">
                <td className="py-3 px-4 text-primary" colSpan={3}>Total</td>
                <td className="py-3 px-4 text-right tabular-nums">{formatAed(totals.gross)}</td>
                <td className="py-3 px-4 text-right tabular-nums text-red-600">{formatAed(totals.deductions)}</td>
                <td className="py-3 px-4 text-right tabular-nums text-green-700">{formatAed(totals.net)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}
