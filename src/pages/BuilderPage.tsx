import { useState } from 'react'
import '../styles/features.scss'

export default function BuilderPage() {
  const [components, setComponents] = useState<any[]>([])

  return (
    <div className="feature-container">

      <main className="feature-content">
        <div className="feature-header">
          <h1>🧱 Component Builder</h1>
          <p>Create and edit SDUI component schemas visually</p>
        </div>

        <div className="feature-grid">
          {/* Builder Canvas */}
          <div className="feature-card feature-card-full">
            <h2>🎨 Canvas</h2>

            <div className="builder-canvas">
              <div className="canvas-placeholder">
                <p style={{ color: 'var(--text-muted)' }}>
                  🖌️ Drag components here to build your UI
                </p>
              </div>
            </div>
          </div>

          {/* Components Panel */}
          <div className="feature-card">
            <h2>📦 Components</h2>

            <div className="components-list">
              {['Container', 'Text', 'Button', 'Image', 'Input', 'Grid'].map((comp) => (
                <div key={comp} className="component-item" draggable>
                  <span>{comp}</span>
                  <button className="btn btn-sm btn-outline">+</button>
                </div>
              ))}
            </div>
          </div>

          {/* JSON Output */}
          <div className="feature-card">
            <h2>📤 JSON Output</h2>

            <div className="json-preview">
              <pre>{JSON.stringify({ type: 'Container', children: [] }, null, 2)}</pre>
            </div>

            <button className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }}>
              📋 Copy JSON
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
