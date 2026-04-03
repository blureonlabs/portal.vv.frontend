import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

const schema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

export default function ChangePassword() {
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    setSuccess(false)

    // Re-authenticate with current password first
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user?.email) {
      setError('Could not verify your session. Please sign in again.')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: data.current_password,
    })

    if (signInError) {
      setError('Current password is incorrect.')
      return
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.new_password,
    })

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    reset()
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
              <span className="material-symbols-rounded text-[22px] text-accent">lock</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Change Password</h1>
              <p className="text-sm text-muted">Update your account password</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              id="current_password"
              label="Current Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.current_password?.message}
              {...register('current_password')}
            />

            <Input
              id="new_password"
              label="New Password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              error={errors.new_password?.message}
              {...register('new_password')}
            />

            <Input
              id="confirm_password"
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              autoComplete="new-password"
              error={errors.confirm_password?.message}
              {...register('confirm_password')}
            />

            {error && (
              <p className="text-sm text-danger bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            {success && (
              <div className="flex items-center gap-2 text-sm text-success bg-green-50 rounded-xl px-3 py-2">
                <span className="material-symbols-rounded text-[16px]">check_circle</span>
                Password updated successfully.
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
