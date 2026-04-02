import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Search, UserCheck, UserX } from 'lucide-react'
import { apiGet, apiPost, apiPut } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { useAuthStore } from '../store/authStore'
import type { Driver, User } from '../types'

const SALARY_OPTIONS = [
  { value: 'commission', label: 'Commission (30%)' },
  { value: 'target_high', label: 'Target High (AED 12,300)' },
  { value: 'target_low', label: 'Target Low (AED 6,600)' },
]

const createSchema = z.object({
  profile_id: z.string().uuid('Select a user'),
  nationality: z.string().min(2, 'Required'),
  salary_type: z.enum(['commission', 'target_high', 'target_low']),
})

const editSchema = z.object({
  nationality: z.string().min(2, 'Required'),
  salary_type: z.enum(['commission', 'target_high', 'target_low']),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

function salaryLabel(s: string) {
  return SALARY_OPTIONS.find((o) => o.value === s)?.label ?? s
}

export default function Drivers() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editDriver, setEditDriver] = useState<Driver | null>(null)
  const [apiError, setApiError] = useState('')
  const isSuperAdmin = user?.role === 'super_admin'

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
  })

  // Fetch users to populate "select driver profile" dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => apiGet('/users'),
    enabled: showCreate,
  })

  const filtered = drivers.filter((d) =>
    d.full_name.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase()) ||
    d.nationality.toLowerCase().includes(search.toLowerCase())
  )

  const createMutation = useMutation({
    mutationFn: (body: CreateForm) => apiPost('/drivers', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); setShowCreate(false); createForm.reset() },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: EditForm }) => apiPut(`/drivers/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); setEditDriver(null) },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiPut(`/drivers/${id}/deactivate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiPut(`/drivers/${id}/activate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  })

  const selfEntryMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      apiPut(`/drivers/${id}/self-entry`, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  })

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { salary_type: 'commission' },
  })

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  })

  // Profiles that don't already have a driver record
  const driverProfileIds = new Set(drivers.map((d) => d.profile_id))
  const availableProfiles = users.filter(
    (u) => u.role === 'driver' && !driverProfileIds.has(u.id)
  )

  const onEdit = (driver: Driver) => {
    setEditDriver(driver)
    setApiError('')
    editForm.reset({ nationality: driver.nationality, salary_type: driver.salary_type })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Drivers</h1>
          <p className="text-sm text-muted mt-1">{drivers.length} registered driver{drivers.length !== 1 ? 's' : ''}</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => { setShowCreate(true); setApiError('') }}>
            <UserPlus className="h-4 w-4" />
            Add Driver
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, nationality…"
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-white text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Driver Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted py-12 text-sm">
            {search ? 'No drivers match your search' : 'No drivers yet'}
          </p>
        )}
        {filtered.map((driver) => (
          <motion.div
            key={driver.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold text-sm">
                    {driver.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <Link to={`/drivers/${driver.id}`} className="font-semibold text-primary hover:text-accent transition-colors">
                    {driver.full_name}
                  </Link>
                  <p className="text-xs text-muted">{driver.email}</p>
                </div>
              </div>
              <Badge variant={driver.is_active ? 'success' : 'danger'}>
                {driver.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="text-xs text-muted space-y-1">
              <p>Nationality: <span className="text-primary">{driver.nationality}</span></p>
              <p>Salary: <span className="text-primary">{salaryLabel(driver.salary_type)}</span></p>
              {isSuperAdmin && (
                <div className="flex items-center justify-between pt-1">
                  <span>Self-entry</span>
                  <button
                    onClick={() => selfEntryMutation.mutate({ id: driver.id, enabled: !driver.self_entry_enabled })}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${driver.self_entry_enabled ? 'bg-accent' : 'bg-border'}`}
                  >
                    <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${driver.self_entry_enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              )}
            </div>

            {(isSuperAdmin || user?.role === 'accountant') && (
              <div className="flex gap-2 pt-1 border-t border-border mt-1">
                <button
                  onClick={() => onEdit(driver)}
                  className="flex-1 text-xs text-muted hover:text-primary transition-colors py-1"
                >
                  Edit
                </button>
                {isSuperAdmin && (
                  driver.is_active ? (
                    <button
                      onClick={() => deactivateMutation.mutate(driver.id)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs text-danger hover:text-red-700 transition-colors py-1"
                    >
                      <UserX className="h-3 w-3" /> Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => activateMutation.mutate(driver.id)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs text-success hover:text-green-700 transition-colors py-1"
                    >
                      <UserCheck className="h-3 w-3" /> Activate
                    </button>
                  )
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
              <h2 className="text-lg font-bold text-primary mb-1">Add Driver</h2>
              <p className="text-sm text-muted mb-6">Link an existing driver profile with their settings.</p>

              <form onSubmit={createForm.handleSubmit((d) => { setApiError(''); createMutation.mutate(d) })} className="flex flex-col gap-4">
                <Select
                  id="profile_id"
                  label="Driver User"
                  options={[
                    { value: '', label: 'Select user…' },
                    ...availableProfiles.map((u) => ({ value: u.id, label: `${u.full_name} (${u.email})` }))
                  ]}
                  error={createForm.formState.errors.profile_id?.message}
                  {...createForm.register('profile_id')}
                />
                <Input id="nationality" label="Nationality" placeholder="e.g. Indian"
                  error={createForm.formState.errors.nationality?.message}
                  {...createForm.register('nationality')} />
                <Select id="salary_type" label="Salary Type" options={SALARY_OPTIONS}
                  error={createForm.formState.errors.salary_type?.message}
                  {...createForm.register('salary_type')} />

                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}

                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button type="submit" loading={createMutation.isPending} className="flex-1">Add Driver</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setEditDriver(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-1">Edit Driver</h2>
              <p className="text-sm text-muted mb-6">{editDriver.full_name}</p>

              <form onSubmit={editForm.handleSubmit((d) => { setApiError(''); editMutation.mutate({ id: editDriver.id, body: d }) })} className="flex flex-col gap-4">
                <Input id="edit-nationality" label="Nationality"
                  error={editForm.formState.errors.nationality?.message}
                  {...editForm.register('nationality')} />
                <Select id="edit-salary_type" label="Salary Type" options={SALARY_OPTIONS}
                  error={editForm.formState.errors.salary_type?.message}
                  {...editForm.register('salary_type')} />

                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}

                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setEditDriver(null)}>Cancel</Button>
                  <Button type="submit" loading={editMutation.isPending} className="flex-1">Save Changes</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
