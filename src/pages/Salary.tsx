import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiGet, apiPost } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { formatAed } from '../lib/utils'
import type { Driver, Salary, SalaryType } from '../types'

const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  commission: 'Commission',
  target_high: 'Target High',
  target_low: 'Target Low',
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

function SalaryRow({ s }: { s: Salary }) {
  const [open, setOpen] = useState(false)

  return (
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
        </div>
        <div className="flex items-center gap-3">
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted">
              Generated by {s.generated_by_name} on {new Date(s.generated_at).toLocaleDateString('en-GB')}
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

export default function SalaryPage() {
  const qc = useQueryClient()
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

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<Form, any, Form>({
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
        <Button onClick={() => setShowForm((v) => !v)}>
          <span className="material-symbols-rounded text-[16px] mr-2">add</span> Generate
        </Button>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField label="Total Earnings (AED)" name="total_earnings_aed" register={register} errors={errors} />
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
          {filteredSalaries.map((s) => <SalaryRow key={s.id} s={s} />)}
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
