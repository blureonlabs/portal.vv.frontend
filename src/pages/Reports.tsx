import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet, apiFetchRaw } from '../lib/api'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuthStore } from '../store/authStore'
import { formatAed } from '../lib/utils'
import { BarChart3, Download, FileText, Inbox } from 'lucide-react'
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
    { id: 'trips', label: 'Trips' },
    { id: 'finance', label: 'Finance' },
    { id: 'advances', label: 'Advances' },
    { id: 'cash-flow', label: 'Cash Flow' },
    { id: 'leave', label: 'Leave' },
    { id: 'salary', label: 'Salary' },
    { id: 'vehicles', label: 'Vehicles' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-primary">Reports</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="p-2.5 rounded-xl border border-border text-muted hover:bg-surface hover:text-primary transition-colors disabled:opacity-50"
            title="Export CSV"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl border border-border text-muted hover:bg-surface hover:text-primary transition-colors"
            title="Print / PDF"
          >
            <FileText size={18} />
          </button>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-1 bg-surface rounded-full p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-muted hover:text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap items-end bg-white rounded-2xl border border-border p-4">
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

      {/* Summary Cards */}
      <SummaryCards tab={tab} driverSummary={driverSummary} finance={finance} advances={advances} cashFlow={cashFlow} leaveData={leaveData} salaryData={salaryData} />

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

// ── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({
  tab,
  driverSummary,
  finance,
  advances,
  cashFlow,
  leaveData,
  salaryData,
}: {
  tab: TabId
  driverSummary: DriverSummaryReport[]
  finance?: FinanceSummaryReport
  advances: AdvanceReport[]
  cashFlow: CashFlowReport[]
  leaveData: LeaveReport[]
  salaryData: SalaryReport[]
}) {
  const cards = useMemo(() => {
    if (tab === 'drivers') {
      const totals = driverSummary.reduce(
        (acc, r) => ({
          trips: acc.trips + r.trips_count,
          revenue: acc.revenue + parseFloat(r.total_revenue_aed),
          expenses: acc.expenses + parseFloat(r.total_expenses_aed),
          net: acc.net + parseFloat(r.net_aed),
        }),
        { trips: 0, revenue: 0, expenses: 0, net: 0 }
      )
      return [
        { label: 'Total Trips', value: String(totals.trips) },
        { label: 'Total Revenue', value: formatAed(totals.revenue), color: 'text-green-700' },
        { label: 'Total Expenses', value: formatAed(totals.expenses), color: 'text-red-600' },
        { label: 'Net Profit', value: formatAed(totals.net), color: totals.net >= 0 ? 'text-green-700' : 'text-red-700' },
      ]
    }
    if (tab === 'finance' && finance) {
      return [
        { label: 'Total Revenue', value: formatAed(finance.trip_revenue_total), color: 'text-green-700' },
        { label: 'Total Expenses', value: formatAed(finance.total_expenses), color: 'text-red-600' },
        { label: 'Cash Handovers', value: formatAed(finance.total_handovers) },
        { label: 'Net', value: formatAed(finance.net_aed), color: parseFloat(String(finance.net_aed)) >= 0 ? 'text-green-700' : 'text-red-700' },
      ]
    }
    if (tab === 'advances') {
      const totalReq = advances.reduce((s, r) => s + parseFloat(r.total_requested), 0)
      const totalPaid = advances.reduce((s, r) => s + parseFloat(r.total_paid), 0)
      const totalOut = advances.reduce((s, r) => s + parseFloat(r.outstanding_balance), 0)
      return [
        { label: 'Drivers', value: String(advances.length) },
        { label: 'Total Requested', value: formatAed(totalReq) },
        { label: 'Total Paid', value: formatAed(totalPaid), color: 'text-green-700' },
        { label: 'Outstanding', value: formatAed(totalOut), color: totalOut > 0 ? 'text-red-600' : undefined },
      ]
    }
    if (tab === 'cash-flow') {
      const totalReceived = cashFlow.reduce((s, r) => s + parseFloat(r.total_cash_received), 0)
      const totalSubmitted = cashFlow.reduce((s, r) => s + parseFloat(r.total_cash_submitted), 0)
      const totalShortfall = cashFlow.reduce((s, r) => s + parseFloat(r.shortfall), 0)
      return [
        { label: 'Cash Received', value: formatAed(totalReceived) },
        { label: 'Cash Submitted', value: formatAed(totalSubmitted), color: 'text-green-700' },
        { label: 'Shortfall', value: formatAed(totalShortfall), color: totalShortfall > 0 ? 'text-red-600' : undefined },
      ]
    }
    if (tab === 'leave') {
      const totalDays = leaveData.reduce((s, r) => s + r.total_leave_days, 0)
      const totalPending = leaveData.reduce((s, r) => s + r.pending_count, 0)
      const totalApproved = leaveData.reduce((s, r) => s + r.approved_count, 0)
      return [
        { label: 'Total Leave Days', value: String(totalDays) },
        { label: 'Pending', value: String(totalPending), color: 'text-yellow-600' },
        { label: 'Approved', value: String(totalApproved), color: 'text-green-700' },
      ]
    }
    if (tab === 'salary') {
      const totalGross = salaryData.reduce((s, r) => s + parseFloat(r.gross), 0)
      const totalDed = salaryData.reduce((s, r) => s + parseFloat(r.deductions), 0)
      const totalNet = salaryData.reduce((s, r) => s + parseFloat(r.net_payable), 0)
      return [
        { label: 'Gross Total', value: formatAed(totalGross) },
        { label: 'Deductions', value: formatAed(totalDed), color: 'text-red-600' },
        { label: 'Net Payable', value: formatAed(totalNet), color: 'text-green-700' },
      ]
    }
    return []
  }, [tab, driverSummary, finance, advances, cashFlow, leaveData, salaryData])

  if (cards.length === 0) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border border-border p-4">
          <p className="text-xs text-muted mb-1">{c.label}</p>
          <p className={`text-xl font-bold tabular-nums ${c.color ?? 'text-primary'}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Table Components ─────────────────────────────────────────────────────────

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

function TripDetailTable({ rows, loading }: { rows: TripDetailReport[]; loading: boolean }) {
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

function FinanceSummaryView({ data, loading }: { data?: FinanceSummaryReport; loading: boolean }) {
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

function AdvanceReportTable({ rows, loading }: { rows: AdvanceReport[]; loading: boolean }) {
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

function CashFlowTable({ rows, loading }: { rows: CashFlowReport[]; loading: boolean }) {
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

function LeaveReportTable({ rows, loading }: { rows: LeaveReport[]; loading: boolean }) {
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

function SalaryReportTable({ rows, loading }: { rows: SalaryReport[]; loading: boolean }) {
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

function VehicleReportTable({ rows, loading }: { rows: VehicleReport[]; loading: boolean }) {
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
