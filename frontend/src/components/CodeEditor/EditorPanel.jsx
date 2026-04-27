import React from 'react'
import Editor from '@monaco-editor/react'

export default function EditorPanel({ code, onChange, language = 'python' }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(val) => onChange(val || '')}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          folding: true,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'on',
          padding: { top: 16 },
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
        }}
      />
    </div>
  )
}
