import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginModal from '../components/LoginModal'

const COURSES = [
  {
    id: 'python-mastery',
    slug: 'python-mastery',
    icon: '⬛',
    iconBg: '#f1f5f9',
    iconColor: '#3730a3',
    label: null,
    title: 'Python Mastery',
    description: 'From data science foundations to building powerful backend APIs with FastAPI.',
    cta: 'EXPLORE PATH',
    featured: false,
  },
  {
    id: 'core-javascript',
    slug: 'core-javascript',
    icon: 'JS',
    iconBg: '#fff7ed',
    iconColor: '#f97316',
    label: 'JS',
    title: 'Core JavaScript',
    description: 'Understand the engine behind the web. Async, closures, and modern ES2024 features.',
    cta: 'EXPLORE PATH',
    featured: false,
  },
  {
    id: 'frontend-engineering',
    slug: 'frontend-engineering',
    icon: '⊞',
    iconBg: '#3730a3',
    iconColor: '#fff',
    label: null,
    title: 'Frontend Engineering',
    description: 'Master React, Tailwind CSS, and Framer Motion to build stunning, responsive user interfaces.',
    cta: 'EXPLORE PATH',
    featured: true,
  },
]

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [pendingCourse, setPendingCourse] = useState(null)

const handleExplorePath = (course) => {
  navigate(`/course/${course.slug}/modules`)
}
  const handleLoginSuccess = () => {
    if (pendingCourse) navigate(`/course/${pendingCourse.slug}/modules`)
  }

  const steps = [
    { n: '01', title: 'Understand the Problem', desc: 'Analyze requirements and clarify objectives before writing a single line.' },
    { n: '02', title: 'Plan Your Solution', desc: 'Design the architecture with pseudocode and data flow diagrams.' },
    { n: '03', title: 'Write Your Code', desc: 'Implement clean, readable code following best practices.' },
    { n: '04', title: 'Test and Debug', desc: 'Validate your solution with edge cases and systematic debugging.' },
    { n: '05', title: 'Optimize and Refine', desc: 'Improve performance, readability, and maintainability.' },
  ]

  return (
    <div>
      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        <div style={{ animation: 'fadeIn 0.6s ease' }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 56,
            lineHeight: 1.1, color: '#0f172a', marginBottom: 20,
          }}>
            Code Your<br />Future,{' '}
            <span style={{ color: '#3730a3' }}>Guided Step-<br />by-Step.</span>
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 32, maxWidth: 460 }}>
            Master the world's most in-demand languages through interactive coding challenges, editorial-grade lessons, and a vibrant community of builders. Learning has never felt this premium.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => navigate('/course/python-mastery/modules')}
              style={{
                padding: '14px 28px', background: '#3730a3', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                boxShadow: '0 4px 20px rgba(55,48,163,0.3)', transition: 'all 0.2s',
              }}>
              Start Learning
            </button>
            <button style={{
              padding: '14px 28px', background: '#fff', color: '#3730a3',
              border: '1.5px solid #3730a3', borderRadius: 10, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>
              View Curriculum
            </button>
          </div>
        </div>

        {/* Code preview card */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 24,
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
            width: '100%', maxWidth: 400,
          }}>
            <div style={{ background: '#0f172a', borderRadius: 12, padding: '20px 24px', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {['#ef4444','#f59e0b','#10b981'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ color: '#94a3b8' }}>{'function launchCareer() {'}</div>
              <div style={{ color: '#c4b5fd', paddingLeft: 20 }}>{'const skills = ['}<span style={{ color: '#86efac' }}>'React', 'Python', 'Go'</span>{'];'}</div>
              <div style={{ color: '#c4b5fd', paddingLeft: 20 }}>{'const mentor = '}<span style={{ color: '#38bdf8' }}>EditorCode</span>{'.guided();'}</div>
              <div style={{ height: 10 }} />
              <div style={{ color: '#94a3b8', paddingLeft: 20 }}>{'return skills.map(skill => {'}</div>
              <div style={{ color: '#c4b5fd', paddingLeft: 40 }}>{'return mentor.master(skill);'}</div>
              <div style={{ color: '#94a3b8', paddingLeft: 20 }}>{'})'}</div>
              <div style={{ color: '#94a3b8' }}>{'}'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-step process */}
      <section style={{ background: '#f8fafc', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, textAlign: 'center', marginBottom: 48, color: '#0f172a' }}>
            Our Learning Method
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', background: '#3730a3',
                  color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  {step.n}
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 8 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Learning Paths */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, color: '#0f172a', marginBottom: 8 }}>
          Popular Learning Paths
        </h2>
        <p style={{ color: '#64748b', marginBottom: 48, fontSize: 15 }}>
          Curated journeys designed to take you from hello world to<br />production-ready code in weeks, not years.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, gridTemplateRows: 'auto auto' }}>
          {/* Python Mastery */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, margin: 4 }}>
            <div style={{ width: 44, height: 44, background: '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>⌨️</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 10 }}>Python Mastery</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              From data science foundations to building powerful backend APIs with FastAPI.
            </p>
            <button onClick={() => handleExplorePath(COURSES[0])} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#3730a3', color: '#fff', border: 'none',
              padding: '10px 20px', borderRadius: 8, fontSize: 12, fontWeight: 800,
              cursor: 'pointer', letterSpacing: '0.05em',
            }}>
              EXPLORE PATH →
            </button>
          </div>

          {/* Core JavaScript */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, margin: 4 }}>
            <div style={{ width: 44, height: 44, background: '#fff7ed', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: '#f97316' }}>JS</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 10 }}>Core JavaScript</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Understand the engine behind the web. Async, closures, and modern ES2024 features.
            </p>
            <button onClick={() => handleExplorePath(COURSES[1])} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', color: '#f97316', border: 'none',
              padding: '10px 0', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', letterSpacing: '0.05em',
            }}>
              EXPLORE PATH →
            </button>
          </div>

          {/* Frontend Engineering - Featured */}
          <div style={{ background: '#3730a3', borderRadius: 16, padding: 28, margin: 4, color: '#fff' }}>
            <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>⊞</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 10, color: '#fff' }}>Frontend Engineering</h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Master React, Tailwind CSS, and Framer Motion to build stunning, responsive user interfaces.
            </p>
            <button onClick={() => handleExplorePath(COURSES[2])} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', color: '#fff', border: 'none',
              padding: '10px 0', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', letterSpacing: '0.05em',
            }}>
              EXPLORE PATH →
            </button>
          </div>

          {/* Cloud & DevOps - Coming Soon */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, margin: 4, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 12, background: 'linear-gradient(135deg, #06b6d4, #3730a3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🌐</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3730a3" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#3730a3', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Coming Soon</span>
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Cloud & DevOps</h3>
              <p style={{ color: '#64748b', fontSize: 13 }}>Learn Docker, Kubernetes, and AWS deployment strategies to scale your code to millions.</p>
              <button style={{ background: 'none', border: 'none', color: '#3730a3', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: 8 }}>Notify me when live</button>
            </div>
          </div>

          {/* 94% stat card */}
          <div style={{ background: '#06b6d4', borderRadius: 16, padding: 28, margin: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 52, color: '#fff' }}>94%</div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 8 }}>
              Completion rate compared to industry standards.
            </div>
          </div>
        </div>
      </section>

      {/* Ready to transform */}
      <section style={{ padding: '0 32px 80px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', background: '#3730a3', borderRadius: 20, padding: '60px 48px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, color: '#fff', marginBottom: 16 }}>
            Ready to transform your code?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 32, fontSize: 15 }}>
            Join the new standard of developer education. Start your first lesson today for free—no credit card required.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button onClick={() => isAuthenticated ? navigate('/course/python-mastery/modules') : setShowLogin(true)}
              style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Get Started for Free
            </button>
            <button style={{ padding: '14px 28px', background: '#fff', color: '#3730a3', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Talk to a Mentor
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '60px 32px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr', gap: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 9l-4 3 4 3M16 9l4 3-4 3M14 6l-4 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>EditorCode</span>
            </div>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              Elevating developer education through premium syntax and guided mastery.
            </p>
            <div style={{ display: 'flex', gap: 16, fontSize: 18 }}>
              <span style={{ cursor: 'pointer' }}>🔊</span>
              <span style={{ cursor: 'pointer' }}>✳️</span>
              <span style={{ cursor: 'pointer' }}>♾️</span>
            </div>
          </div>

          {[
            { title: 'Resources', links: ['Documentation', 'API Reference', 'Community Forum', 'Support Center'] },
            { title: 'Company', links: ['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'] },
          ].map(col => (
            <div key={col.title}>
              <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#3730a3', marginBottom: 20 }}>{col.title}</h4>
              {col.links.map(l => <div key={l} style={{ marginBottom: 12, fontSize: 14, color: '#64748b', cursor: 'pointer' }}>{l}</div>)}
            </div>
          ))}

          <div>
            <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#3730a3', marginBottom: 8 }}>Newsletter</h4>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
              Weekly coding insights and course updates delivered to your inbox.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Enter your email" style={{
                flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif',
              }} />
              <button style={{ background: '#3730a3', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}>→</button>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />
    </div>
  )
}



//  30 4 20 26


  // const handleExplorePath = (course) => {
  //   if (!isAuthenticated) {
  //     setPendingCourse(course)
  //     setShowLogin(true)
  //   } else {
  //     navigate(`/course/${course.slug}/modules`)
  //   }
  // }



  //    82 hero section        <button onClick={() => isAuthenticated ? navigate('/course/python-mastery/modules') : setShowLogin(true)}
