import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost } from '../lib/api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { formatDate, formatAed } from '../lib/utils'
import type { Driver, DriverEdit, LeaveRequest, Vehicle, Trip, Document, DocumentType } from '../types'

const SALARY_LABELS: Record<string, string> = {
  commission: 'Commission (30%)',
  target_high: 'Target High (AED 12,300)',
  target_low: 'Target Low (AED 6,600)',
}

type Tab = 'profile' | 'trips' | 'financials' | 'advances' | 'leave' | 'documents' | 'audit'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Profile', icon: <span className="material-symbols-rounded text-[16px]">person</span> },
  { key: 'trips', label: 'Trips', icon: <span className="material-symbols-rounded text-[16px]">directions_car</span> },
  { key: 'financials', label: 'Financials', icon: <span className="material-symbols-rounded text-[16px]">payments</span> },
  { key: 'advances', label: 'Advances', icon: <span className="material-symbols-rounded text-[16px]">credit_card</span> },
  { key: 'leave', label: 'Leave', icon: <span className="material-symbols-rounded text-[16px]">event_busy</span> },
  { key: 'documents', label: 'Documents', icon: <span className="material-symbols-rounded text-[16px]">folder_open</span> },
  { key: 'audit', label: 'Audit', icon: <span className="material-symbols-rounded text-[16px]">assignment</span> },
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

function LeaveTab({ driverId }: { driverId: string }) {
  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['driver-leave', driverId],
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
    <div className="bg-white rounded-xl border border-border overflow-x-auto">
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

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  license: 'License',
  visa: 'Visa',
  passport: 'Passport',
  emirates_id: 'Emirates ID',
  medical: 'Medical',
  registration_card: 'Registration Card',
  insurance_certificate: 'Insurance Certificate',
  receipt: 'Receipt',
  other: 'Other',
}

function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return <span className="text-muted text-xs">No expiry</span>
  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86_400_000)
  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-danger bg-red-50 px-2 py-0.5 rounded-full">
        <span className="material-symbols-rounded text-[12px]">error</span>
        Expired
      </span>
    )
  }
  if (daysLeft <= 30) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-amber-50 px-2 py-0.5 rounded-full">
        <span className="material-symbols-rounded text-[12px]">warning</span>
        {daysLeft}d left
      </span>
    )
  }
  return <span className="text-xs text-muted">{formatDate(expiryDate)}</span>
}

async function deleteDocument(id: string): Promise<void> {
  const { supabase } = await import('../lib/supabase')
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok && res.status !== 204) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { error?: string }).error ?? 'Delete failed')
  }
}

function DocumentsTab({ entityType, entityId }: { entityType: 'driver' | 'vehicle'; entityId: string }) {
  const qc = useQueryClient()
  const [showUpload, setShowUpload] = useState(false)
  const [apiError, setApiError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<{
    doc_type: DocumentType
    file_url: string
    file_name: string
    expiry_date: string
    notes: string
  }>({
    doc_type: 'other',
    file_url: '',
    file_name: '',
    expiry_date: '',
    notes: '',
  })

  const queryKey = ['documents', entityType, entityId]

  const { data: docs = [], isLoading } = useQuery<Document[]>({
    queryKey,
    queryFn: () => apiGet(`/documents?entity_type=${entityType}&entity_id=${entityId}`),
  })

  const uploadMutation = useMutation({
    mutationFn: (body: typeof form) =>
      apiPost('/documents', {
        entity_type: entityType,
        entity_id: entityId,
        doc_type: body.doc_type,
        file_url: body.file_url,
        file_name: body.file_name,
        expiry_date: body.expiry_date || null,
        notes: body.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      setShowUpload(false)
      setUploading(false)
      setForm({ doc_type: 'other', file_url: '', file_name: '', expiry_date: '', notes: '' })
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Upload failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e) => alert(e instanceof Error ? e.message : 'Delete failed'),
  })

  if (isLoading) return <p className="text-sm text-muted py-8 text-center">Loading…</p>

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setShowUpload(true); setApiError('') }} size="sm">
          <span className="material-symbols-rounded text-[16px]">upload</span>
          Upload Document
        </Button>
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-muted py-12 text-center">No documents uploaded yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-border p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-rounded text-[20px] text-muted">description</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted mt-0.5">{DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <ExpiryBadge expiryDate={doc.expiry_date} />
                    {doc.notes && (
                      <span className="text-xs text-muted truncate max-w-xs">{doc.notes}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline rounded-full px-3 py-1.5 border border-border hover:bg-surface transition-colors"
                >
                  <span className="material-symbols-rounded text-[14px]">open_in_new</span>
                  View
                </a>
                <button
                  onClick={() => { if (confirm('Delete this document?')) deleteMutation.mutate(doc.id) }}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-1 text-xs text-danger hover:bg-red-50 rounded-full px-3 py-1.5 border border-border transition-colors"
                >
                  <span className="material-symbols-rounded text-[14px]">delete</span>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setShowUpload(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-6">Upload Document</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Document Type</label>
                  <select
                    value={form.doc_type}
                    onChange={(e) => setForm((f) => ({ ...f, doc_type: e.target.value as DocumentType }))}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {(Object.entries(DOC_TYPE_LABELS) as [DocumentType, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">File</label>
                  <input
                    id="doc-file"
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full text-sm text-primary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-xs file:font-medium file:bg-surface file:text-primary hover:file:bg-accent-light cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploading(true)
                      setApiError('')
                      try {
                        const { supabase } = await import('../lib/supabase')
                        const path = `documents/${entityType}/${entityId}/${file.name}`
                        const { error } = await supabase.storage
                          .from('fms-files')
                          .upload(path, file, { upsert: true })
                        if (error) throw new Error(error.message)
                        const { data: urlData } = supabase.storage.from('fms-files').getPublicUrl(path)
                        setForm((f) => ({ ...f, file_url: urlData.publicUrl, file_name: file.name }))
                      } catch (err) {
                        setApiError(err instanceof Error ? err.message : 'Upload failed')
                      } finally {
                        setUploading(false)
                      }
                    }}
                  />
                  {uploading && (
                    <p className="text-xs text-muted mt-1 flex items-center gap-1">
                      <span className="material-symbols-rounded text-[14px] animate-spin">progress_activity</span>
                      Uploading…
                    </p>
                  )}
                  {form.file_url && !uploading && (
                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                      <span className="material-symbols-rounded text-[14px]">check_circle</span>
                      File uploaded
                    </p>
                  )}
                </div>
                <Input
                  id="doc-name"
                  label="File Name"
                  placeholder="passport_john_doe.pdf"
                  value={form.file_name}
                  onChange={(e) => setForm((f) => ({ ...f, file_name: e.target.value }))}
                />
                <Input
                  id="doc-expiry"
                  label="Expiry Date (optional)"
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
                />
                <Input
                  id="doc-notes"
                  label="Notes (optional)"
                  placeholder="Any remarks…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}
                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUpload(false)}>Cancel</Button>
                  <Button
                    type="button"
                    className="flex-1"
                    loading={uploadMutation.isPending || uploading}
                    onClick={() => {
                      if (!form.file_url) { setApiError('Please select a file to upload'); return }
                      setApiError('')
                      uploadMutation.mutate(form)
                    }}
                  >
                    Upload
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
          <span className="material-symbols-rounded text-[16px]">arrow_back</span>
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
      {activeTab === 'leave' && <LeaveTab driverId={driver.id} />}
      {activeTab === 'documents' && <DocumentsTab entityType="driver" entityId={driver.id} />}
      {activeTab === 'audit' && <AuditTab driverId={driver.id} />}
    </div>
  )
}
