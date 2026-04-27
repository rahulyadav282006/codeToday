import api from './api'
 
export const authService = {
  login: (email, password, remember = false) =>
    api.post('/auth/login', { email, password, remember }),
 
  register: (email, password, name) =>
    api.post('/auth/register', { email, password, name }),
 
  logout: () => api.post('/auth/logout'),
 
  verify: () => api.get('/auth/verify'),
 
  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }),
 
  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
}
 