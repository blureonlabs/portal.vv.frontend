import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  session: { access_token: string } | null
  setSession: (session: { access_token: string } | null) => void
  setUser: (user: User | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      clear: () => set({ user: null, session: null }),
    }),
    {
      name: 'fms-auth',
      partialize: (state) => ({ session: state.session, user: state.user }),
    }
  )
)
