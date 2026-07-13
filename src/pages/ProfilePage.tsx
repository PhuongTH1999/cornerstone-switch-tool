import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import '../styles/profile.css'

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    // TODO: Implement update profile API
    setIsEditing(false)
  }

  return (
    <div className="profile-container">
      <Navbar />

      <main className="profile-content">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p className="subtitle">Manage your account settings</p>
        </div>

        <div className="profile-grid">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Account Information</h2>
              {!isEditing && (
                <button
                  className="btn btn-outline"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form className="profile-form">
                <div className="form-group">
                  <label>User ID</label>
                  <input type="text" value={user?.id} disabled className="form-input-disabled" />
                </div>

                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">User ID:</span>
                  <span className="info-value">{user?.id}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Username:</span>
                  <span className="info-value">{user?.username}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Role:</span>
                  <span className={`badge badge-${user?.role}`}>{user?.role}</span>
                </div>
              </div>
            )}
          </div>

          {/* Security Card */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Security</h2>
            </div>

            <div className="security-section">
              <div className="security-item">
                <div className="security-info">
                  <h3>Password</h3>
                  <p>Change your password regularly to keep your account secure</p>
                </div>
                <button className="btn btn-outline" disabled>
                  Change Password (Soon)
                </button>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <h3>Active Sessions</h3>
                  <p>Manage your active login sessions</p>
                </div>
                <button className="btn btn-outline" disabled>
                  View Sessions (Soon)
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
