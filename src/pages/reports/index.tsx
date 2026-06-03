import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet, apiFetchRaw } from '../../lib/api'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useAuthStore } from '../../store/authStore'
import { formatAed } from '../../lib/utils'
import { BarChart3, Download, FileText } from 'lucide-react'
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
} from '../../types'
import { DriverSummaryTable } from './DriverSummary'
import { TripDetailTable } from './TripDetail'
import { FinanceSummaryView } from './FinanceSummary'
import { AdvanceReportTable } from './AdvanceReport'
import { CashFlowTable } from './CashFlowReport'
import { LeaveReportTable } from './LeaveReport'
import { SalaryReportTable } from './SalaryReport'
import { VehicleReportTable } from './VehicleReport'

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
