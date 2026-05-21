import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Pagination } from '../components/ui/Pagination'
import { formatDate } from '../lib/utils'
import type { Invite, User } from '../types'
import { ChevronRight, Clock, RefreshCw, UserCog, UserPlus, XCircle } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'hr', label: 'HR' },
]

// ── Schemas ───────────────────────────────────────────────────────────────────

// Invite flow for admin roles only
const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  full_name: z.string().min(2, 'Full name required'),
  role: z.enum(['super_admin', 'accountant', 'hr']),
  phone: z.string().optional(),
})

type UserForm = z.infer<typeof inviteSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function roleLabel(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role
}

function inviteStatusVariant(status: Invite['status']) {
  const map = {
    pending: 'warning' as const,
    accepted: 'success' as const,
    revoked: 'danger' as const,
    expired: 'muted' as const,
  }
  return map[status]
}

function expiryCountdown(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UserManagement() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [apiError, setApiError] = useState('')
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [confirmMsg, setConfirmMsg] = useState('')
  const [usersPage, setUsersPage] = useState(1)
  const PAGE_SIZE = 25

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => apiGet('/users'),
  })

  const { data: invites = [] } = useQuery<Invite[]>({
    queryKey: ['invites'],
    queryFn: () => apiGet('/users/invites'),
  })

  // Invite mutation for admin roles
  const inviteMutation = useMutation({
    mutationFn: (body: { email: string; full_name: string; role: string }) =>
      apiPost('/users/invite', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] })
      closeModal()
    },
    onError: (e) => setApiError(e instanceof Error ? e.message : 'Failed'),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiPut(`/users/invites/${id}/revoke`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invites'] }),
  })

  const resendMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/users/invites/${id}/resend`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invites'] }),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({
    resolver: zodResolver(inviteSchema) as never,
    defaultValues: { role: 'super_admin' },
  })

  function closeModal() {
    setShowModal(false)
    setApiError('')
    reset()
  }

  const onSubmit = (data: UserForm) => {
    setApiError('')
    inviteMutation.mutate({
      email: data.email,
      full_name: data.full_name,
      role: data.role,
    })
  }

  const isPending = inviteMutation.isPending || isSubmitting

  const usersTotalPages = Math.ceil(users.length / PAGE_SIZE)
  const pagedUsers = users.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Team</h1>
          <p className="text-sm text-muted mt-1">Manage team members & invitations</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <UserPlus size={16} />
          Add User
        </Button>
      </div>

      {/* Active Users */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Active Members ({users.filter((u) => u.is_active).length})
        </h2>
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          {users.length === 0 ? (
            <p className="text-center text-muted py-8 text-sm">No users yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-surface/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/users/${u.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-primary flex items-center gap-2">
                      {u.full_name}
                      <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-100" />
                    </td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{roleLabel(u.role)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={usersPage} totalPages={usersTotalPages} onPageChange={setUsersPage} />
      </section>

      {/* Pending Invites */}
      <section>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Invitations ({invites.filter((i) => i.status === 'pending').length} pending)
        </h2>
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          {invites.length === 0 ? (
            <p className="text-center text-muted py-8 text-sm">No invitations sent</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Expires</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Sent</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{inv.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{roleLabel(inv.role)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={inviteStatusVariant(inv.status)}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {inv.status === 'pending' && (
                        <span className="flex items-center gap-1 text-warning text-xs">
                          <Clock size={12} />
                          {expiryCountdown(inv.expires_at)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(inv.created_at)}</td>
                    <td className="px-4 py-3">
                      {inv.status === 'pending' && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => resendMutation.mutate(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-primary transition-colors"
                            title="Resend"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmMsg(`Revoke the invitation sent to ${inv.email}? They will no longer be able to accept it.`)
                              setConfirmAction(() => () => revokeMutation.mutate(inv.id))
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-danger transition-colors"
                            title="Revoke"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        title="Revoke Invitation"
        message={confirmMsg}
        confirmLabel="Revoke"
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmAction(null) }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Add User Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center gap-2 mb-1">
                <UserCog size={20} className="text-accent" />
                <h2 className="text-lg font-bold text-primary">Invite Team Member</h2>
              </div>
              <p className="text-sm text-muted mb-6">
                They'll receive a 24-hour invite link by email.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Select
                  id="um-role"
                  label="Role"
                  options={ROLE_OPTIONS}
                  error={errors.role?.message}
                  {...register('role')}
                />

                <Input
                  id="um-email"
                  label="Email Address"
                  type="email"
                  placeholder="user@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  id="um-name"
                  label="Full Name"
                  placeholder="John Doe"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />

                <Input
                  id="um-phone"
                  label="Phone (optional)"
                  type="tel"
                  placeholder="+971 50 000 0000"
                  error={errors.phone?.message}
                  {...register('phone')}
                />

                {apiError && (
                  <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>
                )}

                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={isPending} className="flex-1">
                    Send Invite
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
