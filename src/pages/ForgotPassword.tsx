import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { LOGO_URL } from '../lib/supabase'
import { apiPost } from '../lib/api'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await apiPost('/auth/forgot-password', { email: data.email })
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center max-w-sm w-full"
        >
          <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="font-bold text-primary text-lg mb-2">Check your inbox</h2>
          <p className="text-sm text-muted mb-6">
            If an account exists for that email, you'll receive a reset link shortly.
          </p>
          <Link to="/login" className="text-sm text-accent hover:underline">
            Back to login
          </Link>
        </motion.div>
      </div>
    )
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
            <h1 className="text-xl font-bold text-primary">Reset Password</h1>
            <p className="text-sm text-muted mt-1 text-center">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            {error && (
              <p className="text-sm text-danger bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Send Reset Link
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-muted hover:text-primary">
              Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
