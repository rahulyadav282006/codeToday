import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { getDeviceId } from '../utils/deviceManager'

const AuthContext = createContext(null)

// Global BroadcastChannel for cross-tab auth sync
let BC_AUTH = null

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading,         setLoading]         = useState(true)
  const [remoteLogoutMessage, setRemoteLogoutMessage] = useState(null)
  const refreshTimer = useRef(null)
  const bcRef = useRef(null)

  // ── helpers ──────────────────────────────────────────────────────────
  const saveSession = (accessToken, userObj) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('user', JSON.stringify(userObj))
    setUser(userObj)
    setIsAuthenticated(true)
    setRemoteLogoutMessage(null)
    scheduleRefresh(accessToken)
  }

  const clearSession = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    clearTimeout(refreshTimer.current)
    setUser(null)
    setIsAuthenticated(false)
  }

  const scheduleRefresh = (token) => {
    clearTimeout(refreshTimer.current)
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]))
      const ms = exp * 1000 - Date.now() - 60_000   // 1 min before expiry
      if (ms > 0) {
        refreshTimer.current = setTimeout(silentRefresh, ms)
      }
    } catch {}
  }

  const silentRefresh = async () => {
    try {
      const { data } = await api.post('/auth/refresh')
      if (!data.accessToken) throw new Error('Refresh failed')
      localStorage.setItem('access_token', data.accessToken)
      scheduleRefresh(data.accessToken)
      return data.accessToken
    } catch {
      clearSession()
      return null
    }
  }

  // ── BroadcastChannel setup ───────────────────────────────────────────
  const setupBroadcastChannel = () => {
    try {
      if (!BC_AUTH && typeof BroadcastChannel !== 'undefined') {
        BC_AUTH = new BroadcastChannel('auth_channel')
        bcRef.current = BC_AUTH
        window.BC_AUTH = BC_AUTH  // Global reference for api.js

        BC_AUTH.onmessage = (event) => {
          const msg = event.data
          const currentDeviceId = getDeviceId()

          switch (msg.type) {
            case 'LOGIN':
              // Another tab logged in
              if (msg.device_id !== currentDeviceId) {
                saveSession(msg.token, msg.user)
              }
              break

            case 'LOGOUT':
              // Another tab logged out
              if (msg.device_id !== currentDeviceId) {
                clearSession()
              }
              break

            case 'LOGOUT_REMOTE':
              // Current user was logged out from another device
              clearSession()
              setRemoteLogoutMessage(msg.reason || 'You were logged out from another device')
              break

            case 'REFRESH':
              // Another tab refreshed token - sync if needed
              if (msg.device_id !== currentDeviceId && msg.token) {
                localStorage.setItem('access_token', msg.token)
                scheduleRefresh(msg.token)
              }
              break

            default:
              break
          }
        }
      }
    } catch (error) {
      console.warn('BroadcastChannel not available, falling back to storage events:', error)
      // Fallback to storage events
      window.addEventListener('storage', handleStorageChange)
    }
  }

  // ── Storage events fallback ──────────────────────────────────────────
  const handleStorageChange = (event) => {
    if (event.key === 'access_token') {
      if (!event.newValue) {
        // Token was removed in another tab
        clearSession()
      } else if (event.oldValue !== event.newValue) {
        // Token was updated in another tab, refresh state
        try {
          const user = JSON.parse(localStorage.getItem('user'))
          setUser(user)
          setIsAuthenticated(true)
          scheduleRefresh(event.newValue)
        } catch {
          clearSession()
        }
      }
    }
  }

  // ── boot: verify stored token ────────────────────────────────────────
  useEffect(() => {
    const boot = async () => {
      // Setup cross-tab sync
      setupBroadcastChannel()

      const token = localStorage.getItem('access_token')
      if (!token) { setLoading(false); return }

      try {
        const { data } = await api.get('/auth/verify')
        setUser(data.user)
        setIsAuthenticated(true)
        scheduleRefresh(token)
      } catch (err) {
        if (err.response?.status === 401) {
          const newToken = await silentRefresh()
          if (newToken) {
            try {
              const { data } = await api.get('/auth/verify')
              setUser(data.user)
              setIsAuthenticated(true)
              scheduleRefresh(newToken)
            } catch {
              clearSession()
            }
          }
        } else {
          clearSession()
        }
      }
      setLoading(false)
    }
    boot()

    // Listen for remote logout events from api.js
    const handleRemoteLogout = (event) => {
      clearSession()
      setRemoteLogoutMessage(event.detail?.reason || 'You were logged out from another device')
    }

    window.addEventListener('logout_remote', handleRemoteLogout)

    return () => {
      clearTimeout(refreshTimer.current)
      window.removeEventListener('logout_remote', handleRemoteLogout)
      if (bcRef.current) {
        try {
          bcRef.current.close()
        } catch {}
      }
    }
  }, []) // eslint-disable-line

  // ── public API ───────────────────────────────────────────────────────
  const login = async (email, password, remember = false) => {
    const { data } = await api.post('/auth/login', { email, password, remember })
    const deviceId = getDeviceId()

    saveSession(data.accessToken, data.user)

    // Broadcast login to other tabs
    if (BC_AUTH) {
      try {
        BC_AUTH.postMessage({
          type: 'LOGIN',
          user: data.user,
          token: data.accessToken,
          device_id: deviceId,
          timestamp: Date.now(),
        })
      } catch {}
    }

    return data.user
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    const deviceId = getDeviceId()

    clearSession()

    // Broadcast logout to other tabs
    if (BC_AUTH) {
      try {
        BC_AUTH.postMessage({
          type: 'LOGOUT',
          device_id: deviceId,
          timestamp: Date.now(),
        })
      } catch {}
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}


// 30 4 20 26
// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
// import api from '../services/api'

// const AuthContext = createContext(null)

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null)
//   const [token, setToken] = useState(() => localStorage.getItem('access_token'))
//   const [isAuthenticated, setIsAuthenticated] = useState(false)
//   const [loading, setLoading] = useState(true)

