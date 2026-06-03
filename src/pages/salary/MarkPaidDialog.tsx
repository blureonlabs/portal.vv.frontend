import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { apiPost } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'

const markPaidSchema = z.object({
  payment_date: z.string().min(1, 'Required'),
  payment_mode: z.enum(['bank_transfer', 'cash', 'cheque']),
  payment_reference: z.string().optional(),
  notes: z.string().max(500).optional(),
})
type MarkPaidForm = z.infer<typeof markPaidSchema>

export function MarkPaidDialog({
  salaryId,
  open,
  onClose,
}: {
  salaryId: string
  open: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, control: payControl, formState: { errors } } = useForm<MarkPaidForm>({
    resolver: zodResolver(markPaidSchema),
    defaultValues: { payment_mode: 'bank_transfer' },
  })

  const toast = useToast()
  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: MarkPaidForm) =>
      apiPost(`/salaries/${salaryId}/pay`, {
        payment_date: data.payment_date,
        payment_mode: data.payment_mode,
        payment_reference: data.payment_reference || null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salaries'] })
      reset()
      onClose()
      toast.add('Payment recorded', 'success')
    },
    onError: (e: Error) => toast.add(e.message, 'error'),
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
              <Controller
                name="payment_mode"
                control={payControl}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    name={field.name}
                    options={[
                      { value: 'bank_transfer', label: 'Bank Transfer' },
                      { value: 'cash', label: 'Cash' },
                      { value: 'cheque', label: 'Cheque' },
                    ]}
                    placeholder="Select mode"
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Reference Number (optional)</label>
              <Input type="text" placeholder="TXN123 / Cheque no." {...register('payment_reference')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Notes (optional)</label>
              <textarea {...register('notes')} rows={2} placeholder="Payment notes..."
                className="w-full px-3 py-2 rounded-xl border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" type="button" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                type="button"
                className="flex-1"
                disabled={isPending}
                onClick={handleSubmit((d) => mutate(d))}
              >
                {isPending ? 'Saving\u2026' : 'Confirm Payment'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
