import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { apiGet, apiPost } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { formatAed, formatDate } from '../../lib/utils'
import type { DriverContext, Trip } from '../../types'

const schema = z.object({
  trip_date: z.string().min(1, 'Required'),
  cash_aed: z.coerce.number().min(0),
  card_aed: z.coerce.number().min(0).optional(),
  other_aed: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})
type Form = z.infer<typeof schema>

function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }
function today() { return new Date().toISOString().slice(0, 10) }

export default function MyTrips() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: ctx } = useQuery<DriverContext>({
    queryKey: ['portal-me'],
    queryFn: () => apiGet('/me'),
  })

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ['portal-trips'],
    queryFn: () => apiGet(`/trips?from=${monthStart()}&to=${today()}`),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form, any, Form>({
    resolver: zodResolver(schema) as never,
    defaultValues: { trip_date: today() },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Form) => apiPost('/trips', {
      trip_date: data.trip_date,
      cash_aed: data.cash_aed,
      card_aed: data.card_aed ?? 0,
      other_aed: data.other_aed ?? 0,
      notes: data.notes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-trips'] })
      qc.invalidateQueries({ queryKey: ['portal-earnings'] })
      reset({ trip_date: today() })
      setShowForm(false)
    },
  })

  const monthTotal = trips.reduce(
    (acc, t) => acc + parseFloat(t.cash_aed) + parseFloat(t.card_aed) + parseFloat(t.other_aed),
    0
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Trips</h2>
          <p className="text-sm text-gray-500">{new Date().toLocaleString('en-AE', { month: 'long', year: 'numeric' })}</p>
        </div>
        {ctx?.self_entry_enabled && (
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="w-4 h-4 mr-1" /> Add Trip
          </Button>
        )}
      </div>

      {/* Monthly total */}
      <div className="bg-brand/10 rounded-2xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-brand font-medium">Month total</span>
        <span className="text-lg font-bold text-brand">{formatAed(monthTotal)}</span>
      </div>

      {/* Add trip form */}
      {showForm && (
        <form
          onSubmit={handleSubmit((d: Form) => mutate(d))}
          className="bg-white rounded-2xl border border-border p-4 space-y-3"
        >
          <h3 className="font-semibold text-gray-900">New Trip</h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <Input type="date" {...register('trip_date')} max={today()} />
            {errors.trip_date && <p className="text-xs text-red-500 mt-1">{errors.trip_date.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cash (AED)</label>
              <Input type="number" step="0.01" min="0" {...register('cash_aed')} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Card (AED)</label>
              <Input type="number" step="0.01" min="0" {...register('card_aed')} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Other (AED)</label>
              <Input type="number" step="0.01" min="0" {...register('other_aed')} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <Input {...register('notes')} placeholder="Optional" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Saving…' : 'Save Trip'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Trips list */}
      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full" />
        </div>
      ) : trips.length === 0 ? (
        <div className="py-12 text-center text-gray-400">No trips this month</div>
      ) : (
        <div className="space-y-2">
          {trips.map((t) => {
            const total = parseFloat(t.cash_aed) + parseFloat(t.card_aed) + parseFloat(t.other_aed)
            return (
              <div key={t.id} className="bg-white rounded-xl border border-border px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatDate(t.trip_date)}</p>
                  <p className="text-xs text-gray-500">
                    Cash {formatAed(t.cash_aed)}
                    {parseFloat(t.card_aed) > 0 && ` · Card ${formatAed(t.card_aed)}`}
                    {parseFloat(t.other_aed) > 0 && ` · Other ${formatAed(t.other_aed)}`}
                  </p>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatAed(total)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
