import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'

import { apiGet, apiPost } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import type { Broadcast, Driver } from '../types'

const schema = z.object({
  subject: z.string().min(1, 'Subject required'),
  body: z.string().min(1, 'Message body required'),
  channel: z.enum(['email', 'whatsapp']),
  target: z.enum(['all_drivers', 'selected_drivers']),
})

type Form = z.infer<typeof schema>

const statusVariant = {
  sent: 'success' as const,
  sending: 'warning' as const,
  failed: 'danger' as const,
  draft: 'muted' as const,
}

export default function Broadcasts() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [apiError, setApiError] = useState('')
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([])

  const { data: broadcasts = [], isLoading } = useQuery<Broadcast[]>({
    queryKey: ['broadcasts'],
    queryFn: () => apiGet('/comms/broadcasts'),
  })

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
    enabled: showModal,
  })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema) as never,
    defaultValues: { channel: 'email', target: 'all_drivers' },
  })

  const target = watch('target')

  const { mutate: send, isPending } = useMutation({
    mutationFn: (data: Form & { driver_ids?: string[] }) => apiPost('/comms/broadcast', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
      setShowModal(false)
      reset()
      setSelectedDriverIds([])
      setApiError('')
    },
    onError: (e: Error) => setApiError(e.message),
  })

  const onSubmit = (data: Form) => {
    if (data.channel === 'whatsapp') {
      setApiError('WhatsApp integration coming soon')
      return
    }
    send({
      ...data,
      driver_ids: data.target === 'selected_drivers' ? selectedDriverIds : undefined,
    })
  }

  const toggleDriver = (id: string) => {
    setSelectedDriverIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Broadcasts</h1>
          <p className="text-sm text-muted mt-1">Send communications to drivers</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <span className="material-symbols-rounded text-[18px]">campaign</span>
          New Broadcast
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted text-sm">Loading...</p>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <span className="material-symbols-rounded text-[48px] opacity-30">campaign</span>
          <p className="mt-2">No broadcasts sent yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-4 py-3 font-semibold text-muted">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-muted">Channel</th>
                <th className="text-left px-4 py-3 font-semibold text-muted">Target</th>
                <th className="text-left px-4 py-3 font-semibold text-muted">Recipients</th>
                <th className="text-left px-4 py-3 font-semibold text-muted">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted">Sent By</th>
                <th className="text-left px-4 py-3 font-semibold text-muted">Date</th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((b) => (
                <tr key={b.id} className="border-b border-border/50 hover:bg-surface/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{b.subject}</td>
                  <td className="px-4 py-3">
                    <Badge variant={b.channel === 'email' ? 'default' : 'muted'}>
                      <span className="material-symbols-rounded text-[14px] mr-1">
                        {b.channel === 'email' ? 'mail' : 'chat'}
                      </span>
                      {b.channel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {b.target === 'all_drivers' ? 'All Drivers' : 'Selected'}
                  </td>
                  <td className="px-4 py-3 text-primary font-medium">{b.recipient_count}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[b.status]}>{b.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{b.sent_by_name}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(b.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-primary mb-4">New Broadcast</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Subject" {...register('subject')} error={errors.subject?.message} />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">Message</label>
                  <textarea
                    {...register('body')}
                    rows={5}
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-primary placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                    placeholder="Write your message here... HTML supported."
                  />
                  {errors.body && <p className="text-xs text-danger">{errors.body.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select label="Channel" {...register('channel')}>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp (Coming Soon)</option>
                  </Select>
                  <Select label="Target" {...register('target')}>
                    <option value="all_drivers">All Drivers</option>
                    <option value="selected_drivers">Select Drivers</option>
                  </Select>
                </div>

                {target === 'selected_drivers' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Select Drivers ({selectedDriverIds.length} selected)
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-border rounded-xl p-2 space-y-1">
                      {drivers.map((d) => (
                        <label key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={selectedDriverIds.includes(d.id)}
                            onChange={() => toggleDriver(d.id)}
                            className="rounded"
                          />
                          {d.full_name}
                        </label>
                      ))}
                      {drivers.length === 0 && <p className="text-xs text-muted p-2">No drivers found</p>}
                    </div>
                  </div>
                )}

                {apiError && (
                  <div className="bg-red-50 text-danger text-sm px-4 py-2 rounded-xl">{apiError}</div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowModal(false); setApiError('') }}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isPending} className="flex-1">
                    <span className="material-symbols-rounded text-[18px]">send</span>
                    Send Broadcast
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
