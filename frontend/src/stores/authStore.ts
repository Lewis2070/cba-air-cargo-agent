import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  department?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, accessToken } = response.data
          localStorage.setItem('token', accessToken)
          set({ user, token: accessToken, isAuthenticated: true })
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message || '网络错误，请检查网络连接'
          console.error('[Auth] Login error:', msg, err?.response?.status)
          throw new Error(msg)
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'cba-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
