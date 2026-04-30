import axios from 'axios'

// In Docker: frontend container talks to backend container via service name
// In dev: uses localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── attach token ────────────────────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── auto-refresh on 401 ─────────────────────────────────────────────────────
let refreshing = false
let queue = []

api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config
    if (err.response?.status !== 401 || orig._retry) return Promise.reject(err)

    if (refreshing) {
      return new Promise((res, rej) => queue.push({ res, rej }))
        .then(tok => { orig.headers.Authorization = `Bearer ${tok}`; return api(orig) })
    }

    orig._retry = true
    refreshing  = true

    const rt = localStorage.getItem('refresh_token')
    if (!rt) { refreshing = false; return Promise.reject(err) }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: rt })
      localStorage.setItem('access_token', data.accessToken)
      if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken)
      queue.forEach(p => p.res(data.accessToken))
      queue = []
      orig.headers.Authorization = `Bearer ${data.accessToken}`
      return api(orig)
    } catch (e) {
      queue.forEach(p => p.rej(e))
      queue = []
      localStorage.clear()
      return Promise.reject(e)
    } finally {
      refreshing = false
    }
  }
)

export default api







// import axios from 'axios'
 
// const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
 
// const api = axios.create({
//   baseURL: BASE_URL,
//   timeout: 30000,
//   headers: {
//     'Content-Type': 'application/json',
//     'X-Requested-With': 'XMLHttpRequest',
//   }
// })
 
// // Request interceptor - add auth token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('access_token')
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }
//     const csrf = localStorage.getItem('csrf_token')
//     if (csrf) {
//       config.headers['X-CSRF-Token'] = csrf
//     }
//     config.headers['X-Frontend-Origin'] = 'EditorCode-v1.0'
//     return config
//   },
//   (error) => Promise.reject(error)
// )
 
// // Response interceptor - handle 401 with token refresh
// let isRefreshing = false
// let failedQueue = []
 
// const processQueue = (error, token = null) => {
//   failedQueue.forEach(prom => {
//     if (error) prom.reject(error)
//     else prom.resolve(token)
//   })
//   failedQueue = []
// }
 
// api.interceptors.response.use(
//   (response) => {
//     // Store CSRF token if provided
//     const csrf = response.headers['x-csrf-token']
//     if (csrf) localStorage.setItem('csrf_token', csrf)
//     return response
//   },
//   async (error) => {
//     const originalRequest = error.config
 
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject })
//         }).then(token => {
//           originalRequest.headers.Authorization = `Bearer ${token}`
//           return api(originalRequest)
//         }).catch(err => Promise.reject(err))
//       }
 
//       originalRequest._retry = true
//       isRefreshing = true
 
//       const rt = localStorage.getItem('refresh_token')
//       if (!rt) {
//         isRefreshing = false
//         return Promise.reject(error)
//       }
 
//       try {
//         const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: rt })
//         const { accessToken } = res.data
//         localStorage.setItem('access_token', accessToken)
//         api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
//         processQueue(null, accessToken)
//         originalRequest.headers.Authorization = `Bearer ${accessToken}`
//         return api(originalRequest)
//       } catch (refreshError) {
//         processQueue(refreshError, null)
//         localStorage.removeItem('access_token')
//         localStorage.removeItem('refresh_token')
//         window.location.href = '/'
//         return Promise.reject(refreshError)
//       } finally {
//         isRefreshing = false
//       }
//     }
 
//     return Promise.reject(error)
//   }
// )
 
// export default api



// 27 4 20 26
// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api",
// });

// // Attach JWT token automatically to every request
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("access_token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   config.headers["Content-Type"] = "application/json";
//   return config;
// });

// export default api;