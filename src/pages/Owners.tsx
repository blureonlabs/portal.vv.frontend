import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost, apiPut } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { useAuthStore } from '../store/authStore'
import type { Owner } from '../types'

const createSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters'),
  full_name: z.string().min(2, 'Required'),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  notes: z.string().optional(),
})

type CreateForm = z.infer<typeof createSchema>

export default function Owners() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [apiError, setApiError] = useState('')
  const isSuperAdmin = user?.role === 'super_admin'

  const { data: owners = [] } = useQuery<Owner[]>({
    queryKey: ['owners'],
    queryFn: () => apiGet('/owners'),
  })

  const filtered = owners.filter((o) =>
    o.full_name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase()) ||
    (o.company_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const createMutation = useMutation({
    mutationFn: (body: CreateForm) => apiPost('/owners/create-with-account', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['owners'] }); setShowCreate(false); createForm.reset() },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiPut(`/owners/${id}/deactivate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owners'] }),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiPut(`/owners/${id}/activate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owners'] }),
  })

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema) as never,
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Owners</h1>
          <p className="text-sm text-muted mt-1">{owners.length} registered owner{owners.length !== 1 ? 's' : ''}</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => { setShowCreate(true); setApiError('') }}>
            <span className="material-symbols-rounded text-[16px]">person_add</span>
            Add Owner
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <span className="material-symbols-rounded text-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-muted">search</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, company..."
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-white text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Owner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted py-12 text-sm">
            {search ? 'No owners match your search' : 'No owners yet'}
          </p>
        )}
        {filtered.map((owner) => (
          <motion.div
            key={owner.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold text-sm">
                    {owner.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-primary">{owner.full_name}</p>
                  <p className="text-xs text-muted">{owner.email}</p>
                </div>
              </div>
              <Badge variant={owner.is_active ? 'success' : 'danger'}>
                {owner.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="text-xs text-muted space-y-1">
              {owner.phone && (
                <p>Phone: <span className="text-primary">{owner.phone}</span></p>
              )}
              {owner.company_name && (
                <p>Company: <span className="text-primary">{owner.company_name}</span></p>
              )}
            </div>

            {isSuperAdmin && (
              <div className="flex gap-2 pt-1 border-t border-border mt-1">
                {owner.is_active ? (
                  <button
                    onClick={() => deactivateMutation.mutate(owner.id)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-danger hover:text-red-700 transition-colors py-1"
                  >
                    <span className="material-symbols-rounded text-[12px]">person_off</span> Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => activateMutation.mutate(owner.id)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-success hover:text-green-700 transition-colors py-1"
                  >
                    <span className="material-symbols-rounded text-[12px]">how_to_reg</span> Activate
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-1">Add Owner</h2>
              <p className="text-sm text-muted mb-6">Create a new owner account with login credentials.</p>

              <form onSubmit={createForm.handleSubmit((d) => { setApiError(''); createMutation.mutate(d) })} className="flex flex-col gap-4">
                <Input id="email" label="Email" type="email" placeholder="owner@example.com"
                  error={createForm.formState.errors.email?.message}
                  {...createForm.register('email')} />
                <Input id="password" label="Password" type="password" placeholder="Min 8 characters"
                  error={createForm.formState.errors.password?.message}
                  {...createForm.register('password')} />
                <Input id="full_name" label="Full Name" placeholder="John Smith"
                  error={createForm.formState.errors.full_name?.message}
                  {...createForm.register('full_name')} />
                <Input id="phone" label="Phone" placeholder="+971 50 123 4567"
                  error={createForm.formState.errors.phone?.message}
                  {...createForm.register('phone')} />
                <Input id="company_name" label="Company Name" placeholder="Optional"
                  error={createForm.formState.errors.company_name?.message}
                  {...createForm.register('company_name')} />
                <Input id="notes" label="Notes" placeholder="Optional notes"
                  error={createForm.formState.errors.notes?.message}
                  {...createForm.register('notes')} />

                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}

                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button type="submit" loading={createMutation.isPending} className="flex-1">Add Owner</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
