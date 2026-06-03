import { EmptyState } from '../../components/ui/EmptyState'
import { Inbox } from 'lucide-react'
import type { VehicleReport } from '../../types'

export function VehicleReportTable({ rows, loading }: { rows: VehicleReport[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-surface">
            <th className="py-3 px-4 text-left font-medium text-muted">Plate</th>
            <th className="py-3 px-4 text-left font-medium text-muted">Make / Model</th>
            <th className="py-3 px-4 text-left font-medium text-muted">Status</th>
            <th className="py-3 px-4 text-left font-medium text-muted">Owner</th>
            <th className="py-3 px-4 text-left font-medium text-muted">Current Driver</th>
            <th className="py-3 px-4 text-left font-medium text-muted">Insurance Expiry</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Services</th>
            <th className="py-3 px-4 text-left font-medium text-muted">Last Service</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="py-12 text-center text-muted">Loading...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={8} className="py-0"><EmptyState icon={Inbox} title="No vehicle data" /></td></tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={r.plate_number} className={`border-b border-border last:border-0 hover:bg-surface/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface/30'}`}>
                <td className="py-2.5 px-4 font-medium text-primary">{r.plate_number}</td>
                <td className="py-2.5 px-4 text-primary">{r.make} {r.model}</td>
                <td className="py-2.5 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : r.status === 'assigned'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-muted">{r.owner_name ?? '--'}</td>
                <td className="py-2.5 px-4 text-muted">{r.current_driver ?? '--'}</td>
                <td className="py-2.5 px-4 text-muted">{r.insurance_expiry ?? '--'}</td>
                <td className="py-2.5 px-4 text-right tabular-nums text-primary">{r.service_count}</td>
                <td className="py-2.5 px-4 text-muted">{r.last_service_date ?? '--'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
