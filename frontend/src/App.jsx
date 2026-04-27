import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProgressProvider } from './context/ProgressContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import ModulePage from './pages/ModulePage'
import SubModulePage from './pages/SubModulePage'
import CodeEditorPage from './pages/CodeEditorPage'

function AppContent() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/course/:courseId/modules" element={
          <ProtectedRoute><ModulePage /></ProtectedRoute>
        } />
        <Route path="/course/:courseId/modules/:moduleId/submodules" element={
          <ProtectedRoute><SubModulePage /></ProtectedRoute>
        } />
        <Route path="/course/:courseId/modules/:moduleId/lessons/:lessonId" element={
          <ProtectedRoute><CodeEditorPage /></ProtectedRoute>
        } />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <AppContent />
      </ProgressProvider>
    </AuthProvider>
  )
}
