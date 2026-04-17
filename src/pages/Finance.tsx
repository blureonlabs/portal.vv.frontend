import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Pagination } from '../components/ui/Pagination'
import { TableRowSkeleton } from '../components/ui/Skeleton'
import { useAuthStore } from '../store/authStore'
import { formatDate, formatAed } from '../lib/utils'
import type { Driver, Expense, CashHandover, ExpenseCategory } from '../types'

const CURRENT_MONTH_START = new Date()
CURRENT_MONTH_START.setDate(1)
const today = new Date().toISOString().slice(0, 10)
const monthStart = CURRENT_MONTH_START.toISOString().slice(0, 10)

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'toll', label: 'Toll' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'fines', label: 'Fines' },
  { value: 'other', label: 'Other' },
]

function categoryBadge(c: string) {
  const m: Record<string, 'default' | 'warning' | 'danger' | 'muted'> = {
    fuel: 'warning', maintenance: 'default', toll: 'muted', insurance: 'success' as any, fines: 'danger', other: 'muted',
  }
  return m[c] ?? 'muted'
}

const expenseSchema = z.object({
  driver_id: z.string().optional(),
  amount_aed: z.coerce.number().positive('Required'),
  category: z.enum(['fuel', 'maintenance', 'toll', 'insurance', 'fines', 'other']),
  date: z.string().min(1, 'Required'),
  notes: z.string().optional(),
})
type ExpenseForm = z.infer<typeof expenseSchema>

const handoverSchema = z.object({
  driver_id: z.string().uuid('Select driver'),
  amount_aed: z.coerce.number().positive('Required'),
})
type HandoverForm = z.infer<typeof handoverSchema>

type Tab = 'expenses' | 'handovers'

