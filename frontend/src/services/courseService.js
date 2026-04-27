import api from './api'
 
export const courseService = {
  getCourses: () => api.get('/courses/'),
 
  getCourse: (courseId) => api.get(`/courses/${courseId}`),
 
  getModules: (courseId) => api.get(`/courses/${courseId}/modules`),
 
  getModule: (courseId, moduleId) =>
    api.get(`/courses/${courseId}/modules/${moduleId}`),
 
  getLesson: (lessonId) => api.get(`/courses/lessons/${lessonId}`),
}
 