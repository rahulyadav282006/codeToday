import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading,         setLoading]         = useState(true)
  const refreshTimer = useRef(null)

  // ── helpers ──────────────────────────────────────────────────────────
  const saveSession = (accessToken, refreshToken, userObj) => {
    localStorage.setItem('access_token',  accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user',          JSON.stringify(userObj))
    setUser(userObj)
    setIsAuthenticated(true)
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
    const rt = localStorage.getItem('refresh_token')
    if (!rt) return
    try {
      const { data } = await api.post('/auth/refresh', { refreshToken: rt })
      localStorage.setItem('access_token', data.accessToken)
      if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken)
      scheduleRefresh(data.accessToken)
    } catch {
      clearSession()
    }
  }

  // ── boot: verify stored token ────────────────────────────────────────
  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) { setLoading(false); return }

      try {
        const { data } = await api.get('/auth/verify')
        setUser(data.user)
        setIsAuthenticated(true)
        scheduleRefresh(token)
      } catch (err) {
        if (err.response?.status === 401) {
          await silentRefresh()
        } else {
          clearSession()
        }
      }
      setLoading(false)
    }
    boot()

    return () => clearTimeout(refreshTimer.current)
  }, []) // eslint-disable-line

  // ── public API ───────────────────────────────────────────────────────
  const login = async (email, password, remember = false) => {
    const { data } = await api.post('/auth/login', { email, password, remember })
    saveSession(data.accessToken, data.refreshToken, data.user)
    return data.user
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    clearSession()
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
