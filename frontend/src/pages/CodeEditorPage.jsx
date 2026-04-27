import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import api from '../services/api'
import { useProgress } from '../context/ProgressContext'

export default function CodeEditorPage() {
  const { courseId, moduleId, lessonId } = useParams()
  const navigate = useNavigate()
  const { updateLessonComplete, sendHeartbeat } = useProgress()
  const [lesson, setLesson] = useState(null)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const [outputMatches, setOutputMatches] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const startTime = useRef(Date.now())
  const heartbeatRef = useRef(null)

  useEffect(() => {
    const loadLesson = async () => {
      try {
        const res = await api.get(`/courses/lessons/${lessonId}`)
        setLesson(res.data)
        setCode(res.data.starter_code || '# Write your code here\n')
      } catch (err) {
        console.error(err)
      }
    }
    loadLesson()

    // Heartbeat every 30s
    heartbeatRef.current = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime.current) / 1000)
      sendHeartbeat({ courseId, moduleId, lessonId, elapsedSeconds: elapsed })
    }, 30000)

    return () => {
      clearInterval(heartbeatRef.current)
    }
  }, [lessonId])

  const runCode = async () => {
    setRunning(true)
    setOutput('')
    setError('')
    setOutputMatches(false)
    try {
      const res = await api.post('/code/execute', {
        code, language: 'python', expectedOutput: lesson?.expected_output
      })
      const { output: out, error: err, matches } = res.data
      setOutput(out || '')
      setError(err || '')
      setOutputMatches(matches)
    } catch (e) {
      setError('Execution failed: ' + (e.response?.data?.error || e.message))
    }
    setRunning(false)
  }

  const markComplete = async () => {
    if (!outputMatches || completing) return
    setCompleting(true)
    const elapsed = Math.round((Date.now() - startTime.current) / 1000)
    try {
      await updateLessonComplete({
        courseId, moduleId,
        submoduleId: lesson?.submodule_id,
        lessonId, timeSpentSeconds: elapsed
      })
      setCompleted(true)
      setTimeout(() => navigate(`/course/${courseId}/modules/${moduleId}/submodules`), 1500)
    } catch (err) {
      console.error(err)
    }
    setCompleting(false)
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* LEFT PANEL - Lesson content */}
      <div style={{ width: '48%', overflowY: 'auto', padding: '28px 32px', borderRight: '1px solid #e2e8f0', background: '#fff' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Python Fundamentals › <span style={{ color: '#3730a3' }}>Module 4: Lists</span>
        </div>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 30, marginBottom: 16, lineHeight: 1.2 }}>
          Mastering <em style={{ color: '#3730a3', fontStyle: 'italic' }}>Python{' '}
          {lesson?.title?.split(' ').slice(-1)[0] || 'Lists'}</em>
        </h1>

        <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          {lesson?.description || "Lists are Python's most versatile compound data type. Used to group together other values, a list is a collection which is ordered and changeable. In Python, lists are written with square brackets."}
        </p>

        {/* Core Concepts */}
        {lesson?.core_concepts?.length > 0 && (
          <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#3b82f6', textTransform: 'uppercase', marginBottom: 12 }}>
              Core Concepts
            </div>
            {lesson.core_concepts.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: '#3b82f6', marginTop: 2 }}>✓</span>
                <span dangerouslySetInnerHTML={{ __html: c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            ))}
          </div>
        )}

        {/* Syntax Reference */}
        {lesson?.syntax_reference && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
              Syntax Reference
            </div>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {lesson.syntax_reference}
            </div>
          </div>
        )}

        {/* Lab Challenge */}
        {lesson?.lab_challenge && (
          <div style={{ background: '#fef9ec', border: '1px solid #fde68a', borderRadius: 10, padding: '16px 20px', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span>💡</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Lab Challenge</span>
            </div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: lesson.lab_challenge.replace(/`(.*?)`/g, '<code style="background:#fde68a;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </div>
        )}

        {/* Mark Complete */}
        <button
          onClick={markComplete}
          disabled={!outputMatches || completing || completed}
          style={{
            width: '100%', padding: '13px', borderRadius: 10,
            background: completed ? '#10b981' : outputMatches ? '#3730a3' : '#e2e8f0',
            color: outputMatches || completed ? '#fff' : '#94a3b8',
            border: 'none', fontSize: 14, fontWeight: 700,
            cursor: outputMatches && !completed ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s', fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {completed ? '✓ Completed!' : completing ? 'Saving...' : 'Mark Complete'}
        </button>
        {!outputMatches && !completed && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
            Run your code and match the expected output to mark as complete.
          </p>
        )}
      </div>

      {/* RIGHT PANEL - Code workspace */}
      <div style={{ width: '52%', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
        {/* Editor header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#ef4444','#f59e0b','#10b981'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>MAIN.PY</span>
          </div>
          <button
            onClick={runCode}
            disabled={running}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#3730a3', color: '#fff', border: 'none',
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.7 : 1,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {running ? '⟳ Running...' : '▶ Run Code'}
          </button>
        </div>

        {/* Monaco Editor */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={val => setCode(val || '')}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              folding: true,
              automaticLayout: true,
              tabSize: 4,
            }}
          />
        </div>

        {/* Output console */}
        <div style={{ height: 160, borderTop: '1px solid #1e293b', background: '#0a0f1a', padding: '12px 20px', overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Output Console
          </div>
          {output && (
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0', marginBottom: 8, whiteSpace: 'pre-wrap' }}>
              <span style={{ color: '#64748b' }}>$ python3 main.py</span>
              <br />
              {output}
            </div>
          )}
          {error && (
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#ef4444', whiteSpace: 'pre-wrap' }}>
              {error}
            </div>
          )}
          {outputMatches && (
            <div style={{
              background: '#064e3b', border: '1px solid #10b981', borderRadius: 8,
              padding: '8px 14px', color: '#10b981', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ✓ Well done! Task completed successfully.
            </div>
          )}
          {!output && !error && (
            <div style={{ color: '#334155', fontFamily: 'monospace', fontSize: 13 }}>
              {'> '}Run your code to see output here...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
