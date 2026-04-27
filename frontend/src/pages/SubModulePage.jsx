import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const STATUS_ICON = {
  not_started: '○',
  in_progress: '◐',
  completed: '✓',
}

export default function SubModulePage() {
  const { courseId, moduleId } = useParams()
  const navigate = useNavigate()
  const [moduleData, setModuleData] = useState(null)
  const [progress, setProgress] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [modRes, progRes] = await Promise.all([
          api.get(`/courses/${courseId}/modules/${moduleId}`),
          api.get(`/progress/submodule/${moduleId}/status?courseId=${courseId}`)
        ])
        setModuleData(modRes.data)
        setProgress(progRes.data)
        // Auto-expand first in-progress
        const firstOpen = {}
        modRes.data.submodules?.forEach(sub => {
          if (sub.order === 1) firstOpen[sub.id] = true
        })
        setExpanded(firstOpen)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    load()
  }, [courseId, moduleId])

  const toggle = (subId) => setExpanded(prev => ({ ...prev, [subId]: !prev[subId] }))

  const getSubStatus = (subId) => progress?.submodules?.find(s => s.id === subId)?.status || 'not_started'
  const getLessonStatus = (subId, lesId) => {
    const sub = progress?.submodules?.find(s => s.id === subId)
    return sub?.lessons?.find(l => l.id === lesId)?.status || 'not_started'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', color: '#64748b' }}>Loading...</div>
    </div>
  )

  // Stats
  const totalLessons = moduleData?.submodules?.reduce((a, s) => a + (s.lessons?.length || 0), 0) || 0
  const completedLessons = progress?.submodules?.reduce((a, s) => a + (s.lessons?.filter(l => l.status === 'completed').length || 0), 0) || 0
  const pct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: '#fff', borderRight: '1px solid #e2e8f0', padding: '24px 16px' }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 20 }}>
          <div style={{ color: '#3730a3', fontWeight: 700, marginBottom: 4 }}>Learning Path</div>
          <div>Find Sect 06</div>
        </div>
        {['Dashboard', 'Main Path', 'Settings'].map((item, i) => (
          <button key={item} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 8,
            background: i === 1 ? '#ede9fe' : 'none', border: 'none', cursor: 'pointer',
            color: i === 1 ? '#3730a3' : '#64748b', fontWeight: i === 1 ? 600 : 400,
            fontSize: 13, width: '100%', textAlign: 'left', marginBottom: 4,
          }}>
            {['⊞', '📚', '⚙️'][i]} {item}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '36px 48px', background: '#f8fafc', overflow: 'auto' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
          <span>LEARNING PATH</span> › <span>MASTERING PYTHON SERIES</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ background: '#dbeafe', color: '#3b82f6', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>PYTHON PATH</span>
          <span style={{ background: '#ede9fe', color: '#3730a3', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>MASTERING PYTHON SERIES</span>
        </div>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 38, marginBottom: 8 }}>
          Mastering <span style={{ color: '#3730a3' }}>Python</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, maxWidth: 600 }}>
          {moduleData?.description || 'From foundational syntax to architectural patterns in Django. This curriculum is designed for engineers who demand editorial precision and technical depth.'}
        </p>

        {/* Stats bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 32, background: '#fff',
          border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 24px', marginBottom: 32,
        }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#3730a3' }}>{pct}%</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{completedLessons} of {totalLessons} Lessons</div>
          </div>
          <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#3730a3', borderRadius: 3 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>24h 45m Remaining</div>
          </div>
          <button style={{
            background: '#3730a3', color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            RESUME MODULE 2 →
          </button>
        </div>

        {/* Submodule accordions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {moduleData?.submodules?.map((sub, si) => {
            const subStatus = getSubStatus(sub.id)
            const isCompleted = subStatus === 'completed'
            const isOpen = expanded[sub.id]

            return (
              <div key={sub.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                {/* Submodule header */}
                <button
                  onClick={() => toggle(sub.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                    padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isCompleted ? '#10b981' : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isCompleted ? '#fff' : '#64748b', fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {isCompleted ? '✓' : si + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                      Module {si + 1}: {sub.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub.description}</div>
                  </div>
                  {isCompleted && (
                    <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      MAX COMPLETE
                    </span>
                  )}
                  <span style={{ color: '#94a3b8', fontSize: 18, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
                </button>

                {/* Lessons */}
                {isOpen && (
                  <div style={{ padding: '0 24px 20px' }}>
                    <div style={{ height: 1, background: '#e2e8f0', marginBottom: 16 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {sub.lessons?.map(les => {
                        const lesStatus = getLessonStatus(sub.id, les.id)
                        const icon = STATUS_ICON[lesStatus] || '○'
                        return (
                          <button
                            key={les.id}
                            onClick={() => navigate(`/course/${courseId}/modules/${moduleId}/lessons/${les.id}`)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0',
                              borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                              transition: 'all 0.15s',
                            }}
                          >
                            <span style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: lesStatus === 'completed' ? '#10b981' : '#e2e8f0',
                              color: lesStatus === 'completed' ? '#fff' : '#64748b',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, flexShrink: 0,
                            }}>
                              {icon}
                            </span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{les.title}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>Lesson {les.order}</div>
                            </div>
                            {lesStatus === 'in_progress' && (
                              <span style={{ marginLeft: 'auto', fontSize: 10, background: '#fff7ed', color: '#f97316', padding: '2px 6px', borderRadius: 8, fontWeight: 700 }}>IN DEV</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={() => navigate(`/course/${courseId}/modules`)}
          style={{ marginTop: 32, background: 'none', border: 'none', color: '#3730a3', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
          ← Continue Studies
        </button>
      </div>
    </div>
  )
}
