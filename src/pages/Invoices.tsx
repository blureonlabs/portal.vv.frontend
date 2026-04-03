import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useAuthStore } from '../store/authStore'
import { formatDate, formatAed } from '../lib/utils'
import type { Driver, Invoice } from '../types'

const lineItemSchema = z.object({
  description: z.string().min(1, 'Required'),
  amount_aed: z.coerce.number(),
})

const generateSchema = z.object({
  driver_id: z.string().uuid('Select a driver'),
  period_start: z.string().min(1, 'Required'),
  period_end: z.string().min(1, 'Required'),
  line_items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
})
type GenerateForm = z.infer<typeof generateSchema>

export default function Invoices() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const canManage = user?.role === 'super_admin' || user?.role === 'accountant'

  const [driverFilter, setDriverFilter] = useState('')
  const [showGenerate, setShowGenerate] = useState(false)
  const [apiError, setApiError] = useState('')

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', driverFilter],
    queryFn: () => apiGet(`/invoices${driverFilter ? `?driver_id=${driverFilter}` : ''}`),
  })

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
    enabled: canManage,
  })

  const form = useForm<GenerateForm, any, GenerateForm>({
    resolver: zodResolver(generateSchema) as never,
    defaultValues: {
      line_items: [{ description: '', amount_aed: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'line_items' })

  const generateMutation = useMutation({
    mutationFn: (body: GenerateForm & { driver_name: string }) => apiPost('/invoices', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      setShowGenerate(false)
      form.reset()
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const driverOptions = [
    { value: '', label: 'All drivers' },
    ...drivers.map((d) => ({ value: d.id, label: d.full_name })),
  ]

  const handleGenerate = (data: GenerateForm) => {
    const driver = drivers.find((d) => d.id === data.driver_id)
    if (!driver) return
    setApiError('')
    generateMutation.mutate({ ...data, driver_name: driver.full_name })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Invoices</h1>
          <p className="text-sm text-muted mt-1">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <Button onClick={() => { setShowGenerate(true); setApiError('') }}>
            <span className="material-symbols-rounded text-[16px]">add</span>
            Generate Invoice
          </Button>
        )}
      </div>

      {/* Filter */}
      {canManage && (
        <div className="mb-6">
          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-white text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {driverOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted text-center py-12">Loading…</p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">No invoices yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted font-medium">Invoice No</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Driver</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Period</th>
                <th className="text-right py-3 px-4 text-muted font-medium">Total</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Generated</th>
                <th className="text-left py-3 px-4 text-muted font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                  <td className="py-3 px-4 font-mono text-sm font-medium text-primary">{inv.invoice_no}</td>
                  <td className="py-3 px-4 text-primary">{inv.driver_name}</td>
                  <td className="py-3 px-4 text-muted">
                    {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-primary">
                    {formatAed(parseFloat(inv.total_aed))}
                  </td>
                  <td className="py-3 px-4 text-muted">{formatDate(inv.created_at)}</td>
                  <td className="py-3 px-4">
                    {inv.pdf_url ? (
                      <a
                        href={inv.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        <span className="material-symbols-rounded text-[12px]">download</span> Download
                      </a>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenerate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setShowGenerate(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-lg font-bold text-primary mb-1">Generate Invoice</h2>
              <p className="text-sm text-muted mb-6">A PDF will be generated and stored automatically.</p>

              <form onSubmit={form.handleSubmit(handleGenerate)} className="flex flex-col gap-4">
                <Select
                  id="inv-driver"
                  label="Driver"
                  options={[
                    { value: '', label: 'Select driver…' },
                    ...drivers.map((d) => ({ value: d.id, label: d.full_name })),
                  ]}
                  error={form.formState.errors.driver_id?.message}
                  {...form.register('driver_id')}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="inv-start"
                    label="Period Start"
                    type="date"
                    error={form.formState.errors.period_start?.message}
                    {...form.register('period_start')}
                  />
                  <Input
                    id="inv-end"
                    label="Period End"
                    type="date"
                    error={form.formState.errors.period_end?.message}
                    {...form.register('period_end')}
                  />
                </div>

                {/* Line items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-primary">Line Items</label>
                    <button
                      type="button"
                      onClick={() => append({ description: '', amount_aed: 0 })}
                      className="text-xs text-accent hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-rounded text-[12px]">add</span> Add
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {fields.map((field, idx) => (
                      <div key={field.id} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            placeholder="Description"
                            className="w-full h-9 px-3 rounded-lg border border-border bg-white text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                            {...form.register(`line_items.${idx}.description`)}
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="AED"
                            className="w-full h-9 px-3 rounded-lg border border-border bg-white text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                            {...form.register(`line_items.${idx}.amount_aed`)}
                          />
                        </div>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="h-9 px-2 text-danger hover:text-red-700 transition-colors"
                          >
                            <span className="material-symbols-rounded text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.line_items && (
                    <p className="text-xs text-danger mt-1">
                      {typeof form.formState.errors.line_items === 'object' && 'message' in form.formState.errors.line_items
                        ? (form.formState.errors.line_items as { message: string }).message
                        : 'Check line items'}
                    </p>
                  )}
                </div>

                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}

                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowGenerate(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={generateMutation.isPending} className="flex-1">
                    <span className="material-symbols-rounded text-[16px]">description</span>
                    Generate
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
