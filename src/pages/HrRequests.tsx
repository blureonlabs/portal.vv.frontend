import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost, apiPut } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { useAuthStore } from '../store/authStore'
import { formatDate } from '../lib/utils'
import type { Driver, LeaveRequest, LeaveStatus, LeaveType } from '../types'

const statusBadge: Record<LeaveStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

const submitSchema = z.object({
  driver_id: z.string().optional(),
  type: z.enum(['leave', 'permission']),
  from_date: z.string().min(1, 'Required'),
  to_date: z.string().min(1, 'Required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
})
type SubmitForm = z.infer<typeof submitSchema>

const rejectSchema = z.object({
  rejection_reason: z.string().min(3, 'Required'),
})
type RejectForm = z.infer<typeof rejectSchema>

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'leave', label: 'Leave' },
  { value: 'permission', label: 'Permission' },
]

function dayCount(from: string, to: string) {
  const diff = new Date(to).getTime() - new Date(from).getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1
}

export default function HrRequests() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const canAction = user?.role === 'super_admin' || user?.role === 'hr'
  const canManage = canAction || user?.role === 'accountant'
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<LeaveType | ''>('')
  const [driverFilter, setDriverFilter] = useState('')
  const [showSubmit, setShowSubmit] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null)
  const [apiError, setApiError] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const buildParams = () => {
    const p = new URLSearchParams()
    if (statusFilter) p.set('status', statusFilter)
    if (typeFilter) p.set('type', typeFilter)
    if (driverFilter) p.set('driver_id', driverFilter)
    return p.toString()
  }

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['leave', statusFilter, typeFilter, driverFilter],
    queryFn: () => apiGet(`/hr/requests?${buildParams()}`),
  })

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
    enabled: canManage,
  })

  const submitForm = useForm<SubmitForm, any, SubmitForm>({
    resolver: zodResolver(submitSchema),
    defaultValues: { type: 'leave' },
  })

  const rejectForm = useForm<RejectForm, any, RejectForm>({
    resolver: zodResolver(rejectSchema),
  })

  const submitMutation = useMutation({
    mutationFn: (body: SubmitForm) => apiPost('/hr/requests', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave'] })
      setShowSubmit(false)
      submitForm.reset()
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiPut(`/hr/requests/${id}/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: RejectForm }) =>
      apiPut(`/hr/requests/${id}/reject`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave'] })
      setRejectTarget(null)
      rejectForm.reset()
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const bulkApproveMutation = useMutation({
    mutationFn: (request_ids: string[]) => apiPost('/hr/requests/bulk-approve', { request_ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave'] })
      setSelectedIds(new Set())
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const driverOptions = [
    { value: '', label: 'All drivers' },
    ...drivers.map((d) => ({ value: d.id, label: d.full_name })),
  ]

  const pending = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Leave & Permissions</h1>
          <p className="text-sm text-muted mt-1">
            {pending > 0 ? `${pending} pending request${pending !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canAction && selectedIds.size > 0 && (
            <Button
              variant="outline"
              loading={bulkApproveMutation.isPending}
              onClick={() => { setApiError(''); bulkApproveMutation.mutate(Array.from(selectedIds)) }}
            >
              <span className="material-symbols-rounded text-[16px]">done_all</span>
              Approve Selected ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => { setShowSubmit(true); setApiError('') }}>
            <span className="material-symbols-rounded text-[16px]">add</span>
            New Request
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | '')}
          className="h-9 px-3 rounded-lg border border-border bg-white text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as LeaveType | '')}
          className="h-9 px-3 rounded-lg border border-border bg-white text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {canManage && (
          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-white text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {driverOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted text-center py-12">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">No requests found.</p>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {canAction && <th className="py-3 px-4 w-10" />}
                <th className="text-left py-3 px-4 text-muted font-medium">Driver</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Type</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Dates</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Days</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Reason</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Status</th>
                {canAction && <th className="text-left py-3 px-4 text-muted font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                  {canAction && (
                    <td className="py-3 px-4">
                      {r.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded border-border text-accent focus:ring-accent"
                        />
                      )}
                    </td>
                  )}
                  <td className="py-3 px-4 font-medium text-primary">{r.driver_name}</td>
                  <td className="py-3 px-4">
                    <Badge variant={r.type === 'leave' ? 'default' : 'warning'}>
                      {r.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted">
                    {formatDate(r.from_date)}
                    {r.from_date !== r.to_date && ` – ${formatDate(r.to_date)}`}
                  </td>
                  <td className="py-3 px-4 text-muted">{dayCount(r.from_date, r.to_date)}</td>
                  <td className="py-3 px-4 text-muted truncate max-w-xs">
                    {r.reason}
                    {r.rejection_reason && (
                      <span className="block text-xs text-danger mt-0.5">{r.rejection_reason}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={statusBadge[r.status]}>{r.status}</Badge>
                  </td>
                  {canAction && (
                    <td className="py-3 px-4">
                      {r.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setApiError(''); approveMutation.mutate(r.id) }}
                            className="flex items-center gap-1 text-xs text-success hover:text-green-700 transition-colors"
                          >
                            <span className="material-symbols-rounded text-[12px]">check</span> Approve
                          </button>
                          <button
                            onClick={() => { setApiError(''); setRejectTarget(r); rejectForm.reset() }}
                            className="flex items-center gap-1 text-xs text-danger hover:text-red-700 transition-colors"
                          >
                            <span className="material-symbols-rounded text-[12px]">close</span> Reject
                          </button>
                        </div>
                      )}
                      {r.status !== 'pending' && r.actioned_by_name && (
                        <span className="text-xs text-muted">{r.actioned_by_name}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setShowSubmit(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-1">New Request</h2>
              <p className="text-sm text-muted mb-6">Submit a leave or permission request.</p>

              <form
                onSubmit={submitForm.handleSubmit((d: SubmitForm) => { setApiError(''); submitMutation.mutate(d) })}
                className="flex flex-col gap-4"
              >
                {canManage && (
                  <Select
                    id="lr-driver"
                    label="Driver"
                    options={[
                      { value: '', label: 'Select driver…' },
                      ...drivers.map((d) => ({ value: d.id, label: d.full_name })),
                    ]}
                    error={submitForm.formState.errors.driver_id?.message}
                    {...submitForm.register('driver_id')}
                  />
                )}
                <Select
                  id="lr-type"
                  label="Type"
                  options={[
                    { value: 'leave', label: 'Leave' },
                    { value: 'permission', label: 'Permission' },
                  ]}
                  error={submitForm.formState.errors.type?.message}
                  {...submitForm.register('type')}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="lr-from"
                    label="From"
                    type="date"
                    error={submitForm.formState.errors.from_date?.message}
                    {...submitForm.register('from_date')}
                  />
                  <Input
                    id="lr-to"
                    label="To"
                    type="date"
                    error={submitForm.formState.errors.to_date?.message}
                    {...submitForm.register('to_date')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-primary" htmlFor="lr-reason">Reason</label>
                  <textarea
                    id="lr-reason"
                    rows={3}
                    placeholder="Briefly explain the reason…"
                    className="rounded-lg border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    {...submitForm.register('reason')}
                  />
                  {submitForm.formState.errors.reason && (
                    <p className="text-xs text-danger">{submitForm.formState.errors.reason.message}</p>
                  )}
                </div>

                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}

                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowSubmit(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitMutation.isPending} className="flex-1">
                    Submit
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setRejectTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-1">Reject Request</h2>
              <p className="text-sm text-muted mb-6">
                {rejectTarget.driver_name} · {formatDate(rejectTarget.from_date)}
                {rejectTarget.from_date !== rejectTarget.to_date && ` – ${formatDate(rejectTarget.to_date)}`}
              </p>

              <form
                onSubmit={rejectForm.handleSubmit((d: RejectForm) => {
                  setApiError('')
                  rejectMutation.mutate({ id: rejectTarget.id, body: d })
                })}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-primary" htmlFor="rej-reason">Rejection Reason</label>
                  <textarea
                    id="rej-reason"
                    rows={3}
                    placeholder="Explain why this request is rejected…"
                    className="rounded-lg border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    {...rejectForm.register('rejection_reason')}
                  />
                  {rejectForm.formState.errors.rejection_reason && (
                    <p className="text-xs text-danger">{rejectForm.formState.errors.rejection_reason.message}</p>
                  )}
                </div>

                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setRejectTarget(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={rejectMutation.isPending} className="flex-1">
                    Reject
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