//   const logout = useCallback(async () => {
//     try {
//       if (token) await api.post('/auth/logout')
//     } catch {}
//     localStorage.removeItem('access_token')
//     localStorage.removeItem('refresh_token')
//     localStorage.removeItem('user')
//     setToken(null)
//     setUser(null)
//     setIsAuthenticated(false)
//   }, [token])

//   const refreshToken = useCallback(async () => {
//     const rt = localStorage.getItem('refresh_token')
//     if (!rt) { logout(); return null }
//     try {
//       const res = await api.post('/auth/refresh', { refreshToken: rt })
//       const { accessToken } = res.data
//       localStorage.setItem('access_token', accessToken)
//       setToken(accessToken)
//       return accessToken
//     } catch {
//       logout()
//       return null
//     }
//   }, [logout])

// useEffect(() => {
//   const verify = async () => {
//     const storedToken = localStorage.getItem('access_token');
//     const storedUser = localStorage.getItem('user');

//     if (!storedToken) {
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await api.get('/auth/verify', {
//         headers: {
//           Authorization: `Bearer ${storedToken}`
//         }
//       });

//       setUser(res.data.user);
//       setIsAuthenticated(true);
//       setToken(storedToken);

//     } catch (err) {
//       logout();
//     }

//     setLoading(false);
//   };

//   verify();
// }, []);

//   // Auto-refresh 24h before expiry
//   useEffect(() => {
//     if (!token) return
//     try {
//       const payload = JSON.parse(atob(token.split('.')[1]))
//       const expiresIn = payload.exp * 1000 - Date.now()
//       const refreshIn = expiresIn - 24 * 60 * 60 * 1000
//       if (refreshIn <= 0) { refreshToken(); return }
//       const timer = setTimeout(refreshToken, refreshIn)
//       return () => clearTimeout(timer)
//     } catch {}
//   }, [token, refreshToken])

//   const login = async (email, password, remember = false) => {
//     const res = await api.post('/auth/login', { email, password, remember })
//     const { accessToken, refreshToken: rt, user: u } = res.data
//     localStorage.setItem('access_token', accessToken)
//     localStorage.setItem('refresh_token', rt)
//     localStorage.setItem('user', JSON.stringify(u))
//     setToken(accessToken)
//     setUser(u)
//     setIsAuthenticated(true)
//     return u
//   }

//   const register = async (email, password, name) => {
//     const res = await api.post('/auth/register', { email, password, name })
//     const { accessToken, refreshToken: rt, user: u } = res.data
//     localStorage.setItem('access_token', accessToken)
//     localStorage.setItem('refresh_token', rt)
//     localStorage.setItem('user', JSON.stringify(u))
//     setToken(accessToken)
//     setUser(u)
//     setIsAuthenticated(true)
//     return u
//   }

//   return (
//     <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, register, logout, refreshToken }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export const useAuth = () => {
//   const ctx = useContext(AuthContext)
//   if (!ctx) throw new Error('useAuth must be inside AuthProvider')
//   return ctx
// }



  // useEffect(() => {
  //   const verify = async () => {
  //     const storedToken = localStorage.getItem('access_token')
  //     const storedUser = localStorage.getItem('user')
  //     if (!storedToken) { setLoading(false); return }
  //     try {
  //       const res = await api.get('/auth/verify')
  //       setUser(res.data.user)
  //       setIsAuthenticated(true)
  //       setToken(storedToken)
  //     } catch (err) {
  //       if (err.response?.status === 401) {
  //         const newToken = await refreshToken()
  //         if (newToken) {
  //           setUser(JSON.parse(storedUser || '{}'))
  //           setIsAuthenticated(true)
  //         }
  //       } else {
  //         logout()
  //       }
  //     }
  //     setLoading(false)
  //   }
  //   verify()
  // }, [])
