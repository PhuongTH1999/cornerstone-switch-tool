import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import '../styles/login.scss'

declare global {
  interface Window {
    google: any
  }
  interface ImportMeta {
    env: Record<string, string>
  }
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  // Load Google SDK
  useEffect(() => {
    if (!googleClientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID not set')
      return
    }

    // Load Google script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
          ux_mode: 'popup',
        })

        // Render button
        const buttonElement = document.getElementById('google-signin-button')
        if (buttonElement) {
          window.google.accounts.id.renderButton(buttonElement, {
            theme: 'outline',
            size: 'large',
            width: '100%',
          })
        }
      }
    }

    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [googleClientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleResponse = async (response: any) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Google response received')

      // Send credential to backend
      const res = await axios.post(`${API_BASE_URL}/auth/google-callback`, {
        token: response.credential,
      })

      const { user, access_token, refresh_token } = res.data

      localStorage.setItem('cornerstone_user', JSON.stringify(user))
      localStorage.setItem('cornerstone_access_token', access_token)
      localStorage.setItem('cornerstone_refresh_token', refresh_token)

      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      // Reload page to trigger AuthContext to load user from localStorage
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    } catch (err: any) {
      console.error('Google login error:', err)
      setError(err.response?.data?.error || 'Google login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src="/assets/logo.svg" alt="Cornerstone" className="login-logo" />
          <h1>Cornerstone</h1>
          <p className="login-subtitle">Flow Rules & SDUI Builder</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="admin or your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        {/* Google Sign-In Button */}
        <div
          id="google-signin-button"
          style={{
            display: 'flex',
            justifyContent: 'center',
            minHeight: '44px',
          }}
        >
          {!googleClientId && (
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              (Google Client ID not configured)
            </p>
          )}
        </div>

        <div className="login-footer">
          <p className="text-muted">Demo Credentials:</p>
          <p className="text-mono">
            <strong>Username:</strong> admin <br />
            <strong>Password:</strong> admin
          </p>
          <p className="text-muted" style={{ marginTop: '16px', fontSize: '12px' }}>
            Google: Login with your Google account (@mservice.com.vn)
          </p>
        </div>
      </div>
    </div>
  )
}
