import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginModal from './LoginModal'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 64, borderBottom: '1px solid #e2e8f0',
        background: '#fff', position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#3730a3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M14 6l-4 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
            EditorCode
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#3730a3', fontWeight: 600, fontSize: 14 }}>Learning Paths</Link>
          <Link to="/playground" style={{ textDecoration: 'none', color: '#64748b', fontSize: 14 }}>Playground</Link>
          <Link to="/challenges" style={{ textDecoration: 'none', color: '#64748b', fontSize: 14 }}>Challenge Hub</Link>
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </button>

          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#3730a3',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#fff', fontWeight: 700,
                  fontFamily: 'Syne, sans-serif', fontSize: 14,
                }}
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 44, background: '#fff',
                  border: '1px solid #e2e8f0', borderRadius: 12, minWidth: 180,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: 8, zIndex: 200,
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{user?.email}</div>
                  </div>
                  <Link to="/course/python-mastery/modules" onClick={() => setMenuOpen(false)}
                    style={{ display: 'block', padding: '8px 12px', textDecoration: 'none', color: '#0f172a', fontSize: 14, borderRadius: 6 }}>
                    My Courses
                  </Link>
                  <button onClick={handleLogout}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, borderRadius: 6 }}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              style={{
                width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9',
                border: '1px solid #e2e8f0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          )}
        </div>
      </nav>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  )
}
