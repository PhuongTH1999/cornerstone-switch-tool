import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/navbar.scss'

// Same key and default as the pre-paint script in index.html.
const THEME_KEY = 'cornerstone-theme'

// 18px line icons, matching the App Store header.
const ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  sdui: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></>,
  docs: <><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2.5Z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H19" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  admin: <path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Z" />,
  logout: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5M15 12H3" /></>,
}

function Icon({ name }: { name: keyof typeof ICONS }) {
  return <svg className="navbar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name]}</svg>
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark')

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
    try { localStorage.setItem(THEME_KEY, newTheme) } catch { /* private mode: theme just isn't remembered */ }
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const initial = user?.username?.charAt(0).toUpperCase()
  const navClass = ({ isActive }: { isActive: boolean }) => `navbar-item${isActive ? ' active' : ''}`

  return (
    <nav className="navbar">
      {/* Left: Brand + Navigation */}
      <div className="navbar-left">
        <Link to="/" className="navbar-brand-link">
          <div className="navbar-brand">
            <img src="/assets/logo.svg" alt="" className="navbar-logo" />
            <span className="navbar-title">
              Cornerstone
              <small>MSERVICE • INTERNAL</small>
            </span>
          </div>
        </Link>

        <NavLink to="/dashboard" className={navClass}><Icon name="dashboard" /> Dashboard</NavLink>
        <NavLink to="/sdui" className={navClass}><Icon name="sdui" /> SDUI</NavLink>
        {/* <Link to="/tools" className="navbar-item">🛠️ Flow Tools</Link> */}
        <NavLink to="/docs" className={navClass}><Icon name="docs" /> Docs</NavLink>
      </div>

      {/* Center: Spacer */}
      <div className="navbar-center"></div>

      {/* Right: Theme + User */}
      <div className="navbar-right">
        <button
          className="navbar-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <Icon name={theme === 'light' ? 'moon' : 'sun'} />
        </button>

        <div className="user-dropdown">
          <button
            className="user-button"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            title={user?.username}
            aria-haspopup="menu"
            aria-expanded={isUserDropdownOpen}
          >
            <div className="user-avatar">{initial}</div>
            <div className="user-info-compact">
              <span className="user-name">{user?.username}</span>
              <span className={`user-role badge-${user?.role}`}>{user?.role}</span>
            </div>
          </button>

          {isUserDropdownOpen && (
            <div className="dropdown-menu" role="menu">
              <div className="dropdown-header">
                <div className="dropdown-user-info">
                  <div className="dropdown-avatar">{initial}</div>
                  <div>
                    <div className="dropdown-username">{user?.username}</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <button className="dropdown-item" role="menuitem" onClick={() => handleNavigate('/profile')}>
                <Icon name="profile" /> Edit Profile
              </button>

              {user?.role === 'admin' && (
                <button className="dropdown-item" role="menuitem" onClick={() => handleNavigate('/admin')}>
                  <Icon name="admin" /> Admin Dashboard
                </button>
              )}

              <div className="dropdown-divider"></div>

              <button className="dropdown-item danger" role="menuitem" onClick={handleLogout}>
                <Icon name="logout" /> Sign Out
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
