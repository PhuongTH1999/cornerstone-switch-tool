import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavigate = (path: string) => {
    setIsUserDropdownOpen(false)
    navigate(path)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <nav className="navbar">
      {/* Left: Brand + Navigation */}
      <div className="navbar-left">
        <Link to="/" className="navbar-brand-link">
          <div className="navbar-brand">
            <img src="/assets/logo.svg" alt="Cornerstone" className="navbar-logo" />
            <span className="navbar-title">Cornerstone</span>
          </div>
        </Link>

        <Link to="/dashboard" className="navbar-item">📊 Dashboard</Link>
        <Link to="/sdui" className="navbar-item">🔧 SDUI</Link>
        <Link to="/tools" className="navbar-item">🛠️ Flow Tools</Link>
      </div>

      {/* Center: Spacer */}
      <div className="navbar-center"></div>

      {/* Right: Docs + Theme + User */}
      <div className="navbar-right">
        <Link to="/docs" className="navbar-item">📚 Docs</Link>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <div className="user-dropdown">
          <button
            className="user-button"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            title={user?.username}
          >
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info-compact">
              <span className="user-name">{user?.username}</span>
              <span className={`user-role badge-${user?.role}`}>{user?.role}</span>
            </div>
            <span className={`dropdown-arrow ${isUserDropdownOpen ? 'open' : ''}`}>▼</span>
          </button>

          {isUserDropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="dropdown-user-info">
                  <div className="dropdown-avatar">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="dropdown-username">{user?.username}</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <button
                className="dropdown-item"
                onClick={() => handleNavigate('/profile')}
              >
                <span>✏️</span> Edit Profile
              </button>

              {user?.role === 'admin' && (
                <>
                  <button
                    className="dropdown-item"
                    onClick={() => handleNavigate('/admin')}
                  >
                    <span>👑</span> Admin Dashboard
                  </button>
                </>
              )}

              <div className="dropdown-divider"></div>

              <button
                className="dropdown-item danger"
                onClick={handleLogout}
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>

        {isUserDropdownOpen && (
          <div
            className="dropdown-backdrop"
            onClick={() => setIsUserDropdownOpen(false)}
          ></div>
        )}
      </div>
    </nav>
  )
}
