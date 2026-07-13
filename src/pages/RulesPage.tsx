import { useState } from 'react'
import Navbar from '../components/Navbar'
import '../styles/features.css'

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([])

  return (
    <div className="feature-container">
      <Navbar />

      <main className="feature-content">
        <div className="feature-header">
          <h1>📋 Switch Rules</h1>
          <p>Manage native/RN flow rules and configurations</p>
        </div>

        <div className="feature-grid">
          {/* Add Rule Card */}
          <div className="feature-card">
            <h2>➕ Add New Rule</h2>

            <form className="feature-form">
              <div className="form-group">
                <label>Platform</label>
                <select className="form-input">
                  <option value="">Any</option>
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target Flow</label>
                <div className="segment-control">
                  <button type="button" className="segment-btn">⚙️ Native</button>
                  <button type="button" className="segment-btn active-rn">⚛️ React Native</button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                Add Rule
              </button>
            </form>
          </div>

          {/* Rules List */}
          <div className="feature-card feature-card-full">
            <h2>📝 Active Rules</h2>

            {rules.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '40px 20px' }}>
                No rules yet. Add one to get started! 🚀
              </p>
            ) : (
              <div className="rules-table">
                <table>
                  <thead>
                    <tr>
                      <th>Platform</th>
                      <th>Flow</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule, idx) => (
                      <tr key={idx}>
                        <td>{rule.platform}</td>
                        <td>{rule.flow}</td>
                        <td>
                          <button className="btn btn-sm btn-outline">Edit</button>
                          <button className="btn btn-sm btn-outline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
