import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet, apiFetchRaw } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useAuthStore } from '../store/authStore'
import { formatAed } from '../lib/utils'
import type {
  Driver,
  DriverSummaryReport,
  TripDetailReport,
  FinanceSummaryReport,
  AdvanceReport,
  CashFlowReport,
  LeaveReport,
  SalaryReport,
  VehicleReport,
} from '../types'

type TabId = 'drivers' | 'trips' | 'finance' | 'advances' | 'cash-flow' | 'leave' | 'salary' | 'vehicles'

function today() {
  return new Date().toISOString().slice(0, 10)
}
function monthStart() {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  useAuthStore()
  const [tab, setTab] = useState<TabId>('drivers')
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [driverId, setDriverId] = useState('')
  const [exporting, setExporting] = useState(false)

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
    enabled: tab === 'trips',
  })

  // Driver summary
  const driverParams = `from=${from}&to=${to}`
  const { data: driverSummary = [], isLoading: loadingDrivers } = useQuery<DriverSummaryReport[]>({
    queryKey: ['reports', 'drivers', from, to],
    queryFn: () => apiGet(`/reports/drivers?${driverParams}`),
    enabled: tab === 'drivers',
  })

  // Trip detail
  const tripParams = `from=${from}&to=${to}${driverId ? `&driver_id=${driverId}` : ''}`
  const { data: tripDetail = [], isLoading: loadingTrips } = useQuery<TripDetailReport[]>({
    queryKey: ['reports', 'trips', from, to, driverId],
    queryFn: () => apiGet(`/reports/trips?${tripParams}`),
    enabled: tab === 'trips',
  })

  // Finance summary
  const { data: finance, isLoading: loadingFinance } = useQuery<FinanceSummaryReport>({
    queryKey: ['reports', 'finance', from, to],
    queryFn: () => apiGet(`/reports/finance?from=${from}&to=${to}`),
    enabled: tab === 'finance',
  })

  // Advance report
  const { data: advances = [], isLoading: loadingAdvances } = useQuery<AdvanceReport[]>({
    queryKey: ['reports', 'advances', from, to],
    queryFn: () => apiGet(`/reports/advances?from=${from}&to=${to}`),
    enabled: tab === 'advances',
  })

  // Cash flow report
  const { data: cashFlow = [], isLoading: loadingCashFlow } = useQuery<CashFlowReport[]>({
    queryKey: ['reports', 'cash-flow', from, to],
    queryFn: () => apiGet(`/reports/cash-flow?from=${from}&to=${to}`),
    enabled: tab === 'cash-flow',
  })

  // Leave report
  const { data: leaveData = [], isLoading: loadingLeave } = useQuery<LeaveReport[]>({
    queryKey: ['reports', 'leave', from, to],
    queryFn: () => apiGet(`/reports/leave?from=${from}&to=${to}`),
    enabled: tab === 'leave',
  })

  // Salary report
  const { data: salaryData = [], isLoading: loadingSalary } = useQuery<SalaryReport[]>({
    queryKey: ['reports', 'salary', from, to],
    queryFn: () => apiGet(`/reports/salary?from=${from}&to=${to}`),
    enabled: tab === 'salary',
  })

  // Vehicle report
  const { data: vehicleData = [], isLoading: loadingVehicles } = useQuery<VehicleReport[]>({
    queryKey: ['reports', 'vehicles', from, to],
    queryFn: () => apiGet(`/reports/vehicles?from=${from}&to=${to}`),
    enabled: tab === 'vehicles',
  })

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      let path = ''
      let filename = ''
      if (tab === 'drivers') {
        path = `/reports/drivers?${driverParams}&format=csv`; filename = 'driver_summary.csv'
      } else if (tab === 'trips') {
        path = `/reports/trips?${tripParams}&format=csv`; filename = 'trip_detail.csv'
      } else if (tab === 'finance') {
        path = `/reports/finance?from=${from}&to=${to}&format=csv`; filename = 'finance_summary.csv'
      } else if (tab === 'advances') {
        path = `/reports/advances?from=${from}&to=${to}&format=csv`; filename = 'advance_report.csv'
      } else if (tab === 'cash-flow') {
        path = `/reports/cash-flow?from=${from}&to=${to}&format=csv`; filename = 'cash_flow.csv'
      } else if (tab === 'leave') {
        path = `/reports/leave?from=${from}&to=${to}&format=csv`; filename = 'leave_report.csv'
      } else if (tab === 'salary') {
        path = `/reports/salary?from=${from}&to=${to}&format=csv`; filename = 'salary_report.csv'
      } else {
        path = `/reports/vehicles?from=${from}&to=${to}&format=csv`; filename = 'vehicle_report.csv'
      }
      const blob = await apiFetchRaw(path)
      downloadBlob(blob, filename)
    } finally {
      setExporting(false)
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'drivers', label: 'Driver Summary' },
    { id: 'trips', label: 'Trip Detail' },
    { id: 'finance', label: 'Finance Summary' },
    { id: 'advances', label: 'Advance Report' },
    { id: 'cash-flow', label: 'Cash Flow' },
    { id: 'leave', label: 'Leave Report' },
    { id: 'salary', label: 'Salary Summary' },
    { id: 'vehicles', label: 'Vehicles' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-rounded text-[24px] text-primary">bar_chart</span>
          <h1 className="text-2xl font-bold text-primary">Reports</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exporting}>
          <span className="material-symbols-rounded text-[16px] mr-1">download</span>
          Export CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-lg w-full flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white shadow-sm text-primary' : 'text-muted hover:text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs text-muted mb-1">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        {tab === 'trips' && (
          <div>
            <label className="block text-xs text-muted mb-1">Driver</label>
            <Select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-48"
              options={[
                { value: '', label: 'All drivers' },
                ...drivers.map((d) => ({ value: d.id, label: d.full_name })),
              ]}
            />
          </div>
        )}
      </div>

      {/* Content */}
      {tab === 'drivers' && (
        <DriverSummaryTable rows={driverSummary} loading={loadingDrivers} />
      )}
      {tab === 'trips' && (
        <TripDetailTable rows={tripDetail} loading={loadingTrips} />
      )}
      {tab === 'finance' && (
        <FinanceSummaryView data={finance} loading={loadingFinance} />
      )}
      {tab === 'advances' && (
        <AdvanceReportTable rows={advances} loading={loadingAdvances} />
      )}
      {tab === 'cash-flow' && (
        <CashFlowTable rows={cashFlow} loading={loadingCashFlow} />
      )}
      {tab === 'leave' && (
        <LeaveReportTable rows={leaveData} loading={loadingLeave} />
      )}
      {tab === 'salary' && (
        <SalaryReportTable rows={salaryData} loading={loadingSalary} />
      )}
      {tab === 'vehicles' && (
        <VehicleReportTable rows={vehicleData} loading={loadingVehicles} />
      )}
    </div>
  )
}

