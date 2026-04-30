import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { apiGet } from '../lib/api'
import type { User } from '../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, session, setUser, setSession, clear } = useAuthStore()
  const [loading, setLoading] = useState(!session)

  useEffect(() => {
    // Sync with Supabase session
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error || !data.session) {
          // Invalid/expired refresh token — clear stale token from Supabase storage
          if (error) supabase.auth.signOut()
          clear()
          setLoading(false)
          return
        }
        setSession({ access_token: data.session.access_token })
        if (!user) {
          apiGet<User>('/auth/me')
            .then(setUser)
            .catch(() => clear())
            .finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      })
      .catch(() => {
        // AuthApiError thrown (e.g. Invalid Refresh Token) — force sign out and clear
        supabase.auth.signOut()
        clear()
        setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT' || !s) {
        clear()
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        setSession({ access_token: s.access_token })
      }
    })

    return () => listener.subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  if (!session || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
