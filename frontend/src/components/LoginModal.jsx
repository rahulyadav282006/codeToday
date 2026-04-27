import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginModal({ open, onClose, onSuccess }) {
  const { login, register } = useAuth()
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('dev@syntax.io')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('All fields required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (tab === 'register' && !name) { setError('Name is required'); return }

    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password, remember)
      } else {
        await register(email, password, name)
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
      }} />

      {/* Modal */}
      <div style={{
        position: 'relative', background: '#fff', borderRadius: 20,
        width: 380, padding: '32px 32px 28px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        animation: 'fadeIn 0.2s ease',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 28, borderBottom: '1px solid #e2e8f0' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
              color: tab === t ? '#3730a3' : '#94a3b8',
              borderBottom: tab === t ? '2px solid #3730a3' : '2px solid transparent',
              transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
            }}>
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: '#ede9fe',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M14 6l-4 12" stroke="#3730a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22, marginTop: 12, color: '#0f172a' }}>
            {tab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
            {tab === 'login' ? 'Enter your credentials to access the editor.' : 'Start your coding journey today.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: 6, textTransform: 'uppercase' }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                style={inputStyle} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: 6, textTransform: 'uppercase' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input value={email} onChange={e => setEmail(e.target.value)}
                type="email" placeholder="dev@syntax.io"
                style={inputStyle} />
              <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
              {tab === 'login' && <a href="#" style={{ fontSize: 12, color: '#3730a3', textDecoration: 'none' }}>Forgot password?</a>}
            </div>
            <div style={{ position: 'relative' }}>
              <input value={password} onChange={e => setPassword(e.target.value)}
                type={showPass ? 'text' : 'password'} placeholder="••••••••"
                style={inputStyle} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {showPass ? '👁' : '🔒'}
              </button>
            </div>
          </div>

          {tab === 'login' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#3730a3' }} />
              <span style={{ color: '#64748b' }}>Remember for 30 days</span>
            </label>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', background: '#3730a3', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
          }}>
            {loading ? 'Please wait...' : (tab === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '20px 0', position: 'relative' }}>
          <div style={{ height: 1, background: '#e2e8f0' }} />
          <span style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 12px', fontSize: 12, color: '#94a3b8' }}>
            OR CONTINUE WITH
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Google', icon: '⬛' },
            { label: 'GitHub', icon: '<>' },
          ].map(p => (
            <button key={p.label} style={{
              flex: 1, padding: '10px', background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748b' }}>
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#3730a3', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {tab === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </p>

        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
          cursor: 'pointer', color: '#94a3b8', fontSize: 20, lineHeight: 1,
        }}>×</button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10,
  fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif',
  color: '#0f172a', background: '#fafafa',
  transition: 'border-color 0.2s',
}
