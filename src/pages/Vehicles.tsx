import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost, apiPut } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CardSkeleton } from '../components/ui/Skeleton'
import { useAuthStore } from '../store/authStore'
import { formatDate } from '../lib/utils'
import type { Driver, Owner, Vehicle } from '../types'

const vehicleSchema = z.object({
  plate_number: z.string().min(1, 'Required'),
  make: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  year: z.coerce.number().int().min(2000).max(2030),
  color: z.string().optional(),
  registration_date: z.string().optional(),
  registration_expiry: z.string().optional(),
  insurance_expiry: z.string().optional(),
  owner_id: z.string().optional(),
})

type VehicleForm = z.infer<typeof vehicleSchema>

function insuranceDaysLeft(expiry: string | null): number | null {
  if (!expiry) return null
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000)
}

function statusVariant(status: string) {
  const m = { available: 'success' as const, assigned: 'default' as const, inactive: 'muted' as const }
  return m[status as keyof typeof m] ?? 'muted'
}

export default function Vehicles() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [assignVehicle, setAssignVehicle] = useState<Vehicle | null>(null)
  const [selectedDriver, setSelectedDriver] = useState('')
  const [apiError, setApiError] = useState('')
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [confirmMsg, setConfirmMsg] = useState('')
  const isSuperAdmin = user?.role === 'super_admin'
  const canAssign = isSuperAdmin || user?.role === 'hr'

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: () => apiGet('/vehicles'),
  })

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
    enabled: !!assignVehicle,
  })

  const { data: owners = [] } = useQuery<Owner[]>({
    queryKey: ['owners'],
    queryFn: () => apiGet('/owners'),
    enabled: showCreate || !!editVehicle,
  })

  const filtered = vehicles.filter((v) =>
    v.plate_number.toLowerCase().includes(search.toLowerCase()) ||
    v.make.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  )

  const form = useForm<VehicleForm, any, VehicleForm>({
    resolver: zodResolver(vehicleSchema) as never,
    defaultValues: { year: new Date().getFullYear() },
  })

  const createMutation = useMutation({
    mutationFn: (body: VehicleForm) => apiPost('/vehicles', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); setShowCreate(false); form.reset() },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: VehicleForm }) => apiPut(`/vehicles/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); setEditVehicle(null) },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, driver_id }: { id: string; driver_id: string }) =>
      apiPost(`/vehicles/${id}/assign`, { driver_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); setAssignVehicle(null); setSelectedDriver('') },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const unassignMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/vehicles/${id}/unassign`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  const openEdit = (v: Vehicle) => {
    setEditVehicle(v)
    setApiError('')
    form.reset({
      plate_number: v.plate_number,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color ?? '',
      registration_date: v.registration_date ?? '',
      registration_expiry: v.registration_expiry ?? '',
      insurance_expiry: v.insurance_expiry ?? '',
      owner_id: (v as any).owner_id ?? '',
    })
  }

  const availableDrivers = drivers.filter((d) => d.is_active)

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Vehicles</h1>
          <p className="text-sm text-muted mt-1">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in fleet</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => { setShowCreate(true); setApiError(''); form.reset() }}>
            <span className="material-symbols-rounded text-[16px]">add</span>
            Add Vehicle
          </Button>
        )}
      </div>

      <div className="relative mb-6 max-w-sm">
        <span className="material-symbols-rounded text-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-muted">search</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plate, make, model…"
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-white text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehiclesLoading && Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        {!vehiclesLoading && filtered.length === 0 && (
          <p className="col-span-full text-center text-muted py-12 text-sm">
            {search ? 'No vehicles match your search' : 'No vehicles yet'}
          </p>
        )}
        {!vehiclesLoading && filtered.map((v) => {
          const insLeft = insuranceDaysLeft(v.insurance_expiry)
          const insuranceAlert = insLeft !== null && insLeft <= 30

          return (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-rounded text-[20px] text-muted">directions_car</span>
                  </div>
                  <div>
                    <Link to={`/vehicles/${v.id}`} className="font-semibold text-primary hover:text-accent transition-colors">
                      {v.plate_number}
                    </Link>
                    <p className="text-xs text-muted">{v.make} {v.model} · {v.year}</p>
                  </div>
                </div>
                <Badge variant={statusVariant(v.status)}>{v.status}</Badge>
              </div>

              {v.assigned_driver_name && (
                <p className="text-xs text-muted">Driver: <span className="text-primary">{v.assigned_driver_name}</span></p>
              )}

              {insuranceAlert && (
                <div className="flex items-center gap-1.5 text-xs text-warning bg-amber-50 rounded-lg px-2.5 py-1.5">
                  <span className="material-symbols-rounded text-[14px] flex-shrink-0">warning</span>
                  Insurance expires {insLeft! <= 0 ? 'NOW' : `in ${insLeft}d`} ({v.insurance_expiry && formatDate(v.insurance_expiry)})
                </div>
              )}

              {v.insurance_expiry && !insuranceAlert && (
                <p className="text-xs text-muted">Insurance: <span className="text-primary">{formatDate(v.insurance_expiry)}</span></p>
              )}

              <div className="flex gap-2 pt-1 border-t border-border mt-1">
                {(isSuperAdmin || user?.role === 'accountant') && (
                  <button onClick={() => openEdit(v)} className="flex-1 text-xs text-muted hover:text-primary transition-colors py-1">
                    Edit
                  </button>
                )}
                {canAssign && v.status === 'available' && (
                  <button
                    onClick={() => { setAssignVehicle(v); setApiError('') }}
                    className="flex-1 text-xs text-accent hover:text-indigo-700 transition-colors py-1"
                  >
                    Assign Driver
                  </button>
                )}
                {canAssign && v.status === 'assigned' && (
                  <button
                    onClick={() => {
                      setConfirmMsg(`Unassign ${v.assigned_driver_name ?? 'the driver'} from ${v.plate_number}?`)
                      setConfirmAction(() => () => unassignMutation.mutate(v.id))
                    }}
                    className="flex-1 text-xs text-danger hover:text-red-700 transition-colors py-1"
                  >
                    Unassign
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        title="Unassign Vehicle"
        message={confirmMsg}
        confirmLabel="Unassign"
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmAction(null) }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Create / Edit Modal (shared form) */}
      <AnimatePresence>
        {(showCreate || editVehicle) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => { setShowCreate(false); setEditVehicle(null) }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-lg font-bold text-primary mb-6">
                {editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
              </h2>

              <form
                onSubmit={form.handleSubmit((d: VehicleForm) => {
                  setApiError('')
                  if (editVehicle) {
                    updateMutation.mutate({ id: editVehicle.id, body: d })
                  } else {
                    createMutation.mutate(d)
                  }
                })}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Input id="plate" label="Plate Number" placeholder="ABC-1234"
                    error={form.formState.errors.plate_number?.message}
                    {...form.register('plate_number')} />
                  <Input id="year" label="Year" type="number"
                    error={form.formState.errors.year?.message}
                    {...form.register('year')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input id="make" label="Make" placeholder="Toyota"
                    error={form.formState.errors.make?.message}
                    {...form.register('make')} />
                  <Input id="model" label="Model" placeholder="Camry"
                    error={form.formState.errors.model?.message}
                    {...form.register('model')} />
                </div>
                <Input id="color" label="Color" placeholder="White (optional)"
                  {...form.register('color')} />
                <div className="grid grid-cols-2 gap-3">
                  <Input id="reg_date" label="Registration Date" type="date"
                    {...form.register('registration_date')} />
                  <Input id="reg_exp" label="Registration Expiry" type="date"
                    {...form.register('registration_expiry')} />
                </div>
                <Input id="ins_exp" label="Insurance Expiry" type="date"
                  {...form.register('insurance_expiry')} />

                <Select
                  id="owner_id"
                  label="Owner (optional)"
                  options={[
                    { value: '', label: 'Company Owned' },
                    ...owners.map((o) => ({
                      value: o.id,
                      label: o.company_name ? `${o.full_name} — ${o.company_name}` : o.full_name,
                    })),
                  ]}
                  {...form.register('owner_id')}
                />

                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}

                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => { setShowCreate(false); setEditVehicle(null) }}>Cancel</Button>
                  <Button type="submit" loading={createMutation.isPending || updateMutation.isPending} className="flex-1">
                    {editVehicle ? 'Save Changes' : 'Add Vehicle'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Driver Modal */}
      <AnimatePresence>
        {assignVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setAssignVehicle(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-1">Assign Driver</h2>
              <p className="text-sm text-muted mb-6">{assignVehicle.plate_number} — {assignVehicle.make} {assignVehicle.model}</p>

              <div className="flex flex-col gap-4">
                <Select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  placeholder="Select driver…"
                  options={[
                    { value: '', label: 'Select driver…' },
                    ...availableDrivers.map((d) => ({ value: d.id, label: d.full_name })),
                  ]}
                />

                {apiError && <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setAssignVehicle(null)}>Cancel</Button>
                  <Button
                    className="flex-1"
                    disabled={!selectedDriver}
                    loading={assignMutation.isPending}
                    onClick={() => {
                      setApiError('')
                      assignMutation.mutate({ id: assignVehicle.id, driver_id: selectedDriver })
                    }}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
