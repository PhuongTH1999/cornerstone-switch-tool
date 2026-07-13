import { useState } from 'react'
import Navbar from '../components/Navbar'
import '../styles/features.css'

export default function PluginPage() {
  const [flavor, setFlavor] = useState('marketing_sdui')
  const [notes, setNotes] = useState('')

  return (
    <div className="feature-container">
      <Navbar />

      <main className="feature-content">
        <div className="feature-header">
          <h1>🧩 Figma Plugin Architect</h1>
          <p>Export plugin configurations and manage architecture</p>
        </div>

        <div className="feature-grid">
          {/* Config Card */}
          <div className="feature-card">
            <h2>⚙️ Plugin Configuration</h2>

            <form className="feature-form">
              <div className="form-group">
                <label>Platform Flavor</label>
                <select
                  value={flavor}
                  onChange={(e) => setFlavor(e.target.value)}
                  className="form-input"
                >
                  <option value="marketing_sdui">🎁 Marketing Platform — SDUI Native</option>
                  <option value="promotion_rn">💸 Promotion Hub — React Native</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Campaign Spring 2026"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary">
                ⬇️ Export Plugin ZIP
              </button>
            </form>
          </div>

          {/* Info Card */}
          <div className="feature-card">
            <h2>📖 How it works</h2>

            <div className="info-section">
              <ol style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                <li>Select your platform flavor</li>
                <li>Add optional notes</li>
                <li>Click Export to download ZIP</li>
                <li>Unzip and load manifest.json in Figma</li>
              </ol>
            </div>
          </div>

          {/* Features Grid */}
          <div className="feature-card feature-card-full">
            <h2>✨ Available Flavors</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
              {[
                { name: '🎁 Marketing SDUI', desc: 'Native implementation with SDUI' },
                { name: '💸 Promotion RN', desc: 'React Native implementation' },
              ].map((f) => (
                <div key={f.name} style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>{f.name}</h4>
                  <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-muted)' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
