import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import '../styles/dashboard.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="dashboard-container">
      <Navbar />
      <main className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user?.username}! 👋</h1>
          <p className="welcome-subtitle">Role: <span className={`badge badge-${user?.role}`}>{user?.role}</span></p>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h3>📋 Flow Rules</h3>
            <p>Manage native/RN switch rules and configurations</p>
            <button className="btn btn-outline" onClick={() => navigate('/tools')}>Open Rules</button>
          </div>

          <div className="card">
            <h3>🎨 SDUI Builder</h3>
            <p>Create and edit SDUI component schemas visually</p>
            <button className="btn btn-outline" onClick={() => navigate('/sdui')}>Open Builder</button>
          </div>

          <div className="card">
            <h3>🧱 Plugin Config</h3>
            <p>Export Figma plugin configurations and architecture</p>
            <button className="btn btn-outline">Open Plugin</button>
          </div>

          <div className="card">
            <h3>🧬 JSON Templates</h3>
            <p>Browse and manage saved JSON schema templates</p>
            <button className="btn btn-outline">Open Templates</button>
          </div>
        </div>

        <section className="info-section">
          <h2>System Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">User ID:</span>
              <span className="info-value">{user?.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Role:</span>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
            {user?.created_at && (
              <div className="info-item">
                <span className="info-label">Member Since:</span>
                <span className="info-value">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
