import React from 'react'

export default function OutputPanel({ output, error, matches, running }) {
  return (
    <div style={{
      background: '#0a0f1a',
      padding: '12px 20px',
      height: '100%',
      overflowY: 'auto',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#64748b',
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10,
      }}>
        ▸ Output Console
      </div>

      {running && (
        <div style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
          Running...
        </div>
      )}

      {!running && !output && !error && (
        <div style={{ color: '#334155' }}>
          {'> '}Run your code to see output here...
        </div>
      )}

      {output && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: '#64748b', marginBottom: 4 }}>$ python3 main.py</div>
          <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{output}</div>
        </div>
      )}

      {error && (
        <div style={{ color: '#f87171', whiteSpace: 'pre-wrap', marginTop: 8 }}>
          <div style={{ color: '#64748b', marginBottom: 4 }}>stderr:</div>
          {error}
        </div>
      )}

      {matches && (
        <div style={{
          marginTop: 12,
          background: '#064e3b',
          border: '1px solid #10b981',
          borderRadius: 8,
          padding: '8px 14px',
          color: '#10b981',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          ✓ Well done! Task completed successfully.
        </div>
      )}

      {output && !matches && !error && (
        <div style={{
          marginTop: 10,
          background: '#431407',
          border: '1px solid #f97316',
          borderRadius: 8,
          padding: '8px 14px',
          color: '#fb923c',
          fontSize: 12,
        }}>
          Output doesn't match expected. Keep trying!
        </div>
      )}
    </div>
  )
}
