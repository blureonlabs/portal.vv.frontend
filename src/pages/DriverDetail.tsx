import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, User, Car, DollarSign, CreditCard, Calendar, ClipboardList } from 'lucide-react'
import { apiGet } from '../lib/api'
import { Badge } from '../components/ui/Badge'
import { formatDate, formatAed } from '../lib/utils'
import type { Driver, DriverEdit, Vehicle, Trip } from '../types'

const SALARY_LABELS: Record<string, string> = {
  commission: 'Commission (30%)',
  target_high: 'Target High (AED 12,300)',
  target_low: 'Target Low (AED 6,600)',
}

type Tab = 'profile' | 'trips' | 'financials' | 'advances' | 'leave' | 'audit'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  { key: 'trips', label: 'Trips', icon: <Car className="h-4 w-4" /> },
  { key: 'financials', label: 'Financials', icon: <DollarSign className="h-4 w-4" /> },
  { key: 'advances', label: 'Advances', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'leave', label: 'Leave', icon: <Calendar className="h-4 w-4" /> },
  { key: 'audit', label: 'Audit', icon: <ClipboardList className="h-4 w-4" /> },
]

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted">
      <p className="text-sm">{label} will be available in a future sprint.</p>
    </div>
  )
}

function TripsTab({ driverId }: { driverId: string }) {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().setDate(1)).toISOString().slice(0, 10)
  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ['driver-trips', driverId],
    queryFn: () => apiGet(`/trips?driver_id=${driverId}&from=${monthStart}&to=${today}`),
  })

  if (isLoading) return <p className="text-sm text-muted py-8 text-center">Loading…</p>
  if (trips.length === 0) return <p className="text-sm text-muted py-12 text-center">No trips this month.</p>

  const total = trips.reduce((s, t) => s + parseFloat(t.total_aed), 0)

  return (
    <div>
      <p className="text-sm text-muted mb-4">Showing current month · Total: <span className="font-semibold text-primary">{formatAed(total)}</span></p>
      <div className="bg-white rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted font-medium">Date</th>
              <th className="text-right py-3 px-4 text-muted font-medium">Cash</th>
              <th className="text-right py-3 px-4 text-muted font-medium">Card</th>
              <th className="text-right py-3 px-4 text-muted font-medium">Other</th>
              <th className="text-right py-3 px-4 text-muted font-medium">Total</th>
              <th className="text-left py-3 px-4 text-muted font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                <td className="py-3 px-4 text-primary">{formatDate(t.trip_date)}</td>
                <td className="py-3 px-4 text-right">{formatAed(parseFloat(t.cash_aed))}</td>
                <td className="py-3 px-4 text-right text-muted">{formatAed(parseFloat(t.card_aed))}</td>
                <td className="py-3 px-4 text-right text-muted">{formatAed(parseFloat(t.other_aed))}</td>
                <td className="py-3 px-4 text-right font-semibold text-primary">{formatAed(parseFloat(t.total_aed))}</td>
                <td className="py-3 px-4 text-muted">{t.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProfileTab({ driver }: { driver: Driver }) {
  const { data: vehicle } = useQuery<Vehicle | null>({
    queryKey: ['driver-vehicle', driver.id],
    queryFn: async () => {
      const vehicles = await apiGet<Vehicle[]>('/vehicles')
      return vehicles.find((v) => v.assigned_driver_id === driver.id) ?? null
    },
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-primary text-sm">Personal Information</h3>
        <dl className="space-y-2 text-sm">
          <Row label="Full Name" value={driver.full_name} />
          <Row label="Email" value={driver.email} />
          <Row label="Nationality" value={driver.nationality} />
          <Row label="Status">
            <Badge variant={driver.is_active ? 'success' : 'danger'}>
              {driver.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </Row>
          <Row label="Joined" value={formatDate(driver.created_at)} />
        </dl>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-primary text-sm">Employment Details</h3>
        <dl className="space-y-2 text-sm">
          <Row label="Salary Type" value={SALARY_LABELS[driver.salary_type] ?? driver.salary_type} />
          <Row label="Assigned Vehicle">
            {vehicle ? (
              <Link to={`/vehicles/${vehicle.id}`} className="text-accent hover:underline">
                {vehicle.plate_number} — {vehicle.make} {vehicle.model}
              </Link>
            ) : (
              <span className="text-muted">None</span>
            )}
          </Row>
        </dl>
      </div>
    </div>
  )
}

function AuditTab({ driverId }: { driverId: string }) {
  const { data: edits = [], isLoading } = useQuery<DriverEdit[]>({
    queryKey: ['driver-edits', driverId],
    queryFn: () => apiGet(`/drivers/${driverId}/edits`),
  })

  if (isLoading) return <p className="text-sm text-muted py-8 text-center">Loading…</p>

  if (edits.length === 0) {
    return <p className="text-sm text-muted py-12 text-center">No edits recorded yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted font-medium">Field</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Old Value</th>
            <th className="text-left py-3 px-4 text-muted font-medium">New Value</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Changed At</th>
          </tr>
        </thead>
        <tbody>
          {edits.map((e) => (
            <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
              <td className="py-3 px-4 font-medium text-primary capitalize">{e.field.replace(/_/g, ' ')}</td>
              <td className="py-3 px-4 text-muted">{e.old_val ?? '—'}</td>
              <td className="py-3 px-4 text-primary">{e.new_val ?? '—'}</td>
              <td className="py-3 px-4 text-muted">{formatDate(e.changed_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd className="text-primary text-right">{children ?? value}</dd>
    </div>
  )
}

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const { data: driver, isLoading, isError } = useQuery<Driver>({
    queryKey: ['driver', id],
    queryFn: () => apiGet(`/drivers/${id}`),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-muted text-sm">Loading driver…</p>
      </div>
    )
  }

  if (isError || !driver) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-danger text-sm">Driver not found.</p>
        <Link to="/drivers" className="text-accent text-sm hover:underline mt-2 block">← Back to Drivers</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/drivers" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Drivers
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
            <span className="text-accent font-bold text-xl">{driver.full_name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">{driver.full_name}</h1>
            <p className="text-sm text-muted">{driver.email}</p>
          </div>
          <Badge variant={driver.is_active ? 'success' : 'danger'} className="ml-auto">
            {driver.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <ProfileTab driver={driver} />}
      {activeTab === 'trips' && <TripsTab driverId={driver.id} />}
      {activeTab === 'financials' && <PlaceholderTab label="Financials" />}
      {activeTab === 'advances' && <PlaceholderTab label="Advances" />}
      {activeTab === 'leave' && <PlaceholderTab label="Leave" />}
      {activeTab === 'audit' && <AuditTab driverId={driver.id} />}
    </div>
  )
}
