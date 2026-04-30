import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginModal({ open, onClose, onSuccess }) {
  const { login } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // Reset on open
  useEffect(() => {
    if (open) { setError(''); setLoading(false) }
  }, [open])

  if (!open) return null

  const validate = () => {
    if (!email.trim())              return 'Email is required'
    if (!email.includes('@'))       return 'Enter a valid email address'
    if (password.length < 6)        return 'Password must be at least 6 characters'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      await login(email.trim().toLowerCase(), password, remember)
      onSuccess?.()
      onClose()
    } catch (ex) {
      const msg = ex.response?.data?.message
                  || (ex.code === 'ERR_NETWORK' ? 'Cannot reach server. Is Docker running?' : null)
                  || ex.message
                  || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0, zIndex:999,
          background:'rgba(15,23,42,0.6)', backdropFilter:'blur(6px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        zIndex:1000, width:420, background:'#fff',
        borderRadius:20, padding:'40px 36px 32px',
        boxShadow:'0 32px 80px rgba(0,0,0,0.25)',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position:'absolute', top:14, right:16, background:'none', border:'none',
                   cursor:'pointer', fontSize:24, color:'#94a3b8', lineHeight:1 }}
        >×</button>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            width:56, height:56, borderRadius:16, background:'#ede9fe',
            display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:14,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M14 6l-4 12"
                stroke="#3730a3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ margin:0, fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:24, color:'#0f172a' }}>
            Welcome Back
          </h2>
          <p style={{ margin:'6px 0 0', color:'#64748b', fontSize:14 }}>
            Sign in or create an account automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="you@example.com"
              autoComplete="email"
              style={inp}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom:6 }}>
            <label style={lbl}>Password <span style={{ color:'#94a3b8', fontWeight:400, fontSize:11 }}>(min 6 chars)</span></label>
            <div style={{ position:'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ ...inp, paddingRight:42 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                         background:'none', border:'none', cursor:'pointer',
                         color:'#94a3b8', fontSize:16 }}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Remember */}
          <label style={{ display:'flex', alignItems:'center', gap:8, margin:'12px 0 20px', cursor:'pointer' }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ width:16, height:16, accentColor:'#3730a3', cursor:'pointer' }}
            />
            <span style={{ fontSize:14, color:'#64748b' }}>Remember me for 30 days</span>
          </label>

          {/* Error */}
          {error && (
            <div style={{
              background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10,
              padding:'10px 14px', marginBottom:16, color:'#dc2626',
              fontSize:13, display:'flex', gap:8, alignItems:'flex-start',
            }}>
              <span>⚠</span><span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:'100%', padding:'14px', borderRadius:12,
              background: loading ? '#6366f1' : '#3730a3',
              color:'#fff', border:'none', fontSize:15, fontWeight:700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily:'DM Sans,sans-serif',
              boxShadow:'0 4px 16px rgba(55,48,163,0.35)',
              transition:'background 0.2s',
            }}
          >
            {loading ? '⟳  Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'22px 0' }}>
          <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
          <span style={{ fontSize:12, color:'#94a3b8', whiteSpace:'nowrap' }}>OR CONTINUE WITH</span>
          <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
        </div>

        {/* Social */}
        <div style={{ display:'flex', gap:12, marginBottom:20 }}>
          {[
            { label:'Google', icon:(
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            )},
            { label:'GitHub', icon:(
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#24292e"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            )},
          ].map(({ label, icon }) => (
            <button key={label} style={{
              flex:1, padding:'11px', background:'#fff', border:'1.5px solid #e2e8f0',
              borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:500,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'#374151',
            }}>
              {icon} {label}
            </button>
          ))}
        </div>

        <p style={{ textAlign:'center', fontSize:13, color:'#94a3b8', margin:0 }}>
          No account? <strong style={{ color:'#3730a3' }}>Just sign in — we'll create it for you.</strong>
        </p>
      </div>
    </>
  )
}

const lbl = {
  display:'block', fontSize:11, fontWeight:700, color:'#64748b',
  letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6,
}
const inp = {
  width:'100%', padding:'12px 14px', border:'1.5px solid #e2e8f0',
  borderRadius:10, fontSize:14, outline:'none', color:'#0f172a',
  background:'#fafafa', fontFamily:'DM Sans,sans-serif',
  boxSizing:'border-box', transition:'border-color 0.2s',
}


//  30 4 20 26
// import React, { useState } from 'react'

// import { useAuth } from '../context/AuthContext'

// export default function LoginModal({ open, onClose, onSuccess }) {
//   const { login, register } = useAuth()
//   const [tab, setTab] = useState('login')
//   const [email, setEmail] = useState('dev@syntax.io')
//   const [password, setPassword] = useState('')
//   const [name, setName] = useState('')
//   const [remember, setRemember] = useState(false)
//   const [error, setError] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [showPass, setShowPass] = useState(false)

//   if (!open) return null

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError('')
//     if (!email || !password) { setError('All fields required'); return }
//     if (password.length < 8) { setError('Password must be at least 8 characters'); return }
//     if (tab === 'register' && !name) { setError('Name is required'); return }

//     setLoading(true)
//     try {
//       if (tab === 'login') {
//         await login(email, password, remember)
//       } else {
//         await register(email, password, name)
//       }
//       onSuccess?.()
//       onClose()
//     } catch (err) {
//       setError(err.response?.data?.message || 'Authentication failed')
//     }
//     setLoading(false)
//   }

//   return (
//     <div style={{
//       position: 'fixed', inset: 0, zIndex: 1000,
//       display: 'flex', alignItems: 'center', justifyContent: 'center',
//     }}>
//       {/* Backdrop */}
//       <div onClick={onClose} style={{
//         position: 'absolute', inset: 0,
//         background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
//       }} />

//       {/* Modal */}
//       <div style={{
//         position: 'relative', background: '#fff', borderRadius: 20,
//         width: 380, padding: '32px 32px 28px',
//         boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
//         animation: 'fadeIn 0.2s ease',
//       }}>
//         {/* Tabs */}
//         <div style={{ display: 'flex', marginBottom: 28, borderBottom: '1px solid #e2e8f0' }}>
//           {['login', 'register'].map(t => (
//             <button key={t} onClick={() => { setTab(t); setError('') }} style={{
//               flex: 1, padding: '10px 0', background: 'none', border: 'none',
//               cursor: 'pointer', fontSize: 14, fontWeight: 600,
//               color: tab === t ? '#3730a3' : '#94a3b8',
//               borderBottom: tab === t ? '2px solid #3730a3' : '2px solid transparent',
//               transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
//             }}>
//               {t === 'login' ? 'Sign In' : 'Sign Up'}
//             </button>
//           ))}
//         </div>

//         {/* Icon */}
//         <div style={{ textAlign: 'center', marginBottom: 20 }}>
//           <div style={{
//             width: 52, height: 52, borderRadius: 14, background: '#ede9fe',
//             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
//           }}>
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
//               <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M14 6l-4 12" stroke="#3730a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </div>
//           <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22, marginTop: 12, color: '#0f172a' }}>
//             {tab === 'login' ? 'Welcome Back' : 'Create Account'}
//           </h2>
//           <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
//             {tab === 'login' ? 'Enter your credentials to access the editor.' : 'Start your coding journey today.'}
//           </p>
//         </div>

//         <form onSubmit={handleSubmit}>
//           {tab === 'register' && (
//             <div style={{ marginBottom: 16 }}>
//               <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: 6, textTransform: 'uppercase' }}>Full Name</label>
//               <input value={name} onChange={e => setName(e.target.value)}
//                 placeholder="John Doe"
//                 style={inputStyle} />
//             </div>
//           )}

//           <div style={{ marginBottom: 16 }}>
//             <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: 6, textTransform: 'uppercase' }}>Email Address</label>
//             <div style={{ position: 'relative' }}>
//               <input value={email} onChange={e => setEmail(e.target.value)}
//                 type="email" placeholder="dev@syntax.io"
//                 style={inputStyle} />
//               <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
//                 <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
//               </svg>
//             </div>
//           </div>

//           <div style={{ marginBottom: 20 }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
//               <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
//               {tab === 'login' && <a href="#" style={{ fontSize: 12, color: '#3730a3', textDecoration: 'none' }}>Forgot password?</a>}
//             </div>
//             <div style={{ position: 'relative' }}>
//               <input value={password} onChange={e => setPassword(e.target.value)}
//                 type={showPass ? 'text' : 'password'} placeholder="••••••••"
//                 style={inputStyle} />
//               <button type="button" onClick={() => setShowPass(!showPass)}
//                 style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
//                 {showPass ? '👁' : '🔒'}
//               </button>
//             </div>
//           </div>

//           {tab === 'login' && (
//             <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', fontSize: 14 }}>
//               <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
//                 style={{ width: 16, height: 16, accentColor: '#3730a3' }} />
//               <span style={{ color: '#64748b' }}>Remember for 30 days</span>
//             </label>
//           )}

//           {error && (
//             <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
//               {error}
//             </div>
//           )}

//           <button type="submit" disabled={loading} style={{
//             width: '100%', padding: '13px', background: '#3730a3', color: '#fff',
//             border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
//             cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
//             fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
//           }}>
//             {loading ? 'Please wait...' : (tab === 'login' ? 'Sign In' : 'Create Account')}
//           </button>
//         </form>

//         <div style={{ textAlign: 'center', margin: '20px 0', position: 'relative' }}>
//           <div style={{ height: 1, background: '#e2e8f0' }} />
//           <span style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 12px', fontSize: 12, color: '#94a3b8' }}>
//             OR CONTINUE WITH
//           </span>
//         </div>

//         <div style={{ display: 'flex', gap: 12 }}>
//           {[
//             { label: 'Google', icon: '⬛' },
//             { label: 'GitHub', icon: '<>' },
//           ].map(p => (
//             <button key={p.label} style={{
//               flex: 1, padding: '10px', background: '#fff', border: '1px solid #e2e8f0',
//               borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500,
//               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
//               fontFamily: 'DM Sans, sans-serif',
//             }}>
//               <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{p.icon}</span> {p.label}
//             </button>
//           ))}
//         </div>

//         <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748b' }}>
//           {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
//           <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError('') }}
//             style={{ background: 'none', border: 'none', color: '#3730a3', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
//             {tab === 'login' ? 'Create an account' : 'Sign in'}
//           </button>
//         </p>

//         <button onClick={onClose} style={{
//           position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
//           cursor: 'pointer', color: '#94a3b8', fontSize: 20, lineHeight: 1,
//         }}>×</button>
//       </div>
//     </div>
//   )
// }

// const inputStyle = {
//   width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10,
//   fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif',
//   color: '#0f172a', background: '#fafafa',
//   transition: 'border-color 0.2s',
// }
