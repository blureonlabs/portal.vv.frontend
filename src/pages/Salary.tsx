import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { formatAed } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import type { Driver, MonthlyEarnings, Salary, SalaryStatusType, SalaryType } from '../types'

const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  commission: 'Commission',
  target_high: 'Target High',
  target_low: 'Target Low',
}

const STATUS_LABELS: Record<SalaryStatusType, string> = {
  draft: 'Draft',
  approved: 'Approved',
  paid: 'Paid',
}

type StatusVariant = 'muted' | 'warning' | 'success'
const STATUS_VARIANTS: Record<SalaryStatusType, StatusVariant> = {
  draft: 'muted',
  approved: 'warning',
  paid: 'success',
}

function currentMonth() { return new Date().toISOString().slice(0, 7) }

const schema = z.object({
  driver_id: z.string().uuid('Select a driver'),
  period_month: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM'),
  salary_type: z.enum(['commission', 'target_high', 'target_low']),
  total_earnings_aed: z.coerce.number().min(0),
  total_cash_received_aed: z.coerce.number().min(0),
  total_cash_submit_aed: z.coerce.number().optional(),
  cash_not_handover_aed: z.coerce.number().min(0).default(0),
  car_charging_aed: z.coerce.number().min(0).default(0),
  car_charging_used_aed: z.coerce.number().optional(),
  salik_used_aed: z.coerce.number().min(0).default(0),
  salik_refund_aed: z.coerce.number().min(0).default(0),
  rta_fine_aed: z.coerce.number().min(0).default(0),
  card_service_charges_aed: z.coerce.number().min(0).default(0),
  room_rent_aed: z.coerce.number().optional(),
})
type Form = z.infer<typeof schema>

// ── Mark Paid dialog ────────────────────────────────────────────────────────

const markPaidSchema = z.object({
  payment_date: z.string().min(1, 'Required'),
  payment_mode: z.enum(['bank_transfer', 'cash', 'cheque']),
  payment_reference: z.string().optional(),
})
type MarkPaidForm = z.infer<typeof markPaidSchema>

