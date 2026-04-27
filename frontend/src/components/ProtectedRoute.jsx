import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginModal from './LoginModal'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const [showModal, setShowModal] = useState(!isAuthenticated)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, color: '#64748b' }}>Loading...</div>
    </div>
  )

  if (!isAuthenticated) {
    return (
      <>
        <Navigate to="/" replace />
        <LoginModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    )
  }

  return children
}
