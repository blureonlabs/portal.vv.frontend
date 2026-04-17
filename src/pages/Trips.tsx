import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost, apiPut, apiDelete, apiFetchRaw } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useAuthStore } from '../store/authStore'
import { formatDate, formatAed } from '../lib/utils'
import type { Driver, Trip, CsvPreviewRow } from '../types'

const CURRENT_MONTH_START = new Date()
CURRENT_MONTH_START.setDate(1)
const today = new Date().toISOString().slice(0, 10)
const monthStart = CURRENT_MONTH_START.toISOString().slice(0, 10)

const tripSchema = z.object({
  driver_id: z.string().uuid('Select a driver'),
  trip_date: z.string().min(1, 'Required'),
  cash_aed: z.coerce.number().min(0),
  uber_cash_aed: z.coerce.number().min(0).optional(),
  bolt_cash_aed: z.coerce.number().min(0).optional(),
  card_aed: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})
type TripForm = z.infer<typeof tripSchema>

function sourceLabel(s: string) {
  return { manual: 'Manual', csv_import: 'CSV', uber_api: 'Uber' }[s] ?? s
}
function sourceBadge(s: string) {
  return { manual: 'default' as const, csv_import: 'warning' as const, uber_api: 'success' as const }[s] ?? 'muted'
}

