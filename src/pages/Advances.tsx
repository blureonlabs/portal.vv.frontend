import { useState, useMemo } from 'react'
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
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuthStore } from '../store/authStore'
import { formatDate, formatAed } from '../lib/utils'
import type { Advance, AdvanceStatus, Driver } from '../types'
import { Check, CreditCard, Inbox, Plus, X } from 'lucide-react'
import { useToast } from '../components/ui/Toast'

const STATUS_TABS: { key: AdvanceStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'paid', label: 'Paid' },
]

const statusBadge: Record<AdvanceStatus, 'warning' | 'default' | 'danger' | 'success'> = {
  pending:  'warning',
  approved: 'default',
  rejected: 'danger',
  paid:     'success',
}

const requestSchema = z.object({
  driver_id: z.string().optional(),
  amount_aed: z.coerce.number().positive('Required').max(1000000, 'Amount cannot exceed AED 1,000,000'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(2000, 'Maximum 2000 characters'),
})
type RequestForm = z.infer<typeof requestSchema>

const rejectSchema = z.object({
  rejection_reason: z.string().min(3, 'Required').max(500, 'Maximum 500 characters'),
})
type RejectForm = z.infer<typeof rejectSchema>

const paySchema = z.object({
  payment_date: z.string().min(1, 'Required'),
  method: z.enum(['cash', 'bank_transfer']),
  salary_period: z.string().optional(),
})
type PayForm = z.infer<typeof paySchema>

export default function Advances() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const canManage = user?.role === 'super_admin' || user?.role === 'accountant'
  const toast = useToast()
  const [showRequest, setShowRequest] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<Advance | null>(null)
  const [payTarget, setPayTarget] = useState<Advance | null>(null)
  const [confirmApprove, setConfirmApprove] = useState<string | null>(null)
  const [apiError, setApiError] = useState('')
  const [activeTab, setActiveTab] = useState<AdvanceStatus | 'all'>('all')

  const today = new Date().toISOString().slice(0, 10)

  const { data: advances = [], isLoading } = useQuery<Advance[]>({
    queryKey: ['advances'],
    queryFn: () => apiGet('/advances'),
  })

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
    enabled: canManage && showRequest,
  })

  const requestForm = useForm<RequestForm, any, RequestForm>({
    resolver: zodResolver(requestSchema) as never,
  })

  const rejectForm = useForm<RejectForm, any, RejectForm>({
    resolver: zodResolver(rejectSchema) as never,
  })

  const payForm = useForm<PayForm, any, PayForm>({
    resolver: zodResolver(paySchema) as never,
    defaultValues: { payment_date: today, method: 'cash' },
  })

  const requestMutation = useMutation({
    mutationFn: (body: RequestForm) => apiPost('/advances', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['advances'] })
      setShowRequest(false)
      requestForm.reset()
      toast.add('Advance requested', 'success')
    },
    onError: (e) => { const msg = e instanceof Error ? e.message : 'Failed'; setApiError(msg); toast.add(msg, 'error') },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiPut(`/advances/${id}/approve`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advances'] }); toast.add('Advance approved', 'success') },
    onError: (e) => { const msg = e instanceof Error ? e.message : 'Failed'; setApiError(msg); toast.add(msg, 'error') },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: RejectForm }) =>
      apiPut(`/advances/${id}/reject`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['advances'] })
      setRejectTarget(null)
      rejectForm.reset()
      toast.add('Advance rejected', 'success')
    },
    onError: (e) => { const msg = e instanceof Error ? e.message : 'Failed'; setApiError(msg); toast.add(msg, 'error') },
  })

  const payMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: PayForm }) =>
      apiPut(`/advances/${id}/pay`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['advances'] })
      setPayTarget(null)
      payForm.reset()
      toast.add('Advance marked as paid', 'success')
    },
    onError: (e) => { const msg = e instanceof Error ? e.message : 'Failed'; setApiError(msg); toast.add(msg, 'error') },
  })

  const filtered = useMemo(
    () => activeTab === 'all' ? advances : advances.filter((a) => a.status === activeTab),
    [advances, activeTab]
  )

  const stats = useMemo(() => {
    const totalRequested = advances.reduce((sum, a) => sum + parseFloat(a.amount_aed), 0)
    const pendingCount = advances.filter((a) => a.status === 'pending').length
    const approvedAmount = advances
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + parseFloat(a.amount_aed), 0)
    const outstandingAmount = advances
      .filter((a) => a.status === 'approved' || a.status === 'pending')
      .reduce((sum, a) => sum + parseFloat(a.amount_aed), 0)
    return { totalRequested, pendingCount, approvedAmount, outstandingAmount }
  }, [advances])

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Advances</h1>
          <p className="text-sm text-muted mt-1">Driver salary advance requests</p>
        </div>
        <Button onClick={() => { setShowRequest(true); setApiError('') }}>
          <Plus size={16} />
          Request Advance
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-xs text-muted mb-1">Total Requested</p>
          <p className="text-xl font-bold text-primary tabular-nums">{formatAed(stats.totalRequested)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-xs text-muted mb-1">Pending Count</p>
          <p className="text-xl font-bold text-yellow-600 tabular-nums">{stats.pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-xs text-muted mb-1">Approved Amount</p>
          <p className="text-xl font-bold text-primary tabular-nums">{formatAed(stats.approvedAmount)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-xs text-muted mb-1">Outstanding</p>
          <p className="text-xl font-bold text-red-600 tabular-nums">{formatAed(stats.outstandingAmount)}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 bg-surface rounded-full p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-white text-primary shadow-sm'
                : 'text-muted hover:text-primary'
            }`}
          >
            {t.label}
            {t.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-60">
                {advances.filter((a) => a.status === t.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-muted text-center py-12">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border">
          <EmptyState
            icon={Inbox}
            title="No advances found"
            description={activeTab === 'all' ? 'No advance requests yet.' : `No ${activeTab} advances.`}
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="py-3 px-4 text-left font-medium text-muted">Driver</th>
                  <th className="py-3 px-4 text-right font-medium text-muted">Amount (AED)</th>
                  <th className="py-3 px-4 text-left font-medium text-muted">Reason</th>
                  <th className="py-3 px-4 text-left font-medium text-muted">Date</th>
                  <th className="py-3 px-4 text-left font-medium text-muted">Status</th>
                  {canManage && <th className="py-3 px-4 text-right font-medium text-muted">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((adv) => (
                  <tr key={adv.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-primary">{adv.driver_name}</td>
                    <td className="py-3 px-4 text-right font-semibold text-primary tabular-nums">
                      {formatAed(parseFloat(adv.amount_aed))}
                    </td>
                    <td className="py-3 px-4 text-muted max-w-[200px] truncate" title={adv.reason}>
                      {adv.reason}
                    </td>
                    <td className="py-3 px-4 text-muted">{formatDate(adv.created_at)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={statusBadge[adv.status]}>{adv.status}</Badge>
                    </td>
                    {canManage && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 justify-end">
                          {adv.status === 'pending' && (
                            <>
                              <button
                                onClick={() => { setApiError(''); setConfirmApprove(adv.id) }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-success bg-emerald-50 hover:bg-emerald-100 transition-colors"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                onClick={() => { setApiError(''); setRejectTarget(adv); rejectForm.reset() }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-danger bg-red-50 hover:bg-red-100 transition-colors"
                              >
                                <X size={14} /> Reject
                              </button>
                            </>
                          )}
                          {adv.status === 'approved' && (
                            <button
                              onClick={() => {
                                setApiError('')
                                setPayTarget(adv)
                                payForm.reset({ payment_date: today, method: 'cash' })
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-accent bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                              <CreditCard size={14} /> Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden space-y-3">
            {filtered.map((adv) => (
              <div key={adv.id} className="bg-white rounded-2xl border border-border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">{adv.driver_name}</p>
                    <p className="text-xs text-muted mt-0.5">{formatDate(adv.created_at)}</p>
                  </div>
                  <Badge variant={statusBadge[adv.status]}>{adv.status}</Badge>
                </div>
                <p className="text-lg font-bold text-primary tabular-nums">{formatAed(parseFloat(adv.amount_aed))}</p>
                <p className="text-xs text-muted line-clamp-2">{adv.reason}</p>

                {adv.rejection_reason && (
                  <p className="text-xs text-danger bg-red-50 rounded px-2 py-1">{adv.rejection_reason}</p>
                )}
                {adv.payment_date && (
                  <p className="text-xs text-success">
                    Paid {formatDate(adv.payment_date)} · {adv.method?.replace('_', ' ')}
                  </p>
                )}

                {canManage && adv.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => { setApiError(''); setConfirmApprove(adv.id) }}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-success bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => { setApiError(''); setRejectTarget(adv); rejectForm.reset() }}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-danger bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}

                {canManage && adv.status === 'approved' && (
                  <div className="pt-2 border-t border-border">
                    <button
                      onClick={() => {
                        setApiError('')
                        setPayTarget(adv)
                        payForm.reset({ payment_date: today, method: 'cash' })
                      }}
                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-accent bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <CreditCard size={14} /> Mark Paid
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Request Advance Modal */}
      <AnimatePresence>
        {showRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setShowRequest(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-1">Request Advance</h2>
              <p className="text-sm text-muted mb-6">Submit a salary advance request.</p>

              <form
                onSubmit={requestForm.handleSubmit((d: RequestForm) => { setApiError(''); requestMutation.mutate(d) })}
                className="flex flex-col gap-4"
              >
                {canManage && (
                  <Select
                    id="adv-driver"
                    label="Driver"
                    options={[
                      { value: '', label: 'Select driver...' },
                      ...drivers.map((d) => ({ value: d.id, label: d.full_name })),
                    ]}
                    error={requestForm.formState.errors.driver_id?.message}
                    {...requestForm.register('driver_id')}
                  />
                )}
                <Input
                  id="adv-amount"
                  label="Amount (AED)"
                  type="number"
                  step="0.01"
                  error={requestForm.formState.errors.amount_aed?.message}
                  {...requestForm.register('amount_aed')}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-primary" htmlFor="adv-reason">Reason</label>
                  <textarea
                    id="adv-reason"
                    rows={3}
                    placeholder="Briefly explain the reason for this advance..."
                    className="rounded-lg border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    {...requestForm.register('reason')}
                  />
                  {requestForm.formState.errors.reason && (
                    <p className="text-xs text-danger">{requestForm.formState.errors.reason.message}</p>
                  )}
                </div>

                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}

                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowRequest(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={requestMutation.isPending} className="flex-1">
                    Submit Request
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
              <h2 className="text-lg font-bold text-primary mb-1">Reject Advance</h2>
              <p className="text-sm text-muted mb-6">{rejectTarget.driver_name} · {formatAed(parseFloat(rejectTarget.amount_aed))}</p>

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
                    placeholder="Explain why this request is rejected..."
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

      {/* Pay Modal */}
      <AnimatePresence>
        {payTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setPayTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-1">Mark as Paid</h2>
              <p className="text-sm text-muted mb-6">{payTarget.driver_name} · {formatAed(parseFloat(payTarget.amount_aed))}</p>

              <form
                onSubmit={payForm.handleSubmit((d: PayForm) => {
                  setApiError('')
                  payMutation.mutate({ id: payTarget.id, body: d })
                })}
                className="flex flex-col gap-4"
              >
                <Input
                  id="pay-date"
                  label="Payment Date"
                  type="date"
                  error={payForm.formState.errors.payment_date?.message}
                  {...payForm.register('payment_date')}
                />
                <Select
                  id="pay-method"
                  label="Payment Method"
                  options={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'bank_transfer', label: 'Bank Transfer' },
                  ]}
                  error={payForm.formState.errors.method?.message}
                  {...payForm.register('method')}
                />
                <Input
                  id="pay-period"
                  label="Salary Period (optional)"
                  type="date"
                  {...payForm.register('salary_period')}
                />

                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setPayTarget(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={payMutation.isPending} className="flex-1">
                    Confirm Payment
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Approve Dialog */}
      <ConfirmDialog
        open={confirmApprove !== null}
        title="Approve Advance"
        message="Are you sure you want to approve this advance request?"
        confirmLabel="Approve"
        variant="primary"
        onConfirm={() => { if (confirmApprove) approveMutation.mutate(confirmApprove); setConfirmApprove(null) }}
        onCancel={() => setConfirmApprove(null)}
      />
    </div>
  )
}
