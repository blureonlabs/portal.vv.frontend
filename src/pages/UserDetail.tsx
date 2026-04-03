import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import { Badge } from '../components/ui/Badge'
import { formatDate, formatAed } from '../lib/utils'
import type {
  User,
  Driver,
  Owner,
  Trip,
  Advance,
  LeaveRequest,
  Salary,
  AuditEntry,
} from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  accountant: 'Accountant',
  hr: 'HR',
  driver: 'Driver',
  owner: 'Owner',
}

const SALARY_LABELS: Record<string, string> = {
  commission: 'Commission (30%)',
  target_high: 'Target High (AED 12,300)',
  target_low: 'Target Low (AED 6,600)',
}

// ── Tab definitions ────────────────────────────────────────────────────────────

type BaseTab = 'profile' | 'audit'
type DriverTab = BaseTab | 'trips' | 'advances' | 'leave' | 'salary'
type OwnerTab = BaseTab | 'vehicles'
type Tab = DriverTab | OwnerTab

interface TabDef {
  key: Tab
  label: string
  icon: React.ReactNode
}

const BASE_TABS: TabDef[] = [
  { key: 'profile', label: 'Profile', icon: <span className="material-symbols-rounded text-[16px]">person</span> },
  { key: 'audit', label: 'Audit', icon: <span className="material-symbols-rounded text-[16px]">shield</span> },
]

const DRIVER_TABS: TabDef[] = [
  { key: 'profile', label: 'Profile', icon: <span className="material-symbols-rounded text-[16px]">person</span> },
  { key: 'trips', label: 'Trips', icon: <span className="material-symbols-rounded text-[16px]">directions_car</span> },
  { key: 'advances', label: 'Advances', icon: <span className="material-symbols-rounded text-[16px]">credit_card</span> },
  { key: 'leave', label: 'Leave', icon: <span className="material-symbols-rounded text-[16px]">event_busy</span> },
  { key: 'salary', label: 'Salary', icon: <span className="material-symbols-rounded text-[16px]">payments</span> },
  { key: 'audit', label: 'Audit', icon: <span className="material-symbols-rounded text-[16px]">shield</span> },
]

const OWNER_TABS: TabDef[] = [
  { key: 'profile', label: 'Profile', icon: <span className="material-symbols-rounded text-[16px]">person</span> },
  { key: 'vehicles', label: 'Vehicles', icon: <span className="material-symbols-rounded text-[16px]">directions_car</span> },
  { key: 'audit', label: 'Audit', icon: <span className="material-symbols-rounded text-[16px]">shield</span> },
]

// ── Shared helpers ─────────────────────────────────────────────────────────────

function Row({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted shrink-0 text-sm">{label}</dt>
      <dd className="text-primary text-right text-sm">{children ?? (value || <span className="text-muted">—</span>)}</dd>
    </div>
  )
}

// ── Driver sub-tabs ────────────────────────────────────────────────────────────

function DriverProfileTab({ driver, user }: { driver: Driver; user: User }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-primary text-sm">Personal Information</h3>
        <dl className="space-y-2">
          <Row label="Full Name" value={user.full_name} />
          <Row label="Email" value={user.email} />
          <Row label="Phone" value={user.phone ?? null} />
          <Row label="Nationality" value={driver.nationality} />
          <Row label="Status">
            <Badge variant={user.is_active ? 'success' : 'danger'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </Row>
          <Row label="Joined" value={formatDate(user.created_at)} />
        </dl>
      </div>
      <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-primary text-sm">Employment Details</h3>
        <dl className="space-y-2">
          <Row label="Salary Type" value={SALARY_LABELS[driver.salary_type] ?? driver.salary_type} />
          <Row label="Self Entry">
            <Badge variant={driver.self_entry_enabled ? 'success' : 'muted'}>
              {driver.self_entry_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </Row>
          <Row label="Driver ID" value={driver.id} />
        </dl>
      </div>
    </div>
  )
}

function OwnerProfileTab({ owner, user }: { owner: Owner; user: User }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-primary text-sm">Personal Information</h3>
        <dl className="space-y-2">
          <Row label="Full Name" value={user.full_name} />
          <Row label="Email" value={user.email} />
          <Row label="Phone" value={owner.phone ?? null} />
          <Row label="Status">
            <Badge variant={user.is_active ? 'success' : 'danger'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </Row>
          <Row label="Joined" value={formatDate(user.created_at)} />
        </dl>
      </div>
      <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-primary text-sm">Business Details</h3>
        <dl className="space-y-2">
          <Row label="Company Name" value={owner.company_name ?? null} />
          <Row label="Notes" value={owner.notes ?? null} />
          <Row label="Owner ID" value={owner.id} />
        </dl>
      </div>
    </div>
  )
}

function AdminProfileTab({ user }: { user: User }) {
  return (
    <div className="max-w-md">
      <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-primary text-sm">Profile Information</h3>
        <dl className="space-y-2">
          <Row label="Full Name" value={user.full_name} />
          <Row label="Email" value={user.email} />
          <Row label="Phone" value={user.phone ?? null} />
          <Row label="Role">
            <Badge variant="default">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          </Row>
          <Row label="Status">
            <Badge variant={user.is_active ? 'success' : 'danger'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </Row>
          <Row label="Joined" value={formatDate(user.created_at)} />
        </dl>
      </div>
    </div>
  )
}

function TripsTab({ driverId }: { driverId: string }) {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().setDate(1)).toISOString().slice(0, 10)

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ['user-detail-trips', driverId],
    queryFn: () => apiGet(`/trips?driver_id=${driverId}&from=${monthStart}&to=${today}`),
  })

  if (isLoading) return <p className="text-sm text-muted py-8 text-center">Loading…</p>
  if (trips.length === 0) return <p className="text-sm text-muted py-12 text-center">No trips this month.</p>

  const total = trips.reduce((s, t) => s + parseFloat(t.total_aed), 0)

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Showing current month · Total:{' '}
        <span className="font-semibold text-primary">{formatAed(total)}</span>
      </p>
      <div className="bg-white rounded-2xl border border-border overflow-x-auto">
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

