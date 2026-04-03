import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiGet, apiPost } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { formatDate } from '../../lib/utils'
import type { LeaveRequest } from '../../types'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const schema = z.object({
  type: z.enum(['leave', 'permission']),
  from_date: z.string().min(1, 'Required'),
  to_date: z.string().min(1, 'Required'),
  reason: z.string().min(5, 'Please describe the reason'),
})
type Form = z.infer<typeof schema>

function today() { return new Date().toISOString().slice(0, 10) }
function yearStart() { return new Date().getFullYear() + '-01-01' }

export default function MyLeave() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: leaves = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['portal-leave-all'],
    queryFn: () => apiGet(`/hr/requests?from=${yearStart()}&to=${today()}`),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form, any, Form>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'leave', from_date: today(), to_date: today() },
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: Form) => apiPost('/hr/requests', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-leave-all'] })
      qc.invalidateQueries({ queryKey: ['portal-leave'] })
      reset({ type: 'leave', from_date: today(), to_date: today() })
      setShowForm(false)
    },
  })

  function dayCount(from: string, to: string) {
    const diff = (new Date(to).getTime() - new Date(from).getTime()) / 86400000
    return Math.max(0, diff) + 1
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary">My Leave</h2>
          <p className="text-sm text-muted">Leave & permission requests</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <span className="material-symbols-rounded text-[16px] mr-1">add</span> Request
        </Button>
      </div>

      {/* Request form */}
      {showForm && (
        <form
          onSubmit={handleSubmit((d: Form) => mutate(d))}
          className="bg-white rounded-2xl border border-border p-4 space-y-3"
        >
          <h3 className="font-semibold text-primary">New Request</h3>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded p-2">
              {(error as Error).message}
            </p>
          )}
          <div>
            <label className="block text-xs text-muted mb-1">Type</label>
            <Select {...register('type')}>
              <option value="leave">Leave</option>
              <option value="permission">Permission</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-muted mb-1">From</label>
              <Input type="date" {...register('from_date')} />
              {errors.from_date && <p className="text-xs text-red-500 mt-1">{errors.from_date.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">To</label>
              <Input type="date" {...register('to_date')} />
              {errors.to_date && <p className="text-xs text-red-500 mt-1">{errors.to_date.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Reason</label>
            <Input {...register('reason')} placeholder="Brief explanation" />
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

      {/* Leave list */}
      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : leaves.length === 0 ? (
        <div className="py-12 text-center text-muted">No leave requests</div>
      ) : (
        <div className="space-y-3">
          {leaves.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-primary capitalize">{l.type}</span>
                  <span className="mx-2 text-muted">·</span>
                  <span className="text-sm text-muted">
                    {dayCount(l.from_date, l.to_date)} day{dayCount(l.from_date, l.to_date) !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[l.status]}`}>
                  {l.status}
                </span>
              </div>
              <p className="text-xs text-muted">
                {formatDate(l.from_date)} – {formatDate(l.to_date)}
              </p>
              <p className="text-sm text-primary mt-1">{l.reason}</p>
              {l.rejection_reason && (
                <p className="text-xs text-red-600 mt-2 bg-red-50 rounded p-2">
                  Rejected: {l.rejection_reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