function DriverSummaryTable({ rows, loading }: { rows: DriverSummaryReport[]; loading: boolean }) {
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
    <div className="bg-white rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
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
            <tr><td colSpan={5} className="py-12 text-center text-muted">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={5} className="py-12 text-center text-muted">No data for selected period</td></tr>
          ) : (
            <>
              {rows.map((r) => (
                <tr key={r.driver_id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                  <td className="py-2.5 px-4 text-right text-primary">{r.trips_count}</td>
                  <td className="py-2.5 px-4 text-right text-primary">{formatAed(r.total_revenue_aed)}</td>
                  <td className="py-2.5 px-4 text-right text-red-600">{formatAed(r.total_expenses_aed)}</td>
                  <td className={`py-2.5 px-4 text-right font-semibold ${parseFloat(r.net_aed) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatAed(r.net_aed)}
                  </td>
                </tr>
              ))}
              <tr className="bg-surface font-semibold text-sm border-t-2 border-border">
                <td className="py-3 px-4 text-primary">Total</td>
                <td className="py-3 px-4 text-right">{totals.trips}</td>
                <td className="py-3 px-4 text-right">{formatAed(totals.revenue)}</td>
                <td className="py-3 px-4 text-right text-red-600">{formatAed(totals.expenses)}</td>
                <td className={`py-3 px-4 text-right ${totals.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
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

function TripDetailTable({ rows, loading }: { rows: TripDetailReport[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
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
            <tr><td colSpan={7} className="py-12 text-center text-muted">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={7} className="py-12 text-center text-muted">No trips in selected period</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.trip_id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                <td className="py-2.5 px-4 text-muted">{r.trip_date}</td>
                <td className="py-2.5 px-4 text-right text-primary">{formatAed(r.cash_aed)}</td>
                <td className="py-2.5 px-4 text-right text-primary">{formatAed(r.card_aed)}</td>
                <td className="py-2.5 px-4 text-right text-primary">{formatAed(r.other_aed)}</td>
                <td className="py-2.5 px-4 text-right font-semibold text-primary">{formatAed(r.total_aed)}</td>
                <td className="py-2.5 px-4 text-muted text-xs">{r.notes ?? '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-xl font-bold text-primary">{value}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

function FinanceSummaryView({ data, loading }: { data?: FinanceSummaryReport; loading: boolean }) {
  if (loading) return <div className="py-12 text-center text-muted">Loading…</div>
  if (!data) return null

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatAed(data.trip_revenue_total)} sub="from trips" />
        <StatCard label="Total Expenses" value={formatAed(data.total_expenses)} />
        <StatCard label="Cash Handovers" value={formatAed(data.total_handovers)} />
        <StatCard label="Net" value={formatAed(data.net_aed)} />
      </div>

      {/* Revenue breakdown */}
      <div className="bg-white rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-primary mb-3">Revenue Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted">Cash</p>
            <p className="text-base font-semibold">{formatAed(data.trip_revenue_cash)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Card</p>
            <p className="text-base font-semibold">{formatAed(data.trip_revenue_card)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Other</p>
            <p className="text-base font-semibold">{formatAed(data.trip_revenue_other)}</p>
          </div>
        </div>
      </div>

      {/* Expenses by category */}
      {data.expense_by_category.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <div className="px-4 py-3 border-b border-border bg-surface">
            <h3 className="text-sm font-semibold text-primary">Expenses by Category</h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {data.expense_by_category.map((cat) => (
                <tr key={cat.category} className="border-b border-border last:border-0">
                  <td className="py-2.5 px-4 text-primary capitalize">{cat.category.replace(/_/g, ' ')}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-red-600">{formatAed(cat.total_aed)}</td>
                </tr>
              ))}
              <tr className="bg-surface font-semibold border-t-2 border-border">
                <td className="py-3 px-4 text-primary">Total</td>
                <td className="py-3 px-4 text-right text-red-700">{formatAed(data.total_expenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdvanceReportTable({ rows, loading }: { rows: AdvanceReport[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
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
            <tr><td colSpan={5} className="py-12 text-center text-muted">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={5} className="py-12 text-center text-muted">No advance data for selected period</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.driver_name} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                <td className="py-2.5 px-4 text-right text-primary">{formatAed(r.total_requested)}</td>
                <td className="py-2.5 px-4 text-right text-primary">{formatAed(r.total_approved)}</td>
                <td className="py-2.5 px-4 text-right text-green-700">{formatAed(r.total_paid)}</td>
                <td className={`py-2.5 px-4 text-right font-semibold ${parseFloat(r.outstanding_balance) > 0 ? 'text-red-700' : 'text-primary'}`}>
                  {formatAed(r.outstanding_balance)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function CashFlowTable({ rows, loading }: { rows: CashFlowReport[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="py-3 px-4 text-left font-medium text-muted">Driver</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Cash Received (AED)</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Cash Submitted (AED)</th>
            <th className="py-3 px-4 text-right font-medium text-muted">Shortfall (AED)</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} className="py-12 text-center text-muted">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={4} className="py-12 text-center text-muted">No cash flow data for selected period</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.driver_name} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                <td className="py-2.5 px-4 text-right text-primary">{formatAed(r.total_cash_received)}</td>
                <td className="py-2.5 px-4 text-right text-green-700">{formatAed(r.total_cash_submitted)}</td>
                <td className={`py-2.5 px-4 text-right font-semibold ${parseFloat(r.shortfall) > 0 ? 'text-red-700' : 'text-primary'}`}>
                  {formatAed(r.shortfall)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function LeaveReportTable({ rows, loading }: { rows: LeaveReport[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
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
            <tr><td colSpan={6} className="py-12 text-center text-muted">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={6} className="py-12 text-center text-muted">No leave data for selected period</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.driver_name} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                <td className="py-2.5 px-4 text-right text-primary">{r.total_leave_days}</td>
                <td className="py-2.5 px-4 text-right text-primary">{r.total_permissions}</td>
                <td className="py-2.5 px-4 text-right text-yellow-600">{r.pending_count}</td>
                <td className="py-2.5 px-4 text-right text-green-700">{r.approved_count}</td>
                <td className="py-2.5 px-4 text-right text-red-600">{r.rejected_count}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function SalaryReportTable({ rows, loading }: { rows: SalaryReport[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
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
            <tr><td colSpan={6} className="py-12 text-center text-muted">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={6} className="py-12 text-center text-muted">No salary data for selected period</td></tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={idx} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="py-2.5 px-4 font-medium text-primary">{r.driver_name}</td>
                <td className="py-2.5 px-4 text-muted">{r.period}</td>
                <td className="py-2.5 px-4 text-primary capitalize">{r.salary_type.replace(/_/g, ' ')}</td>
                <td className="py-2.5 px-4 text-right text-primary">{formatAed(r.gross)}</td>
                <td className="py-2.5 px-4 text-right text-red-600">{formatAed(r.deductions)}</td>
                <td className="py-2.5 px-4 text-right font-semibold text-green-700">{formatAed(r.net_payable)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function VehicleReportTable({ rows, loading }: { rows: VehicleReport[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
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
            <tr><td colSpan={8} className="py-12 text-center text-muted">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={8} className="py-12 text-center text-muted">No vehicle data</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.plate_number} className="border-b border-border last:border-0 hover:bg-surface">
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
                <td className="py-2.5 px-4 text-muted">{r.owner_name ?? '—'}</td>
                <td className="py-2.5 px-4 text-muted">{r.current_driver ?? '—'}</td>
                <td className="py-2.5 px-4 text-muted">{r.insurance_expiry ?? '—'}</td>
                <td className="py-2.5 px-4 text-right text-primary">{r.service_count}</td>
                <td className="py-2.5 px-4 text-muted">{r.last_service_date ?? '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
