import React, { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const { user } = useAuth()
  const [currentProgress, setCurrentProgress] = useState(null)
  const [loading, setLoading] = useState(false)

  const refreshProgress = useCallback(async (courseId = 'python-mastery') => {
    if (!user) return
    setLoading(true)
    try {
      const res = await api.get(`/progress/${user.id}/${courseId}`)
      setCurrentProgress(res.data)
    } catch (err) {
      console.error('Progress fetch failed', err)
    }
    setLoading(false)
  }, [user])

  const updateLessonComplete = async ({ courseId, moduleId, submoduleId, lessonId, timeSpentSeconds }) => {
    if (!user) return
    const res = await api.post('/progress/lesson/complete', {
      userId: user.id, courseId, moduleId, submoduleId, lessonId, timeSpentSeconds
    })
    setCurrentProgress(res.data.progress)
    return res.data
  }

  const sendHeartbeat = async ({ courseId, moduleId, lessonId, elapsedSeconds }) => {
    if (!user) return
    try {
      await api.post('/progress/heartbeat', {
        userId: user.id, courseId, moduleId, lessonId, elapsedSeconds
      })
    } catch {}
  }

  const getModuleStatus = (moduleId) => {
    if (!currentProgress) return 'locked'
    const mod = currentProgress.modules?.find(m => m.id === moduleId)
    return mod?.status || 'locked'
  }

  const getOverallPercentage = () => currentProgress?.total_progress_percent || 0

  return (
    <ProgressContext.Provider value={{
      currentProgress, loading,
      refreshProgress, updateLessonComplete, sendHeartbeat,
      getModuleStatus, getOverallPercentage
    }}>
      {children}
    </ProgressContext.Provider>
  )
}

export const useProgress = () => {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be inside ProgressProvider')
  return ctx
}
