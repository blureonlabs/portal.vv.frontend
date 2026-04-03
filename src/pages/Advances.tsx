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
import { formatDate, formatAed } from '../lib/utils'
import type { Advance, AdvanceStatus, Driver } from '../types'

const COLUMNS: { status: AdvanceStatus; label: string; color: string }[] = [
  { status: 'pending',  label: 'Pending',  color: 'border-t-warning' },
  { status: 'approved', label: 'Approved', color: 'border-t-accent' },
  { status: 'rejected', label: 'Rejected', color: 'border-t-danger' },
  { status: 'paid',     label: 'Paid',     color: 'border-t-success' },
]

const statusBadge: Record<AdvanceStatus, 'warning' | 'default' | 'danger' | 'success'> = {
  pending:  'warning',
  approved: 'default',
  rejected: 'danger',
  paid:     'success',
}

const requestSchema = z.object({
  driver_id: z.string().optional(),
  amount_aed: z.coerce.number().positive('Required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
})
type RequestForm = z.infer<typeof requestSchema>

const rejectSchema = z.object({
  rejection_reason: z.string().min(3, 'Required'),
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
  const [showRequest, setShowRequest] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<Advance | null>(null)
  const [payTarget, setPayTarget] = useState<Advance | null>(null)
  const [apiError, setApiError] = useState('')

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
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiPut(`/advances/${id}/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['advances'] }),
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: RejectForm }) =>
      apiPut(`/advances/${id}/reject`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['advances'] })
      setRejectTarget(null)
      rejectForm.reset()
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const payMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: PayForm }) =>
      apiPut(`/advances/${id}/pay`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['advances'] })
      setPayTarget(null)
      payForm.reset()
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const grouped = (status: AdvanceStatus) => advances.filter((a) => a.status === status)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Advances</h1>
          <p className="text-sm text-muted mt-1">Driver salary advance requests</p>
        </div>
        <Button onClick={() => { setShowRequest(true); setApiError('') }}>
          <span className="material-symbols-rounded text-[16px]">add</span>
          Request Advance
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted text-center py-12">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(({ status, label, color }) => {
            const cards = grouped(status)
            return (
              <div key={status} className={`bg-white rounded-xl border border-border border-t-4 ${color} flex flex-col`}>
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">{label}</span>
                  <span className="text-xs text-muted bg-surface rounded-full px-2 py-0.5">{cards.length}</span>
                </div>
                <div className="flex flex-col gap-3 p-3 min-h-[200px]">
                  {cards.length === 0 && (
                    <p className="text-xs text-muted text-center py-8">No {label.toLowerCase()} advances</p>
                  )}
                  {cards.map((adv) => (
                    <div key={adv.id} className="bg-surface rounded-2xl border border-border p-3 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-primary">{adv.driver_name}</p>
                        <Badge variant={statusBadge[adv.status]} className="text-xs shrink-0">
                          {adv.status}
                        </Badge>
                      </div>
                      <p className="text-base font-bold text-primary">{formatAed(parseFloat(adv.amount_aed))}</p>
                      <p className="text-xs text-muted line-clamp-2">{adv.reason}</p>
                      <p className="text-xs text-muted">{formatDate(adv.created_at)}</p>

                      {adv.rejection_reason && (
                        <p className="text-xs text-danger bg-red-50 rounded px-2 py-1">
                          {adv.rejection_reason}
                        </p>
                      )}

                      {adv.payment_date && (
                        <p className="text-xs text-success">
                          Paid {formatDate(adv.payment_date)} · {adv.method?.replace('_', ' ')}
                        </p>
                      )}

                      {canManage && adv.status === 'pending' && (
                        <div className="flex gap-2 pt-1 border-t border-border">
                          <button
                            onClick={() => { setApiError(''); approveMutation.mutate(adv.id) }}
                            className="flex-1 flex items-center justify-center gap-1 text-xs text-success hover:text-green-700 transition-colors py-1"
                          >
                            <span className="material-symbols-rounded text-[12px]">check</span> Approve
                          </button>
                          <button
                            onClick={() => { setApiError(''); setRejectTarget(adv); rejectForm.reset() }}
                            className="flex-1 flex items-center justify-center gap-1 text-xs text-danger hover:text-red-700 transition-colors py-1"
                          >
                            <span className="material-symbols-rounded text-[12px]">close</span> Reject
                          </button>
                        </div>
                      )}

                      {canManage && adv.status === 'approved' && (
                        <div className="pt-1 border-t border-border">
                          <button
                            onClick={() => {
                              setApiError('')
                              setPayTarget(adv)
                              payForm.reset({ payment_date: today, method: 'cash' })
                            }}
                            className="w-full flex items-center justify-center gap-1 text-xs text-accent hover:text-blue-700 transition-colors py-1"
                          >
                            <span className="material-symbols-rounded text-[12px]">payments</span> Mark Paid
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
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
                      { value: '', label: 'Select driver…' },
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
                    placeholder="Briefly explain the reason for this advance…"
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
    </div>
  )
}
