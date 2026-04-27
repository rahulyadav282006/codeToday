import React from 'react'
import { useNavigate } from 'react-router-dom'

const STATUS_CONFIG = {
  locked: { badge: 'LOCKED', badgeColor: '#94a3b8', badgeBg: '#f1f5f9', icon: '🔒', btnText: 'Locked', btnDisabled: true, btnStyle: 'disabled' },
  unlocked: { badge: null, badgeColor: null, badgeBg: null, icon: null, btnText: 'Review', btnDisabled: false, btnStyle: 'review' },
  in_progress: { badge: 'IN PROGRESS', badgeColor: '#f97316', badgeBg: '#fff7ed', icon: null, btnText: 'Resume Learning', btnDisabled: false, btnStyle: 'primary' },
  completed: { badge: 'COMPLETED', badgeColor: '#10b981', badgeBg: '#f0fdf4', icon: null, btnText: 'COMPLETED', btnDisabled: true, btnStyle: 'completed' },
}

export default function ModuleCard({ module, courseId, progressPct }) {
  const navigate = useNavigate()
  const config = STATUS_CONFIG[module.status] || STATUS_CONFIG.locked
  const isLocked = module.status === 'locked'

  const handleClick = () => {
    if (isLocked) return
    navigate(`/course/${courseId}/modules/${module.id}/submodules`)
  }

  const getButtonStyle = () => {
    const base = {
      width: '100%', padding: '10px 16px', borderRadius: 8, fontSize: 13,
      fontWeight: 700, cursor: config.btnDisabled ? 'default' : 'pointer',
      border: 'none', marginTop: 12, letterSpacing: '0.03em',
      fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
    }
    if (config.btnStyle === 'primary') return { ...base, background: '#3730a3', color: '#fff' }
    if (config.btnStyle === 'review') return { ...base, background: '#fff', color: '#3730a3', border: '1.5px solid #3730a3' }
    if (config.btnStyle === 'completed') return { ...base, background: '#f0fdf4', color: '#10b981', border: '1.5px solid #bbf7d0' }
    return { ...base, background: '#f8fafc', color: '#94a3b8', border: '1.5px solid #e2e8f0' }
  }

  return (
    <div style={{
      background: module.status === 'in_progress' ? '#fafafa' : '#fff',
      border: `1.5px solid ${module.status === 'in_progress' ? '#3730a3' : '#e2e8f0'}`,
      borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden',
      opacity: isLocked ? 0.75 : 1,
      transition: 'all 0.2s',
    }}>
      {/* Top row: icon + badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: module.status === 'in_progress' ? '#ede9fe' : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          {isLocked ? '📁' : module.icon || '📋'}
        </div>
        {config.badge && (
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
            color: config.badgeColor, background: config.badgeBg,
            padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {isLocked && '🔒 '}{config.badge}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>
        {module.title}
      </h3>

      {/* Description */}
      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 12 }}>
        {module.description}
      </p>

      {/* Progress bar for in_progress */}
      {module.status === 'in_progress' && progressPct !== undefined && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: '#3730a3', borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 11, color: '#3730a3', fontWeight: 700, marginTop: 4 }}>{progressPct}% COMPLETE</div>
        </div>
      )}

      {/* Meta */}
      {module.status !== 'in_progress' && (
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
          {isLocked
            ? <span style={{ color: '#f97316', fontSize: 12 }}>⚠ REQUIRES {module.prerequisite?.toUpperCase() || 'PREVIOUS MODULE'} COMPLETION</span>
            : `${module.total_lessons} Lessons • ${Math.floor(module.estimated_minutes / 60)}h ${module.estimated_minutes % 60}m`
          }
        </div>
      )}

      <button onClick={handleClick} style={getButtonStyle()} disabled={config.btnDisabled}>
        {config.btnText}
      </button>
    </div>
  )
}
