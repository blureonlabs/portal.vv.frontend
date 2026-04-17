import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { supabase, LOGO_URL } from '../lib/supabase'
import { apiGet } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import type { User } from '../types'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const { setSession, setUser } = useAuthStore()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      setSession({ access_token: auth.session!.access_token })

      const profile = await apiGet<User>('/auth/me')
      setUser(profile)
      navigate('/')
    } catch {
      setError('Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#fefefe] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
          {/* Logo / Brand */}
          <div className="flex flex-col items-center mb-8">
            <img src={LOGO_URL} alt="Voiture Voyages" className="h-14 mb-4" />
            <h1 className="text-xl font-bold text-primary tracking-tight">Voiture Voyages</h1>
            <p className="text-sm text-muted mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <p role="alert" className="text-sm text-danger bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
              Sign in
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-muted hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          &copy; {new Date().getFullYear()} Voiture Voyages
        </p>
      </motion.div>
    </div>
  )
}
