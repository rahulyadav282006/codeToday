import React from 'react'

export default function ProgressCard({ progress }) {
  const pct = progress?.total_progress_percent ?? 0
  const timeSpent = progress?.time_spent_minutes ?? 0
  const streak = progress?.streak_days ?? 0
  const totalModules = progress?.modules?.length ?? 0
  const completedModules = progress?.modules?.filter(m => m.status === 'completed').length ?? 0

  const hours = Math.floor(timeSpent / 60)
  const mins = timeSpent % 60
  const estRemaining = Math.round((100 - pct) * 2.4)
  const estHrs = Math.floor(estRemaining / 60)
  const estMins = estRemaining % 60

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDash = (pct / 100) * circumference

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
      padding: 24, position: 'sticky', top: 80,
    }}>
      {/* Progress circle */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>
          Current Progress
        </div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
            <circle cx="65" cy="65" r={radius} fill="none" stroke="#3730a3" strokeWidth="10"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 65 65)" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#0f172a' }}>{pct}%</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginTop: 8 }}>
          <span>{totalModules} Modules Total</span>
          <span style={{ color: '#3730a3', fontWeight: 600 }}>{completedModules} Completed</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#3730a3', borderRadius: 3, transition: 'width 0.8s ease' }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <StatBox
          icon="⚡"
          label="Time Spent"
          value={`${hours}.${mins < 10 ? '0' + mins : mins} Hrs`}
          accent="#f59e0b"
        />
        <StatBox
          icon="🔥"
          label="Daily Streak"
          value={`${streak} Days`}
          accent="#ef4444"
        />
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>Estimated Time Remaining</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginTop: 2 }}>
          {estHrs}h {estMins}m
        </div>
      </div>

      {/* AI Challenge Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
        borderRadius: 12, padding: '16px 18px', color: '#fff',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif', marginBottom: 6 }}>
          Join the Python AI Challenge
        </div>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 12 }}>
          Competing developers win limited edition "Snake Charmer" badges and API credits.
        </div>
        <button style={{
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 12,
          cursor: 'pointer', fontWeight: 600,
        }}>
          Join Workshop →
        </button>
      </div>
    </div>
  )
}

function StatBox({ icon, label, value, accent }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{value}</div>
    </div>
  )
}
