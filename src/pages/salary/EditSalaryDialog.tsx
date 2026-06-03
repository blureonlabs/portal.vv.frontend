import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiPut } from '../../lib/api'
import type { Salary } from '../../types'
import { X } from 'lucide-react'
import { useToast } from '../../components/ui/Toast'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EditNumField({ label, reg, err }: { label: string; reg: any; err?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      <input type="number" step="0.01" min="0" {...reg} className="w-full px-3 py-2 rounded-xl border border-border text-sm" />
      {err && <p className="text-xs text-danger mt-1">{err}</p>}
    </div>
  )
}

export function EditSalaryDialog({ salary, onClose }: { salary: Salary; onClose: () => void }) {
  const qc = useQueryClient()
  const [error, setError] = useState('')

  const editSchema = z.object({
    salary_type: z.enum(['commission', 'target_high', 'target_low']),
    total_earnings_aed: z.coerce.number().min(0),
    total_cash_received_aed: z.coerce.number().min(0),
    total_cash_submit_aed: z.coerce.number().min(0).optional(),
    cash_not_handover_aed: z.coerce.number().min(0).default(0),
    car_charging_aed: z.coerce.number().min(0).default(0),
    car_charging_used_aed: z.coerce.number().min(0).optional(),
    salik_used_aed: z.coerce.number().min(0).default(0),
    salik_refund_aed: z.coerce.number().min(0).default(0),
    rta_fine_aed: z.coerce.number().min(0).default(0),
    card_service_charges_aed: z.coerce.number().min(0).default(0),
    incentives_aed: z.coerce.number().min(0).default(0),
    room_rent_aed: z.coerce.number().min(0).optional(),
  })
  type EditForm = z.infer<typeof editSchema>

  const { register: reg, handleSubmit, formState: { errors: fe } } = useForm<EditForm, any, EditForm>({
    resolver: zodResolver(editSchema) as never,
    defaultValues: {
      salary_type: salary.salary_type_snapshot,
      total_earnings_aed: parseFloat(salary.total_earnings_aed),
      total_cash_received_aed: parseFloat(salary.total_cash_received_aed),
      total_cash_submit_aed: salary.total_cash_submit_aed ? parseFloat(salary.total_cash_submit_aed) : undefined,
      cash_not_handover_aed: parseFloat(salary.cash_not_handover_aed),
      car_charging_aed: parseFloat(salary.car_charging_aed),
      car_charging_used_aed: salary.car_charging_used_aed ? parseFloat(salary.car_charging_used_aed) : undefined,
      salik_used_aed: parseFloat(salary.salik_used_aed),
      salik_refund_aed: parseFloat(salary.salik_refund_aed),
      rta_fine_aed: parseFloat(salary.rta_fine_aed),
      card_service_charges_aed: parseFloat(salary.card_service_charges_aed),
      incentives_aed: salary.incentives_aed ? parseFloat(salary.incentives_aed) : 0,
      room_rent_aed: salary.room_rent_aed ? parseFloat(salary.room_rent_aed) : undefined,
    },
  })

  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (data: EditForm) => apiPut(`/salaries/${salary.id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salaries'] }); onClose(); toast.add('Salary adjusted', 'success') },
    onError: (e: Error) => { setError(e.message); toast.add(e.message, 'error') },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">Edit Salary — {salary.driver_name}</h3>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-surface text-muted"><X size={20} /></button>
        </div>
        <p className="text-xs text-muted mb-4">Period: {salary.period_month} · Recalculation happens on save.</p>
        {error && <p className="text-sm text-danger mb-3">{error}</p>}
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Salary Type</label>
            <select {...reg('salary_type')} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
              <option value="commission">Commission</option>
              <option value="target_high">Target High</option>
              <option value="target_low">Target Low</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EditNumField label="Total Earnings" reg={reg('total_earnings_aed')} err={fe.total_earnings_aed?.message} />
            <EditNumField label="Cash Received" reg={reg('total_cash_received_aed')} err={fe.total_cash_received_aed?.message} />
            <EditNumField label="Cash Submitted" reg={reg('total_cash_submit_aed')} err={fe.total_cash_submit_aed?.message} />
            <EditNumField label="Cash Not Handover" reg={reg('cash_not_handover_aed')} err={fe.cash_not_handover_aed?.message} />
            <EditNumField label="Car Charging" reg={reg('car_charging_aed')} err={fe.car_charging_aed?.message} />
            <EditNumField label="Car Charging Used" reg={reg('car_charging_used_aed')} err={fe.car_charging_used_aed?.message} />
            <EditNumField label="Salik Used" reg={reg('salik_used_aed')} err={fe.salik_used_aed?.message} />
            <EditNumField label="Salik Refund" reg={reg('salik_refund_aed')} err={fe.salik_refund_aed?.message} />
            <EditNumField label="RTA Fine" reg={reg('rta_fine_aed')} err={fe.rta_fine_aed?.message} />
            <EditNumField label="Card Charges" reg={reg('card_service_charges_aed')} err={fe.card_service_charges_aed?.message} />
            <EditNumField label="Incentives" reg={reg('incentives_aed')} err={fe.incentives_aed?.message} />
            <EditNumField label="Room Rent" reg={reg('room_rent_aed')} err={fe.room_rent_aed?.message} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-full border border-border text-sm font-medium text-muted hover:bg-surface">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-60">
              {mutation.isPending ? 'Saving\u2026' : 'Save & Recalculate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
