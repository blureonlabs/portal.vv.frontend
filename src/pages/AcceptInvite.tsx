import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { LOGO_URL } from '../lib/supabase'
import { apiPost } from '../lib/api'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export default function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (!token) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center max-w-sm w-full">
          <p className="text-danger font-medium">Invalid invite link.</p>
          <p className="text-sm text-muted mt-2">Please use the link from your invitation email.</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center max-w-sm w-full"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-bold text-primary text-lg mb-2">Account created!</h2>
          <p className="text-sm text-muted mb-6">Your account has been set up successfully.</p>
          <Button className="w-full" onClick={() => navigate('/login')}>
            Sign in
          </Button>
        </motion.div>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await apiPost('/auth/accept-invite', {
        token,
        full_name: data.full_name,
        password: data.password,
      })
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
          <div className="flex flex-col items-center mb-8">
            <img src={LOGO_URL} alt="Voiture Voyages" className="h-10 mb-4" />
            <h1 className="text-xl font-bold text-primary">Accept Invitation</h1>
            <p className="text-sm text-muted mt-1">Set up your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              id="full_name"
              label="Full Name"
              placeholder="John Doe"
              error={errors.full_name?.message}
              {...register('full_name')}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              id="confirm_password"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              error={errors.confirm_password?.message}
              {...register('confirm_password')}
            />

            {error && (
              <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Create Account
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