export default function Finance() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const canManage = user?.role === 'super_admin' || user?.role === 'accountant'

  const [tab, setTab] = useState<Tab>('expenses')
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [driverFilter, setDriverFilter] = useState('')
  const [showExpense, setShowExpense] = useState(false)
  const [showHandover, setShowHandover] = useState(false)
  const [apiError, setApiError] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptUploading, setReceiptUploading] = useState(false)
  const [expensePage, setExpensePage] = useState(1)
  const [handoverPage, setHandoverPage] = useState(1)
  const PAGE_SIZE = 25

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
    enabled: canManage,
  })

  const buildParams = () => {
    const p = new URLSearchParams({ from, to })
    if (driverFilter) p.set('driver_id', driverFilter)
    return p.toString()
  }

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', from, to, driverFilter],
    queryFn: () => apiGet(`/finance/expenses?${buildParams()}`),
    enabled: tab === 'expenses',
  })

  const { data: handovers = [], isLoading: handoversLoading } = useQuery<CashHandover[]>({
    queryKey: ['handovers', from, to, driverFilter],
    queryFn: () => apiGet(`/finance/handovers?${buildParams()}`),
    enabled: tab === 'handovers',
  })

  const expenseForm = useForm<ExpenseForm, any, ExpenseForm>({
    resolver: zodResolver(expenseSchema) as never,
    defaultValues: { date: today, category: 'fuel' },
  })

  const handoverForm = useForm<HandoverForm, any, HandoverForm>({
    resolver: zodResolver(handoverSchema) as never,
  })

  const addExpenseMutation = useMutation({
    mutationFn: (body: ExpenseForm) => apiPost('/finance/expenses', {
      ...body,
      driver_id: body.driver_id || null,
      receipt_url: receiptUrl || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      setShowExpense(false)
      setReceiptUrl('')
      expenseForm.reset()
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const addHandoverMutation = useMutation({
    mutationFn: (body: HandoverForm) => apiPost('/finance/handovers', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['handovers'] }); setShowHandover(false); handoverForm.reset() },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const driverOptions = [
    { value: '', label: 'All drivers' },
    ...drivers.map((d) => ({ value: d.id, label: d.full_name })),
  ]

  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount_aed), 0)
  const totalHandovers = handovers.reduce((s, h) => s + parseFloat(h.amount_aed), 0)

  const expenseTotalPages = Math.ceil(expenses.length / PAGE_SIZE)
  const pagedExpenses = expenses.slice((expensePage - 1) * PAGE_SIZE, expensePage * PAGE_SIZE)

  const handoverTotalPages = Math.ceil(handovers.length / PAGE_SIZE)
  const pagedHandovers = handovers.slice((handoverPage - 1) * PAGE_SIZE, handoverPage * PAGE_SIZE)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Finance</h1>
          <p className="text-sm text-muted mt-1">Expenses & Cash Handovers</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowHandover(true); setApiError('') }}>
              <span className="material-symbols-rounded text-[16px]">handshake</span>
              Record Handover
            </Button>
            <Button onClick={() => { setShowExpense(true); setApiError('') }}>
              <span className="material-symbols-rounded text-[16px]">add</span>
              Add Expense
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {([['expenses', 'Expenses'], ['handovers', 'Cash Handovers']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-white text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-white text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
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

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted mb-1">Total Expenses</p>
          <p className="text-lg font-bold text-danger">{formatAed(totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted mb-1">Cash Handovers</p>
          <p className="text-lg font-bold text-success">{formatAed(totalHandovers)}</p>
        </div>
      </div>

      {/* Expenses tab */}
      {tab === 'expenses' && (
        expensesLoading ? (
          <div className="bg-white rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted font-medium">Date</th>
                  {canManage && <th className="text-left py-3 px-4 text-muted font-medium">Driver</th>}
                  <th className="text-left py-3 px-4 text-muted font-medium">Category</th>
                  <th className="text-right py-3 px-4 text-muted font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-muted font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={canManage ? 5 : 4} />
                ))}
              </tbody>
            </table>
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-muted text-sm text-center py-12">No expenses in this range.</p>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted font-medium">Date</th>
                    {canManage && <th className="text-left py-3 px-4 text-muted font-medium">Driver</th>}
                    <th className="text-left py-3 px-4 text-muted font-medium">Category</th>
                    <th className="text-right py-3 px-4 text-muted font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-muted font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedExpenses.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                      <td className="py-3 px-4 text-primary">{formatDate(e.date)}</td>
                      {canManage && <td className="py-3 px-4 text-muted">{e.driver_name ?? '—'}</td>}
                      <td className="py-3 px-4">
                        <Badge variant={categoryBadge(e.category)}>{e.category}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-danger">{formatAed(parseFloat(e.amount_aed))}</td>
                      <td className="py-3 px-4 text-muted truncate max-w-xs">{e.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={expensePage} totalPages={expenseTotalPages} onPageChange={setExpensePage} />
          </>
        )
      )}

      {/* Handovers tab */}
      {tab === 'handovers' && (
        handoversLoading ? (
          <div className="bg-white rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-muted font-medium">Driver</th>
                  <th className="text-right py-3 px-4 text-muted font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-muted font-medium">Verified By</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={4} />
                ))}
              </tbody>
            </table>
          </div>
        ) : handovers.length === 0 ? (
          <p className="text-muted text-sm text-center py-12">No cash handovers in this range.</p>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-muted font-medium">Driver</th>
                    <th className="text-right py-3 px-4 text-muted font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-muted font-medium">Verified By</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedHandovers.map((h) => (
                    <tr key={h.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                      <td className="py-3 px-4 text-primary">{formatDate(h.submitted_at)}</td>
                      <td className="py-3 px-4 font-medium text-primary">{h.driver_name}</td>
                      <td className="py-3 px-4 text-right font-semibold text-success">{formatAed(parseFloat(h.amount_aed))}</td>
                      <td className="py-3 px-4 text-muted">{h.verifier_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={handoverPage} totalPages={handoverTotalPages} onPageChange={setHandoverPage} />
          </>
        )
      )}

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setShowExpense(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-6">Add Expense</h2>
              <form onSubmit={expenseForm.handleSubmit((d: ExpenseForm) => { setApiError(''); addExpenseMutation.mutate(d) })}
                className="flex flex-col gap-4">
                <Select id="exp-driver" label="Driver (optional)"
                  options={[{ value: '', label: 'General (no driver)' }, ...drivers.map((d) => ({ value: d.id, label: d.full_name }))]}
                  {...expenseForm.register('driver_id')} />
                <div className="grid grid-cols-2 gap-3">
                  <Input id="exp-amount" label="Amount (AED)" type="number" step="0.01"
                    error={expenseForm.formState.errors.amount_aed?.message}
                    {...expenseForm.register('amount_aed')} />
                  <Input id="exp-date" label="Date" type="date"
                    error={expenseForm.formState.errors.date?.message}
                    {...expenseForm.register('date')} />
                </div>
                <Select id="exp-cat" label="Category"
                  options={EXPENSE_CATEGORIES}
                  error={expenseForm.formState.errors.category?.message}
                  {...expenseForm.register('category')} />
                <Input id="exp-notes" label="Notes (optional)" {...expenseForm.register('notes')} />
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Receipt (optional)</label>
                  <input
                    id="exp-receipt"
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full text-sm text-primary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-xs file:font-medium file:bg-surface file:text-primary hover:file:bg-accent-light cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setReceiptUploading(true)
                      setApiError('')
                      try {
                        const { supabase } = await import('../lib/supabase')
                        const uuid = crypto.randomUUID()
                        const path = `receipts/${uuid}/${file.name}`
                        const { error } = await supabase.storage
                          .from('fms-files')
                          .upload(path, file, { upsert: true })
                        if (error) throw new Error(error.message)
                        const { data: urlData } = supabase.storage.from('fms-files').getPublicUrl(path)
                        setReceiptUrl(urlData.publicUrl)
                      } catch (err) {
                        setApiError(err instanceof Error ? err.message : 'Receipt upload failed')
                      } finally {
                        setReceiptUploading(false)
                      }
                    }}
                  />
                  {receiptUploading && (
                    <p className="text-xs text-muted mt-1 flex items-center gap-1">
                      <span className="material-symbols-rounded text-[14px] animate-spin">progress_activity</span>
                      Uploading receipt…
                    </p>
                  )}
                  {receiptUrl && !receiptUploading && (
                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                      <span className="material-symbols-rounded text-[14px]">check_circle</span>
                      Receipt uploaded
                    </p>
                  )}
                </div>
                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}
                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowExpense(false)}>Cancel</Button>
                  <Button type="submit" loading={addExpenseMutation.isPending || receiptUploading} className="flex-1">Add Expense</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Handover Modal */}
      <AnimatePresence>
        {showHandover && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setShowHandover(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-1">Record Cash Handover</h2>
              <p className="text-sm text-muted mb-6">Driver submits cash to you now.</p>
              <form onSubmit={handoverForm.handleSubmit((d: HandoverForm) => { setApiError(''); addHandoverMutation.mutate(d) })}
                className="flex flex-col gap-4">
                <Select id="hov-driver" label="Driver"
                  options={[{ value: '', label: 'Select driver…' }, ...drivers.map((d) => ({ value: d.id, label: d.full_name }))]}
                  error={handoverForm.formState.errors.driver_id?.message}
                  {...handoverForm.register('driver_id')} />
                <Input id="hov-amount" label="Amount (AED)" type="number" step="0.01"
                  error={handoverForm.formState.errors.amount_aed?.message}
                  {...handoverForm.register('amount_aed')} />
                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}
                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowHandover(false)}>Cancel</Button>
                  <Button type="submit" loading={addHandoverMutation.isPending} className="flex-1">Record</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
