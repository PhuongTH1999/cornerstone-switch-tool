import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import IntroductionPage from './pages/IntroductionPage'
import DashboardPage from './pages/DashboardPage'
import DocsPage from './pages/DocsPage'
import ProfilePage from './pages/ProfilePage'
import AdminPanel from './pages/AdminPanel'
import SDUIPage from './pages/SDUIPage'
import ToolsPage from './pages/ToolsPage'
import ProtectedRoute from './components/ProtectedRoute'

function AppContent() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><IntroductionPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/docs" element={<ProtectedRoute><DocsPage /></ProtectedRoute>} />
      <Route path="/sdui" element={<ProtectedRoute><SDUIPage /></ProtectedRoute>} />
      <Route path="/tools" element={<ProtectedRoute><ToolsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
