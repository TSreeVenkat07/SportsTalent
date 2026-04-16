import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  godModeToken: null,

  // Initialize from sessionStorage
  init: () => {
    try {
      const token = sessionStorage.getItem('sth_token')
      const user = sessionStorage.getItem('sth_user')
      const godModeToken = sessionStorage.getItem('godmode_token')
      
      // Validate tokens - skip if they are literally the strings "undefined" or "null"
      const cleanToken = (token === 'undefined' || token === 'null') ? null : token
      const cleanGodToken = (godModeToken === 'undefined' || godModeToken === 'null') ? null : godModeToken
      
      if (cleanToken && user) {
        set({
          token: cleanToken,
          user: typeof user === 'string' ? JSON.parse(user) : user,
          isAuthenticated: true,
          isLoading: false,
          godModeToken: cleanGodToken,
        })
      } else {
        // If no user session, also clear ghost god mode tokens
        if (cleanGodToken) sessionStorage.removeItem('godmode_token')
        set({ godModeToken: null, user: null, token: null, isAuthenticated: false, isLoading: false })
      }
    } catch (err) {
      console.error('Auth initialization failed:', err)
      // Clear corrupt data
      sessionStorage.removeItem('sth_token')
      sessionStorage.removeItem('sth_user')
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: (user, token) => {
    sessionStorage.setItem('sth_token', token)
    sessionStorage.setItem('sth_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    sessionStorage.removeItem('sth_token')
    sessionStorage.removeItem('sth_user')
    sessionStorage.removeItem('godmode_token')
    set({ user: null, token: null, isAuthenticated: false, godModeToken: null })
  },

  setGodMode: (token) => {
    if (!token || token === 'undefined' || token === 'null') {
      sessionStorage.removeItem('godmode_token')
      set({ godModeToken: null })
      return
    }
    sessionStorage.setItem('godmode_token', token)
    set({ godModeToken: token })
  },

  hasRole: (roles) => {
    const { user } = get()
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  },

  isGodMode: () => {
    return !!get().godModeToken
  },
}))

export default useAuthStore
