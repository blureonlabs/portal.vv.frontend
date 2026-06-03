import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiGet, apiPost } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { formatAed } from '../../lib/utils'
import type { Driver, MonthlyEarnings } from '../../types'
import { useToast } from '../../components/ui/Toast'

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
  incentives_aed: z.coerce.number().min(0).default(0),
  room_rent_aed: z.coerce.number().optional(),
})
type Form = z.infer<typeof schema>

function currentMonth() { return new Date().toISOString().slice(0, 7) }

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

export function SalaryForm({ activeDrivers, onClose }: {
  activeDrivers: Driver[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const toast = useToast()

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
      incentives_aed: 0,
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
    enabled: earningsEnabled,
  })

  // When driver selection changes, auto-set salary type from driver profile
  useEffect(() => {
    if (watchedDriverId) {
      const driver = activeDrivers.find(d => d.id === watchedDriverId)
      if (driver) {
        setValue('salary_type', driver.salary_type)
      }
    }
  }, [watchedDriverId, activeDrivers, setValue])

  // When earnings load, auto-fill total_earnings_aed
  useEffect(() => {
    if (earnings) {
      setValue('total_earnings_aed', parseFloat(earnings.total_aed))
    }
  }, [earnings, setValue])

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: Form) => apiPost('/salaries/generate', data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['salaries'] })
      reset()
      onClose()
      const driverName = activeDrivers.find(d => d.id === vars.driver_id)?.full_name ?? 'driver'
      toast.add(`Salary generated for ${driverName}`, 'success')
    },
    onError: (e: Error) => toast.add(e.message, 'error'),
  })

  return (
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
              <Select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                name={field.name}
                options={[{ value: '', label: 'Select driver\u2026' }, ...activeDrivers.map((d) => ({ value: d.id, label: d.full_name }))]}
                placeholder="Select driver\u2026"
              />
            )}
          />
          {errors.driver_id && <p className="text-xs text-danger mt-1">{errors.driver_id.message}</p>}
          {activeDrivers.length === 0 && (
            <p className="text-xs text-muted mt-1">
              No active drivers. <a href="/drivers" className="text-accent hover:underline">Add a driver</a> first.
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Month</label>
          <Input type="month" {...register('period_month')} />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Salary Type <span className="text-muted">(from driver profile)</span></label>
          <Controller
            name="salary_type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                name={field.name}
                disabled
                className="bg-surface cursor-not-allowed opacity-75"
                options={[
                  { value: 'commission', label: 'Commission' },
                  { value: 'target_high', label: 'Target High' },
                  { value: 'target_low', label: 'Target Low' },
                ]}
                placeholder="Select type"
              />
            )}
          />
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NumField label="Incentives (AED)" name="incentives_aed" register={register} errors={errors} />
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
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Generating\u2026' : 'Generate Salary'}</Button>
      </div>
    </form>
  )
}
