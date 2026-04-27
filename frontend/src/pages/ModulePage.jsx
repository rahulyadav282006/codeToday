import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import ModuleCard from '../components/ModuleCard'
import ProgressCard from '../components/ProgressCard'
import api from '../services/api'

const SIDEBAR_ITEMS = [
  { icon: '⊞', label: 'Dashboard', path: '/' },
  { icon: '📚', label: 'My Courses', active: true },
  { icon: '🏆', label: 'Achievements' },
  { icon: '👥', label: 'Community' },
]

export default function ModulePage() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const { currentProgress, refreshProgress } = useProgress()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        const [courseRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          refreshProgress(courseId)
        ])
        setCourse(courseRes.data)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    load()
  }, [courseId])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', color: '#64748b' }}>Loading course...</div>
    </div>
  )

  // Merge progress into modules
  const modulesWithProgress = course?.modules?.map(mod => {
    const progMod = currentProgress?.modules?.find(m => m.id === mod.id)
    return { ...mod, status: progMod?.status || (mod.order === 1 ? 'unlocked' : 'locked') }
  }) || []

  const filteredModules = filter === 'incomplete'
    ? modulesWithProgress.filter(m => m.status !== 'completed')
    : modulesWithProgress

  const mod2Progress = currentProgress?.modules?.find(m => m.id === 'mod_2')
  const mod2Pct = 60 // From seed data

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#fff', borderRight: '1px solid #e2e8f0', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', padding: '0 12px', marginBottom: 8 }}>
            EditorCode
          </div>
          <div style={{ fontSize: 11, color: '#64748b', padding: '0 12px', marginBottom: 20 }}>Developer Education</div>
        </div>
        {SIDEBAR_ITEMS.map(item => (
          <button key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
            background: item.active ? '#ede9fe' : 'none', border: 'none', cursor: 'pointer',
            color: item.active ? '#3730a3' : '#64748b', fontWeight: item.active ? 600 : 400,
            fontSize: 14, textAlign: 'left', width: '100%', marginBottom: 4,
          }}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14, borderRadius: 8 }}>❓ Help</button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, borderRadius: 8 }}>🚪 Logout</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px 40px', background: '#f8fafc', overflow: 'auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#64748b' }}>
          <span style={{ color: '#3730a3', fontWeight: 600 }}>Learning Path</span>
          <span>›</span>
          <span style={{ color: '#3730a3', fontWeight: 600 }}>Learning Paths</span>
          <span>›</span>
          <span style={{ background: '#ede9fe', color: '#3730a3', padding: '2px 8px', borderRadius: 12, fontWeight: 700, fontSize: 11 }}>★ MASTERY TRACK</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
          {/* Left column */}
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 40, marginBottom: 8 }}>
              Mastering <span style={{ color: '#3730a3' }}>Python</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, marginBottom: 28, maxWidth: 560 }}>
              {course?.description || 'From fundamental syntax to industrial-grade web architecture. This path transforms your coding logic into architectural excellence.'}
            </p>

            {/* Thumbnail placeholder */}
            <div style={{ width: 120, height: 80, background: '#e2e8f0', borderRadius: 10, marginBottom: 28 }} />

            <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
              <button style={{
                padding: '12px 24px', background: '#3730a3', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}>
                Continue Lesson
              </button>
              <button style={{
                padding: '12px 24px', background: '#fff', color: '#3730a3',
                border: '1.5px solid #3730a3', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}>
                View Syllabus
              </button>
            </div>

            {/* Course Modules */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22 }}>Course Modules</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {['all', 'incomplete'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: filter === f ? '#3730a3' : '#f1f5f9',
                    color: filter === f ? '#fff' : '#64748b',
                    fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                  }}>
                    {f === 'all' ? 'All' : 'Incomplete'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {filteredModules.map((mod) => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  courseId={courseId}
                  progressPct={mod.id === 'mod_2' ? mod2Pct : undefined}
                />
              ))}
            </div>
          </div>

          {/* Right column - Progress */}
          <ProgressCard progress={currentProgress} />
        </div>
      </div>
    </div>
  )
}