export default function Trips() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const isSuperAdmin = user?.role === 'super_admin'
  const isAccountant = user?.role === 'accountant'
  const canManage = isSuperAdmin || isAccountant

  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [driverFilter, setDriverFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [showCsv, setShowCsv] = useState(false)
  const [apiError, setApiError] = useState('')
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [confirmMsg, setConfirmMsg] = useState('')

  // CSV import state
  const [csvDriverId, setCsvDriverId] = useState('')
  const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[] | null>(null)
  const [csvImporting, setCsvImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
    enabled: canManage,
  })

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ['trips', from, to, driverFilter],
    queryFn: () => {
      const params = new URLSearchParams({ from, to })
      if (driverFilter) params.set('driver_id', driverFilter)
      return apiGet(`/trips?${params}`)
    },
  })

  const form = useForm<TripForm, any, TripForm>({
    resolver: zodResolver(tripSchema) as never,
    defaultValues: { trip_date: today, cash_aed: 0 },
  })

  const createMutation = useMutation({
    mutationFn: (body: TripForm) => apiPost('/trips', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] })
      setShowCreate(false)
      form.reset()
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: TripForm }) => apiPut(`/trips/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] })
      setEditingTrip(null)
      form.reset()
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/trips/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  })

  const driverOptions = [
    { value: '', label: 'All drivers' },
    ...drivers.map((d) => ({ value: d.id, label: d.full_name })),
  ]

  const totalCash = trips.reduce((s, t) => s + parseFloat(t.cash_aed), 0)
  const totalUberCash = trips.reduce((s, t) => s + parseFloat(t.uber_cash_aed), 0)
  const totalBoltCash = trips.reduce((s, t) => s + parseFloat(t.bolt_cash_aed), 0)
  const totalCard = trips.reduce((s, t) => s + parseFloat(t.card_aed), 0)
  const grandTotal = trips.reduce((s, t) => s + parseFloat(t.total_aed), 0)

  // Conflict detection: flag trips where same driver+date appears more than once
  const conflictKeys = new Set<string>()
  const seenKeys = new Set<string>()
  trips.forEach((t) => {
    const key = `${t.driver_id}-${t.trip_date}`
    if (seenKeys.has(key)) conflictKeys.add(key)
    seenKeys.add(key)
  })

  const openEdit = (t: Trip) => {
    setEditingTrip(t)
    setApiError('')
    form.reset({
      driver_id: t.driver_id,
      trip_date: t.trip_date,
      cash_aed: parseFloat(t.cash_aed),
      uber_cash_aed: parseFloat(t.uber_cash_aed),
      bolt_cash_aed: parseFloat(t.bolt_cash_aed),
      card_aed: parseFloat(t.card_aed),
      notes: t.notes ?? '',
    })
  }

  const closeForm = () => {
    setShowCreate(false)
    setEditingTrip(null)
    setApiError('')
    form.reset()
  }

  const handleFormSubmit = (d: TripForm) => {
    setApiError('')
    if (editingTrip) {
      updateMutation.mutate({ id: editingTrip.id, body: d })
    } else {
      createMutation.mutate(d)
    }
  }

  // CSV handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !csvDriverId) return
    const content = await file.text()
    try {
      const result = await apiPost<{ rows: CsvPreviewRow[] }>('/trips/csv/preview', {
        driver_id: csvDriverId,
        csv_content: content,
      })
      setCsvPreview(result.rows)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Preview failed')
    }
  }

  const handleCsvImport = async () => {
    if (!csvPreview || !csvDriverId) return
    setCsvImporting(true)
    try {
      await apiPost('/trips/csv/import', { driver_id: csvDriverId, rows: csvPreview })
      qc.invalidateQueries({ queryKey: ['trips'] })
      setShowCsv(false)
      setCsvPreview(null)
      setCsvDriverId('')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setCsvImporting(false)
    }
  }

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams({ from, to })
      if (driverFilter) params.set('driver_id', driverFilter)
      const blob = await apiFetchRaw(`/trips/csv/export?${params}`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trips_${from}_${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const validRows = csvPreview?.filter((r) => !r.error) ?? []
  const errorRows = csvPreview?.filter((r) => r.error) ?? []

  const downloadTemplate = () => {
    const csv = 'driver_id,trip_date,cash_aed,uber_cash_aed,bolt_cash_aed,card_aed,notes\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trip_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const isFormOpen = showCreate || editingTrip !== null
  const formTitle = editingTrip ? 'Edit Trip' : 'Add Trip'
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Trips</h1>
          <p className="text-sm text-muted mt-1">{trips.length} trip{trips.length !== 1 ? 's' : ''} in range</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <span className="material-symbols-rounded text-[16px]">download</span>
              Template
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <span className="material-symbols-rounded text-[16px]">table_view</span>
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowCsv(true); setApiError('') }}>
              <span className="material-symbols-rounded text-[16px]">upload</span>
              CSV Import
            </Button>
            <Button size="sm" onClick={() => { setShowCreate(true); setApiError(''); form.reset({ trip_date: today, cash_aed: 0 }) }}>
              <span className="material-symbols-rounded text-[16px]">add</span>
              Add Trip
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="trips-from" className="text-sm text-muted">From</label>
          <input id="trips-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-white text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="trips-to" className="text-sm text-muted">To</label>
          <input id="trips-to" type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-white text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        {canManage && (
          <Select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            options={driverOptions}
            placeholder="All drivers"
            className="min-w-[180px]"
          />
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Cash', amount: totalCash },
          { label: 'Uber Cash', amount: totalUberCash },
          { label: 'Bolt Cash', amount: totalBoltCash },
          { label: 'Card', amount: totalCard },
          { label: 'Total', amount: grandTotal },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted mb-1">{s.label}</p>
            <p className="text-lg font-bold text-primary">{formatAed(s.amount)}</p>
          </div>
        ))}
      </div>

      {/* Trip table */}
      {isLoading ? (
        <p className="text-muted text-sm text-center py-12">Loading…</p>
      ) : trips.length === 0 ? (
        <p className="text-muted text-sm text-center py-12">No trips in this range.</p>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted font-medium">Date</th>
                {canManage && <th className="text-left py-3 px-4 text-muted font-medium">Driver</th>}
                <th className="text-right py-3 px-4 text-muted font-medium">Cash</th>
                <th className="text-right py-3 px-4 text-muted font-medium">Uber Cash</th>
                <th className="text-right py-3 px-4 text-muted font-medium">Bolt Cash</th>
                <th className="text-right py-3 px-4 text-muted font-medium">Card</th>
                <th className="text-right py-3 px-4 text-muted font-medium">Total</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Source</th>
                <th className="text-left py-3 px-4 text-muted font-medium">Notes</th>
                {canManage && <th className="py-3 px-4" />}
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                  <td className="py-3 px-4 text-primary">
                    <span className="inline-flex items-center gap-1">
                      {formatDate(t.trip_date)}
                      {conflictKeys.has(`${t.driver_id}-${t.trip_date}`) && (
                        <span
                          className="material-symbols-rounded text-[14px] text-amber-500"
                          title="Duplicate trip: same driver has another trip on this date"
                        >
                          warning
                        </span>
                      )}
                    </span>
                  </td>
                  {canManage && <td className="py-3 px-4 font-medium text-primary">{t.driver_name}</td>}
                  <td className="py-3 px-4 text-right text-primary">{formatAed(parseFloat(t.cash_aed))}</td>
                  <td className="py-3 px-4 text-right text-muted">{formatAed(parseFloat(t.uber_cash_aed))}</td>
                  <td className="py-3 px-4 text-right text-muted">{formatAed(parseFloat(t.bolt_cash_aed))}</td>
                  <td className="py-3 px-4 text-right text-muted">{formatAed(parseFloat(t.card_aed))}</td>
                  <td className="py-3 px-4 text-right font-semibold text-primary">{formatAed(parseFloat(t.total_aed))}</td>
                  <td className="py-3 px-4">
                    <Badge variant={sourceBadge(t.source)}>{sourceLabel(t.source)}</Badge>
                  </td>
                  <td className="py-3 px-4 text-muted max-w-xs truncate">{t.notes ?? '—'}</td>
                  {canManage && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="text-accent hover:text-primary transition-colors p-2 cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label="Edit trip"
                          title="Edit trip"
                        >
                          <span className="material-symbols-rounded text-[14px]">edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setConfirmMsg(`Delete the trip for ${t.driver_name ?? 'this driver'} on ${formatDate(t.trip_date)}? This cannot be undone.`)
                            setConfirmAction(() => () => deleteMutation.mutate(t.id))
                          }}
                          className="text-danger hover:text-red-700 transition-colors p-2 cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label="Delete trip"
                          title="Delete trip"
                        >
                          <span className="material-symbols-rounded text-[14px]">delete</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        title="Delete Trip"
        message={confirmMsg}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmAction(null) }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Create / Edit Trip Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={closeForm} />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6"
            >
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span className="material-symbols-rounded text-[18px]">close</span>
              </button>
              <h2 className="text-lg font-bold text-primary mb-6">{formTitle}</h2>
              <form onSubmit={form.handleSubmit(handleFormSubmit)}
                className="flex flex-col gap-4">
                <Select id="trip-driver" label="Driver"
                  options={[{ value: '', label: 'Select driver…' }, ...drivers.map((d) => ({ value: d.id, label: d.full_name }))]}
                  error={form.formState.errors.driver_id?.message}
                  {...form.register('driver_id')} />
                <Input id="trip-date" label="Trip Date" type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  error={form.formState.errors.trip_date?.message}
                  {...form.register('trip_date')} />
                <div className="grid grid-cols-2 gap-3">
                  <Input id="trip-cash" label="Cash (AED)" type="number" step="0.01"
                    error={form.formState.errors.cash_aed?.message}
                    {...form.register('cash_aed')} />
                  <Input id="trip-uber-cash" label="Uber Cash (AED)" type="number" step="0.01"
                    {...form.register('uber_cash_aed')} />
                  <Input id="trip-bolt-cash" label="Bolt Cash (AED)" type="number" step="0.01"
                    {...form.register('bolt_cash_aed')} />
                  <Input id="trip-card" label="Card (AED)" type="number" step="0.01"
                    {...form.register('card_aed')} />
                </div>
                <Input id="trip-notes" label="Notes (optional)" {...form.register('notes')} />
                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}
                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
                  <Button type="submit" loading={isSubmitting} className="flex-1">
                    {editingTrip ? 'Save Changes' : 'Add Trip'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Import Modal */}
      <AnimatePresence>
        {showCsv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => { setShowCsv(false); setCsvPreview(null) }} />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => { setShowCsv(false); setCsvPreview(null); setCsvDriverId('') }}
                aria-label="Close"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span className="material-symbols-rounded text-[18px]">close</span>
              </button>
              <h2 className="text-lg font-bold text-primary mb-1">CSV Import</h2>
              <p className="text-sm text-muted mb-6">Format: <code className="text-xs bg-surface px-1 py-0.5 rounded">date,cash_aed,uber_cash_aed,bolt_cash_aed,card_aed,notes</code></p>

              <div className="flex flex-col gap-4 mb-6">
                <Select
                  label="Driver"
                  value={csvDriverId}
                  onChange={(e) => { setCsvDriverId(e.target.value); setCsvPreview(null) }}
                  options={[{ value: '', label: 'Select driver…' }, ...drivers.map((d) => ({ value: d.id, label: d.full_name }))]}
                  placeholder="Select driver…"
                />
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">CSV File</label>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" disabled={!csvDriverId}
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-primary disabled:opacity-50" />
                </div>
              </div>

              {csvPreview && (
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span className="flex items-center gap-1 text-success">
                      <span className="material-symbols-rounded text-[16px]">check_circle</span> {validRows.length} valid
                    </span>
                    {errorRows.length > 0 && (
                      <span className="flex items-center gap-1 text-danger">
                        <span className="material-symbols-rounded text-[16px]">warning</span> {errorRows.length} errors
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-surface">
                        <tr>
                          <th className="py-2 px-3 text-left text-muted font-medium">#</th>
                          <th className="py-2 px-3 text-left text-muted font-medium">Date</th>
                          <th className="py-2 px-3 text-right text-muted font-medium">Cash</th>
                          <th className="py-2 px-3 text-right text-muted font-medium">Uber Cash</th>
                          <th className="py-2 px-3 text-right text-muted font-medium">Bolt Cash</th>
                          <th className="py-2 px-3 text-right text-muted font-medium">Card</th>
                          <th className="py-2 px-3 text-left text-muted font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((r) => (
                          <tr key={r.row_num} className={`border-t border-border ${r.error ? 'bg-red-50' : r.cap_warning ? 'bg-amber-50' : ''}`}>
                            <td className="py-2 px-3 text-muted">{r.row_num}</td>
                            <td className="py-2 px-3 text-primary">{r.trip_date}</td>
                            <td className="py-2 px-3 text-right">{r.cash_aed}</td>
                            <td className="py-2 px-3 text-right">{r.uber_cash_aed}</td>
                            <td className="py-2 px-3 text-right">{r.bolt_cash_aed}</td>
                            <td className="py-2 px-3 text-right">{r.card_aed}</td>
                            <td className="py-2 px-3">
                              {r.error ? (
                                <span className="text-danger">{r.error}</span>
                              ) : r.cap_warning ? (
                                <span className="text-warning">{r.cap_warning}</span>
                              ) : (
                                <span className="text-success">OK</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2 mb-4">{apiError}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1"
                  onClick={() => { setShowCsv(false); setCsvPreview(null); setCsvDriverId('') }}>Cancel</Button>
                {csvPreview && validRows.length > 0 && (
                  <Button className="flex-1" loading={csvImporting} onClick={handleCsvImport}>
                    Import {validRows.length} Row{validRows.length !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