function AdvancesTab({ driverId }: { driverId: string }) {
  const { data: advances = [], isLoading } = useQuery<Advance[]>({
    queryKey: ['user-detail-advances', driverId],
    queryFn: () => apiGet(`/advances?driver_id=${driverId}`),
  })

  if (isLoading) return <p className="text-sm text-muted py-8 text-center">Loading…</p>
  if (advances.length === 0) return <p className="text-sm text-muted py-12 text-center">No advance requests.</p>

  const statusVariant: Record<string, 'warning' | 'success' | 'danger' | 'muted'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    paid: 'muted',
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted font-medium">Date</th>
            <th className="text-right py-3 px-4 text-muted font-medium">Amount</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Reason</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Status</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Period</th>
          </tr>
        </thead>
        <tbody>
          {advances.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
              <td className="py-3 px-4 text-muted">{formatDate(a.created_at)}</td>
              <td className="py-3 px-4 text-right font-semibold text-primary">{formatAed(parseFloat(a.amount_aed))}</td>
              <td className="py-3 px-4 text-muted truncate max-w-xs">{a.reason}</td>
              <td className="py-3 px-4">
                <Badge variant={statusVariant[a.status] ?? 'muted'}>{a.status}</Badge>
              </td>
              <td className="py-3 px-4 text-muted">{a.salary_period ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LeaveTab({ driverId }: { driverId: string }) {
  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['user-detail-leave', driverId],
    queryFn: () => apiGet(`/hr/requests?driver_id=${driverId}`),
  })

  if (isLoading) return <p className="text-sm text-muted py-8 text-center">Loading…</p>
  if (requests.length === 0) return <p className="text-sm text-muted py-12 text-center">No leave requests.</p>

  const statusColor: Record<string, string> = {
    pending: 'text-warning',
    approved: 'text-success',
    rejected: 'text-danger',
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted font-medium">Type</th>
            <th className="text-left py-3 px-4 text-muted font-medium">From</th>
            <th className="text-left py-3 px-4 text-muted font-medium">To</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Reason</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
              <td className="py-3 px-4 capitalize text-primary">{r.type}</td>
              <td className="py-3 px-4 text-muted">{formatDate(r.from_date)}</td>
              <td className="py-3 px-4 text-muted">{formatDate(r.to_date)}</td>
              <td className="py-3 px-4 text-muted truncate max-w-xs">{r.reason}</td>
              <td className={`py-3 px-4 capitalize font-medium ${statusColor[r.status] ?? ''}`}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SalaryTab({ driverId }: { driverId: string }) {
  const { data: salaries = [], isLoading } = useQuery<Salary[]>({
    queryKey: ['user-detail-salaries', driverId],
    queryFn: () => apiGet(`/salaries?driver_id=${driverId}`),
  })

  if (isLoading) return <p className="text-sm text-muted py-8 text-center">Loading…</p>
  if (salaries.length === 0) return <p className="text-sm text-muted py-12 text-center">No salary records found.</p>

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted font-medium">Period</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Type</th>
            <th className="text-right py-3 px-4 text-muted font-medium">Earnings</th>
            <th className="text-right py-3 px-4 text-muted font-medium">Base</th>
            <th className="text-right py-3 px-4 text-muted font-medium">Advance Deduction</th>
            <th className="text-right py-3 px-4 text-muted font-medium">Net Payable</th>
          </tr>
        </thead>
        <tbody>
          {salaries.map((s) => (
            <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
              <td className="py-3 px-4 text-primary font-medium">{s.period_month}</td>
              <td className="py-3 px-4 text-muted capitalize">{s.salary_type_snapshot.replace(/_/g, ' ')}</td>
              <td className="py-3 px-4 text-right text-muted">{formatAed(parseFloat(s.total_earnings_aed))}</td>
              <td className="py-3 px-4 text-right text-muted">{formatAed(parseFloat(s.base_amount_aed))}</td>
              <td className="py-3 px-4 text-right text-danger">{formatAed(parseFloat(s.advance_deduction_aed))}</td>
              <td className="py-3 px-4 text-right font-semibold text-primary">{formatAed(parseFloat(s.net_payable_aed))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OwnerVehiclesTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted gap-2">
      <span className="material-symbols-rounded text-[40px]">directions_car</span>
      <p className="text-sm">Vehicle ownership tracking coming in a future sprint.</p>
    </div>
  )
}

function AuditTab({ actorId }: { actorId: string }) {
  const { data: entries = [], isLoading } = useQuery<AuditEntry[]>({
    queryKey: ['user-detail-audit', actorId],
    queryFn: () => apiGet(`/audit?actor_id=${actorId}&limit=50`),
  })

  if (isLoading) return <p className="text-sm text-muted py-8 text-center">Loading…</p>
  if (entries.length === 0) return <p className="text-sm text-muted py-12 text-center">No audit entries for this user.</p>

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted font-medium">Action</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Entity</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Entity ID</th>
            <th className="text-left py-3 px-4 text-muted font-medium">When</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
              <td className="py-3 px-4 font-medium text-primary">{e.action}</td>
              <td className="py-3 px-4 text-muted capitalize">{e.entity_type}</td>
              <td className="py-3 px-4 text-muted font-mono text-xs">{e.entity_id ?? '—'}</td>
              <td className="py-3 px-4 text-muted">{formatDate(e.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // Fetch all users and find by id (no GET /users/:id endpoint)
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => apiGet('/users'),
  })

  const user = users.find((u) => u.id === id)

  // Fetch drivers list to find if this user is a driver
  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
    enabled: !!user && user.role === 'driver',
  })

  // Fetch owners list to find if this user is an owner
  const { data: owners = [], isLoading: ownersLoading } = useQuery<Owner[]>({
    queryKey: ['owners'],
    queryFn: () => apiGet('/owners'),
    enabled: !!user && user.role === 'owner',
  })

  const driver = user?.role === 'driver'
    ? drivers.find((d) => d.profile_id === user.id) ?? null
    : null

  const owner = user?.role === 'owner'
    ? owners.find((o) => o.profile_id === user.id) ?? null
    : null

  const isLoading =
    usersLoading ||
    (user?.role === 'driver' && driversLoading) ||
    (user?.role === 'owner' && ownersLoading)

  // Determine tabs based on role
  const tabs: TabDef[] =
    user?.role === 'driver'
      ? DRIVER_TABS
      : user?.role === 'owner'
      ? OWNER_TABS
      : BASE_TABS

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-muted text-sm">Loading user…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-danger text-sm">User not found.</p>
        <Link to="/users" className="text-accent text-sm hover:underline mt-2 block">
          ← Back to Users
        </Link>
      </div>
    )
  }

  const roleColor: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'muted'> = {
    super_admin: 'danger',
    accountant: 'default',
    hr: 'warning',
    driver: 'success',
    owner: 'muted',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        to="/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-4"
      >
        <span className="material-symbols-rounded text-[16px]">arrow_back</span>
        Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
          <span className="text-accent font-bold text-xl">
            {user.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-primary">{user.full_name}</h1>
          <p className="text-sm text-muted">{user.email}</p>
          {user.phone && <p className="text-sm text-muted">{user.phone}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={roleColor[user.role] ?? 'default'}>
            {ROLE_LABELS[user.role] ?? user.role}
          </Badge>
          <Badge variant={user.is_active ? 'success' : 'danger'}>
            {user.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {tabs.map((tab) => (
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
      {activeTab === 'profile' && user.role === 'driver' && driver && (
        <DriverProfileTab driver={driver} user={user} />
      )}
      {activeTab === 'profile' && user.role === 'driver' && !driver && (
        <p className="text-sm text-muted">Driver record not found for this user.</p>
      )}
      {activeTab === 'profile' && user.role === 'owner' && owner && (
        <OwnerProfileTab owner={owner} user={user} />
      )}
      {activeTab === 'profile' && user.role === 'owner' && !owner && (
        <p className="text-sm text-muted">Owner record not found for this user.</p>
      )}
      {activeTab === 'profile' && user.role !== 'driver' && user.role !== 'owner' && (
        <AdminProfileTab user={user} />
      )}

      {/* Driver-only tabs */}
      {activeTab === 'trips' && driver && <TripsTab driverId={driver.id} />}
      {activeTab === 'advances' && driver && <AdvancesTab driverId={driver.id} />}
      {activeTab === 'leave' && driver && <LeaveTab driverId={driver.id} />}
      {activeTab === 'salary' && driver && <SalaryTab driverId={driver.id} />}

      {/* Owner-only tabs */}
      {activeTab === 'vehicles' && <OwnerVehiclesTab />}

      {/* Common audit tab */}
      {activeTab === 'audit' && <AuditTab actorId={user.id} />}
    </div>
  )
}
