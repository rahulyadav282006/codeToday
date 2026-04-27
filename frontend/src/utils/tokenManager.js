export const tokenManager = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
 
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken)
  },
 
  clearTokens: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('csrf_token')
  },
 
  isExpired: (token) => {
    if (!token) return true
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  },
 
  getExpiresIn: (token) => {
    if (!token) return 0
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 - Date.now()
    } catch {
      return 0
    }
  },
 
  getUserId: (token) => {
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId
    } catch {
      return null
    }
  },
}
 