import { useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { apiGet, apiPost } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { formatAed, formatDate } from '../../lib/utils'
import type { Advance, DriverContext } from '../../types'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-blue-100 text-blue-800',
}

const schema = z.object({
  amount_aed: z.coerce.number().min(1, 'Minimum AED 1'),
  reason: z.string().min(5, 'Please describe the reason'),
})
type Form = z.infer<typeof schema>

export default function MyAdvances() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: ctx } = useQuery<DriverContext>({
    queryKey: ['portal-me'],
    queryFn: () => apiGet('/me'),
  })

  const { data: advances = [], isLoading } = useQuery<Advance[]>({
    queryKey: ['portal-advances'],
    queryFn: () => apiGet('/advances'),
  })

  // Supabase Realtime — subscribe to advance changes for this driver
  useEffect(() => {
    if (!ctx?.driver_id) return

    const channel = supabase
      .channel('portal-advances')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advances',
          filter: `driver_id=eq.${ctx.driver_id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['portal-advances'] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ctx?.driver_id, qc])

  const hasPending = advances.some((a) => a.status === 'pending')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form, any, Form>({
    resolver: zodResolver(schema) as never,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Form) => apiPost('/advances', {
      amount_aed: data.amount_aed,
      reason: data.reason,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-advances'] })
      reset()
      setShowForm(false)
    },
  })

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary">My Advances</h2>
          <p className="text-sm text-muted">Updates in real-time</p>
        </div>
        {!hasPending && (
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <span className="material-symbols-rounded text-[16px] mr-1">add</span> Request
          </Button>
        )}
      </div>

      {hasPending && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          You have a pending advance request. Wait for it to be actioned before submitting another.
        </div>
      )}

      {/* Request form */}
      {showForm && (
        <form
          onSubmit={handleSubmit((d: Form) => mutate(d))}
          className="bg-white rounded-2xl border border-border p-4 space-y-3"
        >
          <h3 className="font-semibold text-primary">New Advance Request</h3>
          <div>
            <label className="block text-xs text-muted mb-1">Amount (AED)</label>
            <Input type="number" step="0.01" min="1" {...register('amount_aed')} />
            {errors.amount_aed && <p className="text-xs text-red-500 mt-1">{errors.amount_aed.message}</p>}
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Reason</label>
            <Input {...register('reason')} placeholder="Why do you need this advance?" />
            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Submitting…' : 'Submit Request'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Advances list */}
      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : advances.length === 0 ? (
        <div className="py-12 text-center text-muted">No advance requests</div>
      ) : (
        <div className="space-y-3">
          {advances.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-lg font-bold text-primary">{formatAed(a.amount_aed)}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[a.status]}`}>
                  {a.status}
                </span>
              </div>
              <p className="text-sm text-muted mb-2">{a.reason}</p>
              <p className="text-xs text-muted">{formatDate(a.created_at)}</p>
              {a.rejection_reason && (
                <p className="text-xs text-red-600 mt-2 bg-red-50 rounded p-2">
                  Rejected: {a.rejection_reason}
                </p>
              )}
              {a.status === 'paid' && a.payment_date && (
                <p className="text-xs text-blue-600 mt-1">
                  Paid on {formatDate(a.payment_date)} via {a.method}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