function MarkPaidDialog({
  salaryId,
  open,
  onClose,
}: {
  salaryId: string
  open: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MarkPaidForm>({
    resolver: zodResolver(markPaidSchema),
    defaultValues: { payment_mode: 'bank_transfer' },
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: MarkPaidForm) =>
      apiPost(`/salaries/${salaryId}/pay`, {
        payment_date: data.payment_date,
        payment_mode: data.payment_mode,
        payment_reference: data.payment_reference || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salaries'] })
      reset()
      onClose()
    },
  })

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-primary">Mark as Paid</h3>
            {error && (
              <p className="text-xs text-danger bg-red-50 rounded p-2">{(error as Error).message}</p>
            )}
            <div>
              <label className="block text-xs text-muted mb-1">Payment Date</label>
              <Input type="date" {...register('payment_date')} />
              {errors.payment_date && <p className="text-xs text-danger mt-1">{errors.payment_date.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Payment Mode</label>
              <Select {...register('payment_mode')}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Reference Number (optional)</label>
              <Input type="text" placeholder="TXN123 / Cheque no." {...register('payment_reference')} />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" type="button" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                type="button"
                className="flex-1"
                disabled={isPending}
                onClick={handleSubmit((d) => mutate(d))}
              >
                {isPending ? 'Saving…' : 'Confirm Payment'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── SalaryRow ───────────────────────────────────────────────────────────────

function SalaryRow({ s, canAdmin }: { s: Salary; canAdmin: boolean }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [payDialog, setPayDialog] = useState(false)

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: () => apiPost(`/salaries/${s.id}/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salaries'] }),
  })

  return (
    <>
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <button
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-primary">{s.driver_name}</p>
              <p className="text-xs text-muted">{s.period_month}</p>
            </div>
            <Badge variant="default">{SALARY_TYPE_LABELS[s.salary_type_snapshot]}</Badge>
            <Badge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</Badge>
          </div>
          <div className="flex items-center gap-3">
            {canAdmin && s.status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                disabled={approving}
                onClick={(e) => { e.stopPropagation(); approve() }}
              >
                {approving ? '…' : 'Approve'}
              </Button>
            )}
            {canAdmin && s.status === 'approved' && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); setPayDialog(true) }}
              >
                Mark Paid
              </Button>
            )}
            <div className="text-right">
              <p className="text-xs text-muted">Net Payable</p>
              <p className="text-base font-bold text-primary">{formatAed(parseFloat(s.net_payable_aed))}</p>
            </div>
            {open
              ? <span className="material-symbols-rounded text-[16px] text-muted">expand_less</span>
              : <span className="material-symbols-rounded text-[16px] text-muted">expand_more</span>}
          </div>
        </button>

        {open && (
          <div className="px-4 pb-4 border-t border-border pt-3 text-sm space-y-3">
            {/* Earnings breakdown */}
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Earnings</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Row label="Total Earnings" value={formatAed(parseFloat(s.total_earnings_aed))} />
                {s.commission_aed != null && <Row label="Commission" value={formatAed(parseFloat(s.commission_aed))} />}
                {s.target_amount_aed != null && <Row label="Target Bonus" value={formatAed(parseFloat(s.target_amount_aed))} />}
                <Row label="Base Amount" value={formatAed(parseFloat(s.base_amount_aed))} />
              </div>
            </div>

            {/* Deductions breakdown */}
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Deductions</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Row label="Salik" value={formatAed(parseFloat(s.salik_aed))} />
                <Row label="RTA Fine" value={formatAed(parseFloat(s.rta_fine_aed))} />
                <Row label="Card Charges" value={formatAed(parseFloat(s.card_service_charges_aed))} />
                {s.room_rent_aed != null && <Row label="Room Rent" value={formatAed(parseFloat(s.room_rent_aed))} />}
                {s.car_charging_diff_aed != null && <Row label="Car Charging Diff" value={formatAed(parseFloat(s.car_charging_diff_aed))} />}
                {s.cash_not_handover_aed !== '0.00' && <Row label="Cash Not Handover" value={formatAed(parseFloat(s.cash_not_handover_aed))} />}
                <Row label="Advance Deduction" value={formatAed(parseFloat(s.advance_deduction_aed))} />
              </div>
            </div>

            {/* Summary */}
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Summary</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Row label="Final Salary" value={formatAed(parseFloat(s.final_salary_aed))} highlight />
                <Row label="Net Payable" value={formatAed(parseFloat(s.net_payable_aed))} highlight />
              </div>
            </div>

            {/* Payment info if paid */}
            {s.status === 'paid' && (
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Payment</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {s.payment_date && <Row label="Payment Date" value={s.payment_date} />}
                  {s.payment_mode && <Row label="Mode" value={s.payment_mode.replace('_', ' ')} />}
                  {s.payment_reference && <Row label="Reference" value={s.payment_reference} />}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted">
                Generated by {s.generated_by_name} on {new Date(s.generated_at).toLocaleDateString('en-GB')}
                {s.approved_at && ` · Approved ${new Date(s.approved_at).toLocaleDateString('en-GB')}`}
              </p>
              {s.slip_url && (
                <a
                  href={s.slip_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <span className="material-symbols-rounded text-[13px]">download</span>
                  Download Slip
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <MarkPaidDialog salaryId={s.id} open={payDialog} onClose={() => setPayDialog(false)} />
    </>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2 ${highlight ? 'bg-primary/5 border border-primary/20' : 'bg-surface'}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-primary' : 'text-primary'}`}>{value}</p>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function SalaryPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const canAdmin = user?.role === 'super_admin' || user?.role === 'accountant'

  const [showForm, setShowForm] = useState(false)
  const [filterDriver, setFilterDriver] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterType, setFilterType] = useState<SalaryType | ''>('')

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
  })

  const { data: salaries = [], isLoading } = useQuery<Salary[]>({
    queryKey: ['salaries', filterDriver, filterMonth],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filterDriver) params.set('driver_id', filterDriver)
      if (filterMonth) params.set('month', filterMonth)
      return apiGet(`/salaries?${params}`)
    },
  })

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<Form, any, Form>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      period_month: currentMonth(),
      salary_type: 'commission',
      total_earnings_aed: 0,
      total_cash_received_aed: 0,
      cash_not_handover_aed: 0,
      car_charging_aed: 0,
      salik_used_aed: 0,
      salik_refund_aed: 0,
      rta_fine_aed: 0,
      card_service_charges_aed: 0,
    },
  })

  const salaryType = watch('salary_type')
  const watchedDriverId = watch('driver_id')
  const watchedMonth = watch('period_month')

  // Auto-fetch earnings when driver + month are set
  const earningsEnabled = !!(
    watchedDriverId &&
    /^[0-9a-f-]{36}$/i.test(watchedDriverId) &&
    /^\d{4}-\d{2}$/.test(watchedMonth ?? '')
  )

  const { data: earnings, isFetching: earningsFetching } = useQuery<MonthlyEarnings>({
    queryKey: ['salary-earnings', watchedDriverId, watchedMonth],
    queryFn: () => apiGet(`/salaries/earnings?driver_id=${watchedDriverId}&month=${watchedMonth}`),
    enabled: earningsEnabled && showForm,
  })

  // When earnings load, auto-fill total_earnings_aed
  useEffect(() => {
    if (earnings) {
      setValue('total_earnings_aed', parseFloat(earnings.total_aed))
    }
  }, [earnings, setValue])

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: Form) => apiPost('/salaries/generate', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salaries'] })
      reset()
      setShowForm(false)
    },
  })

  const activeDrivers = drivers.filter((d) => d.is_active)

  const filteredSalaries = filterType
    ? salaries.filter((s) => s.salary_type_snapshot === filterType)
    : salaries

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Salary</h1>
          <p className="text-muted">Generate and view driver salary slips</p>
        </div>
        {canAdmin && (
          <Button onClick={() => setShowForm((v) => !v)}>
            <span className="material-symbols-rounded text-[16px] mr-2">add</span> Generate
          </Button>
        )}
      </div>

      {/* Generate form */}
      {showForm && (
        <form
          onSubmit={handleSubmit((d: Form) => mutate(d))}
          className="bg-white border border-border rounded-2xl p-5 space-y-4"
        >
          <h2 className="font-semibold text-primary">Generate Salary</h2>
          {error && (
            <p className="text-xs text-danger bg-red-50 rounded p-2">{(error as Error).message}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Driver</label>
              <Controller
                name="driver_id"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Select driver…</option>
                    {activeDrivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                  </Select>
                )}
              />
              {errors.driver_id && <p className="text-xs text-danger mt-1">{errors.driver_id.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Month</label>
              <Input type="month" {...register('period_month')} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Salary Type</label>
              <Select {...register('salary_type')}>
                <option value="commission">Commission</option>
                <option value="target_high">Target High</option>
                <option value="target_low">Target Low</option>
              </Select>
            </div>
          </div>

          {/* Earnings auto-fetch section */}
          {earningsEnabled && (
            <div className="bg-surface rounded-xl p-4 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Trip Earnings (Auto-fetched)</p>
                {earningsFetching && (
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                )}
                {earnings && !earningsFetching && (
                  <Badge variant="muted">{earnings.trip_count} trips</Badge>
                )}
              </div>
              {earnings && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className="rounded-lg bg-white border border-border p-2">
                    <p className="text-xs text-muted">Cash</p>
                    <p className="font-semibold text-primary">{formatAed(parseFloat(earnings.cash_aed))}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-border p-2">
                    <p className="text-xs text-muted">Uber Cash</p>
                    <p className="font-semibold text-primary">{formatAed(parseFloat(earnings.uber_cash_aed))}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-border p-2">
                    <p className="text-xs text-muted">Bolt Cash</p>
                    <p className="font-semibold text-primary">{formatAed(parseFloat(earnings.bolt_cash_aed))}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-border p-2">
                    <p className="text-xs text-muted">Card</p>
                    <p className="font-semibold text-primary">{formatAed(parseFloat(earnings.card_aed))}</p>
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-2">
                    <p className="text-xs text-muted">Total</p>
                    <p className="font-bold text-primary">{formatAed(parseFloat(earnings.total_aed))}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Total Earnings (AED)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                readOnly={!!earnings}
                className={earnings ? 'bg-surface cursor-not-allowed' : ''}
                {...register('total_earnings_aed')}
              />
              {earnings && <p className="text-xs text-muted mt-1">Auto-filled from trips</p>}
              {errors.total_earnings_aed && <p className="text-xs text-danger mt-1">{errors.total_earnings_aed.message}</p>}
            </div>
            <NumField label="Cash Received (AED)" name="total_cash_received_aed" register={register} errors={errors} />
            <NumField label="Cash Submitted (AED)" name="total_cash_submit_aed" register={register} errors={errors} optional />
            <NumField label="Cash Not Handover (AED)" name="cash_not_handover_aed" register={register} errors={errors} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField label="Salik Used (AED)" name="salik_used_aed" register={register} errors={errors} />
            <NumField label="Salik Refund (AED)" name="salik_refund_aed" register={register} errors={errors} />
            <NumField label="RTA Fine (AED)" name="rta_fine_aed" register={register} errors={errors} />
            <NumField label="Card Charges (AED)" name="card_service_charges_aed" register={register} errors={errors} />
          </div>

          {(salaryType === 'target_high' || salaryType === 'target_low') && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NumField label="Car Charging Budget (AED)" name="car_charging_aed" register={register} errors={errors} />
              <NumField label="Car Charging Used (AED)" name="car_charging_used_aed" register={register} errors={errors} optional />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField label="Room Rent (AED)" name="room_rent_aed" register={register} errors={errors} optional />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Generating…' : 'Generate Salary'}</Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterDriver} onChange={(e) => setFilterDriver(e.target.value)} className="max-w-xs">
          <option value="">All Drivers</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.full_name}</option>
          ))}
        </Select>
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="max-w-[200px]"
        />
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as SalaryType | '')}
          className="max-w-[180px]"
        >
          <option value="">All Types</option>
          <option value="commission">Commission</option>
          <option value="target_high">Target High</option>
          <option value="target_low">Target Low</option>
        </Select>
      </div>

      {/* Salary list */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredSalaries.length === 0 ? (
        <div className="py-16 text-center text-muted">No salary records found</div>
      ) : (
        <div className="space-y-3">
          {filteredSalaries.map((s) => <SalaryRow key={s.id} s={s} canAdmin={canAdmin} />)}
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NumField({ label, name, register, errors, optional }: { label: string; name: string; register: any; errors: any; optional?: boolean }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}{optional ? '' : ''}</label>
      <Input type="number" step="0.01" min="0" {...register(name)} />
      {errors[name] && <p className="text-xs text-danger mt-1">{errors[name].message}</p>}
    </div>
  )
}
