import { useState } from 'react'
import '../styles/features.scss'

interface Template {
  id: string
  name: string
  type: string
  preview: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Product Card',
      type: 'content_info',
      preview: '{ "type": "Card", "items": [...] }',
    },
    {
      id: '2',
      name: 'Ranking List',
      type: 'content_ranking',
      preview: '{ "type": "List", "items": [...] }',
    },
  ])

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  return (
    <div className="feature-container">

      <main className="feature-content">
        <div className="feature-header">
          <h1>🧬 JSON Templates</h1>
          <p>Browse and manage saved JSON schema templates</p>
        </div>

        <div className="feature-grid">
          {/* Templates List */}
          <div className="feature-card">
            <h2>📚 Available Templates</h2>

            <div className="templates-list">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`template-item ${selectedTemplate?.id === tpl.id ? 'active' : ''}`}
                >
                  <div className="template-name">{tpl.name}</div>
                  <div className="template-type">{tpl.type}</div>
                </button>
              ))}
            </div>

            <button className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }}>
              ➕ Save New Template
            </button>
          </div>

          {/* Preview */}
          <div className="feature-card">
            <h2>👁️ Preview</h2>

            {selectedTemplate ? (
              <div className="template-preview">
                <h3>{selectedTemplate.name}</h3>
                <pre>{selectedTemplate.preview}</pre>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }}>
                    📋 Copy
                  </button>
                  <button className="btn btn-outline" style={{ flex: 1 }}>
                    ⬇️ Download
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-muted" style={{ textAlign: 'center', padding: '40px 20px' }}>
                Select a template to preview
              </p>
            )}
          </div>

          {/* Info Card */}
          <div className="feature-card feature-card-full">
            <h2>💡 Template Types</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
              {['content_info', 'content_ranking', 'content', 'custom'].map((type) => (
                <div key={type} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
