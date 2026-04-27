import api from './api'
 
export const progressService = {
  getProgress: (userId, courseId) =>
    api.get(`/progress/${userId}/${courseId}`),
 
  completeLesson: (data) =>
    api.post('/progress/lesson/complete', data),
 
  getSubmoduleStatus: (submoduleId, params) =>
    api.get(`/progress/submodule/${submoduleId}/status`, { params }),
 
  getStreak: (userId) =>
    api.get(`/progress/streak/${userId}`),
 
  heartbeat: (data) =>
    api.post('/progress/heartbeat', data),
}
 