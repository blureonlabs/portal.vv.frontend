import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost } from '../lib/api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { formatDate, formatAed } from '../lib/utils'
import type { Vehicle, VehicleAssignment, VehicleServiceRecord, Document, DocumentType } from '../types'

const serviceSchema = z.object({
  service_date: z.string().min(1, 'Required'),
  service_type: z.string().min(1, 'Required'),
  description: z.string().optional(),
  cost: z.coerce.number().min(0, 'Required'),
  next_due: z.string().optional(),
})

type ServiceForm = z.infer<typeof serviceSchema>

type Tab = 'overview' | 'service' | 'assignments' | 'documents'

function statusVariant(status: string) {
  const m = { available: 'success' as const, assigned: 'default' as const, inactive: 'muted' as const }
  return m[status as keyof typeof m] ?? 'muted'
}

function insuranceDaysLeft(expiry: string | null): number | null {
  if (!expiry) return null
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000)
}

function OverviewTab({ vehicle }: { vehicle: Vehicle }) {
  const insLeft = insuranceDaysLeft(vehicle.insurance_expiry)
  const insuranceAlert = insLeft !== null && insLeft <= 30

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-primary text-sm">Vehicle Details</h3>
        <dl className="space-y-2 text-sm">
          <Row label="Plate Number" value={vehicle.plate_number} />
          <Row label="Make / Model" value={`${vehicle.make} ${vehicle.model}`} />
          <Row label="Year" value={String(vehicle.year)} />
          {vehicle.color && <Row label="Color" value={vehicle.color} />}
          <Row label="Status">
            <Badge variant={statusVariant(vehicle.status)}>{vehicle.status}</Badge>
          </Row>
        </dl>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-primary text-sm">Registration & Insurance</h3>
        <dl className="space-y-2 text-sm">
          {vehicle.registration_date && (
            <Row label="Reg. Date" value={formatDate(vehicle.registration_date)} />
          )}
          {vehicle.registration_expiry && (
            <Row label="Reg. Expiry" value={formatDate(vehicle.registration_expiry)} />
          )}
          <Row label="Insurance Expiry">
            {vehicle.insurance_expiry ? (
              insuranceAlert ? (
                <span className="inline-flex items-center gap-1 text-warning font-medium">
                  <span className="material-symbols-rounded text-[14px]">warning</span>
                  {formatDate(vehicle.insurance_expiry)}
                  {insLeft! <= 0 ? ' (EXPIRED)' : ` (${insLeft}d left)`}
                </span>
              ) : (
                <span>{formatDate(vehicle.insurance_expiry)}</span>
              )
            ) : (
              <span className="text-muted">—</span>
            )}
          </Row>
        </dl>
      </div>

      {vehicle.assigned_driver_name && (
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3 md:col-span-2">
          <h3 className="font-semibold text-primary text-sm">Current Assignment</h3>
          <p className="text-sm text-primary">
            Assigned to{' '}
            <Link
              to={`/drivers/${vehicle.assigned_driver_id}`}
              className="text-accent hover:underline"
            >
              {vehicle.assigned_driver_name}
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

function ServiceTab({ vehicleId }: { vehicleId: string }) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [apiError, setApiError] = useState('')
  const isSuperAdmin = user?.role === 'super_admin'

  const { data: records = [], isLoading } = useQuery<VehicleServiceRecord[]>({
    queryKey: ['vehicle-service', vehicleId],
    queryFn: () => apiGet(`/vehicles/${vehicleId}/service`),
  })

  const form = useForm<ServiceForm, any, ServiceForm>({
    resolver: zodResolver(serviceSchema) as never,
    defaultValues: { service_date: new Date().toISOString().slice(0, 10) },
  })

  const addMutation = useMutation({
    mutationFn: (body: ServiceForm) => apiPost(`/vehicles/${vehicleId}/service`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicle-service', vehicleId] })
      setShowAdd(false)
      form.reset({ service_date: new Date().toISOString().slice(0, 10) })
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  if (isLoading) return <p className="text-sm text-muted py-8 text-center">Loading…</p>

  return (
    <div>
      {isSuperAdmin && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => { setShowAdd(true); setApiError('') }} size="sm">
            <span className="material-symbols-rounded text-[16px]">add</span>
            Add Record
          </Button>
        </div>
      )}

      {records.length === 0 ? (
        <p className="text-sm text-muted py-12 text-center">No service records yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted font-medium">Date</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Type</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Description</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Cost</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Next Due</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                  <td className="py-3 px-4 text-primary">{formatDate(r.service_date)}</td>
                  <td className="py-3 px-4 font-medium text-primary">{r.service_type}</td>
                  <td className="py-3 px-4 text-muted">{r.description ?? '—'}</td>
                  <td className="py-3 px-4 text-primary">{formatAed(r.cost)}</td>
                  <td className="py-3 px-4 text-muted">{r.next_due ? formatDate(r.next_due) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-6">Add Service Record</h2>
              <form
                onSubmit={form.handleSubmit((d: ServiceForm) => { setApiError(''); addMutation.mutate(d) })}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Input id="svc-date" label="Service Date" type="date"
                    error={form.formState.errors.service_date?.message}
                    {...form.register('service_date')} />
                  <Input id="svc-cost" label="Cost (AED)" type="number" step="0.01"
                    error={form.formState.errors.cost?.message}
                    {...form.register('cost')} />
                </div>
                <Input id="svc-type" label="Service Type" placeholder="Oil Change, Tyre Rotation…"
                  error={form.formState.errors.service_type?.message}
                  {...form.register('service_type')} />
                <Input id="svc-desc" label="Description (optional)" placeholder="Details…"
                  {...form.register('description')} />
                <Input id="svc-next" label="Next Due Date (optional)" type="date"
                  {...form.register('next_due')} />
                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}
                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button type="submit" loading={addMutation.isPending} className="flex-1">Add Record</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AssignmentsTab({ vehicleId }: { vehicleId: string }) {
  const { data: assignments = [], isLoading } = useQuery<VehicleAssignment[]>({
    queryKey: ['vehicle-assignments', vehicleId],
    queryFn: () => apiGet(`/vehicles/${vehicleId}/assignments`),
  })

  if (isLoading) return <p className="text-sm text-muted py-8 text-center">Loading…</p>

  if (assignments.length === 0) {
    return <p className="text-sm text-muted py-12 text-center">No assignment history yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted font-medium">Driver</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Assigned</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Unassigned</th>
            <th className="text-left py-3 px-4 text-muted font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
              <td className="py-3 px-4 font-medium text-primary">{a.driver_name}</td>
              <td className="py-3 px-4 text-muted">{formatDate(a.assigned_at)}</td>
              <td className="py-3 px-4 text-muted">{a.unassigned_at ? formatDate(a.unassigned_at) : '—'}</td>
              <td className="py-3 px-4">
                <Badge variant={a.unassigned_at ? 'muted' : 'success'}>
                  {a.unassigned_at ? 'Past' : 'Current'}
                </Badge>
              </td>
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
                <Input
                  id="doc-url"
                  label="File URL"
                  placeholder="https://…"
                  value={form.file_url}
                  onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
                />
                <Input
                  id="doc-name"
                  label="File Name"
                  placeholder="registration_card.pdf"
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
                    loading={uploadMutation.isPending}
                    onClick={() => { setApiError(''); uploadMutation.mutate(form) }}
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

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <span className="material-symbols-rounded text-[16px]">directions_car</span> },
  { key: 'service', label: 'Service History', icon: <span className="material-symbols-rounded text-[16px]">build</span> },
  { key: 'assignments', label: 'Assignments', icon: <span className="material-symbols-rounded text-[16px]">history</span> },
  { key: 'documents', label: 'Documents', icon: <span className="material-symbols-rounded text-[16px]">folder_open</span> },
]

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data: vehicle, isLoading, isError } = useQuery<Vehicle>({
    queryKey: ['vehicle', id],
    queryFn: () => apiGet(`/vehicles/${id}`),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-muted text-sm">Loading vehicle…</p>
      </div>
    )
  }

  if (isError || !vehicle) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-danger text-sm">Vehicle not found.</p>
        <Link to="/vehicles" className="text-accent text-sm hover:underline mt-2 block">← Back to Vehicles</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/vehicles" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-4">
          <span className="material-symbols-rounded text-[16px]">arrow_back</span>
          Back to Vehicles
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-rounded text-[28px] text-muted">directions_car</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">{vehicle.plate_number}</h1>
            <p className="text-sm text-muted">{vehicle.make} {vehicle.model} · {vehicle.year}</p>
          </div>
          <Badge variant={statusVariant(vehicle.status)} className="ml-auto">
            {vehicle.status}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
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
      {activeTab === 'overview' && <OverviewTab vehicle={vehicle} />}
      {activeTab === 'service' && <ServiceTab vehicleId={vehicle.id} />}
      {activeTab === 'assignments' && <AssignmentsTab vehicleId={vehicle.id} />}
      {activeTab === 'documents' && <DocumentsTab entityType="vehicle" entityId={vehicle.id} />}
    </div>
  )
}
