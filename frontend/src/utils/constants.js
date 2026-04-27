export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
 
export const COURSE_IDS = {
  PYTHON_MASTERY: 'python-mastery',
  CORE_JAVASCRIPT: 'core-javascript',
  FRONTEND_ENGINEERING: 'frontend-engineering',
}
 
export const MODULE_STATUS = {
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
}
 
export const LESSON_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
}
 
export const TOKEN_REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24 hours
 
export const HEARTBEAT_INTERVAL_MS = 30 * 1000 // 30 seconds
 
export const CODE_EXECUTION_TIMEOUT = 10000 // 10 seconds
 