import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, RotateCcw, XCircle, Clock } from 'lucide-react'
import { apiGet, apiPost, apiPut } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { formatDate } from '../lib/utils'
import type { Invite, User } from '../types'

// ── Invite form ───────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  full_name: z.string().min(2, 'Full name required'),
  role: z.enum(['super_admin', 'accountant', 'hr', 'driver']),
})
type InviteForm = z.infer<typeof inviteSchema>

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'hr', label: 'HR' },
  { value: 'driver', label: 'Driver' },
]

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
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [apiError, setApiError] = useState('')

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => apiGet('/users'),
  })

  const { data: invites = [] } = useQuery<Invite[]>({
    queryKey: ['invites'],
    queryFn: () => apiGet('/users/invites'),
  })

  const inviteMutation = useMutation({
    mutationFn: (body: InviteForm) => apiPost('/users/invite', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] })
      setShowInviteModal(false)
      reset()
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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'driver' },
  })

  const onInvite = (data: InviteForm) => {
    setApiError('')
    inviteMutation.mutate(data)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Users</h1>
          <p className="text-sm text-muted mt-1">Manage team members and invitations</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Active Users */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Active Members ({users.filter((u) => u.is_active).length})
        </h2>
        <div className="bg-white rounded-xl border border-border overflow-hidden">
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
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{u.full_name}</td>
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
      </section>

      {/* Pending Invites */}
      <section>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Invitations ({invites.filter((i) => i.status === 'pending').length} pending)
        </h2>
        <div className="bg-white rounded-xl border border-border overflow-hidden">
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
                          <Clock className="h-3 w-3" />
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
                            <RotateCcw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => revokeMutation.mutate(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-danger transition-colors"
                            title="Revoke"
                          >
                            <XCircle className="h-4 w-4" />
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

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6"
            >
              <h2 className="text-lg font-bold text-primary mb-1">Invite Team Member</h2>
              <p className="text-sm text-muted mb-6">They'll receive a 24-hour invite link by email.</p>

              <form onSubmit={handleSubmit(onInvite)} className="flex flex-col gap-4">
                <Input
                  id="inv-email"
                  label="Email Address"
                  type="email"
                  placeholder="user@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  id="inv-name"
                  label="Full Name"
                  placeholder="John Doe"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />

                <Select
                  id="inv-role"
                  label="Role"
                  options={ROLE_OPTIONS}
                  error={errors.role?.message}
                  {...register('role')}
                />

                {apiError && (
                  <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{apiError}</p>
                )}

                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSubmitting} className="flex-1">
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
