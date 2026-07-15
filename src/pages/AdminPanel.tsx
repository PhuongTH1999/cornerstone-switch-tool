import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import '../styles/admin.scss'

interface UserItem {
  id: string
  username: string
  email: string
  role: string
}

export default function AdminPanel() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState('guest')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users')
      const fetchedUsers = res.data.users || []

      // Transform database users to UI format
      const transformedUsers: UserItem[] = fetchedUsers.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
      }))

      setUsers(transformedUsers)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail) return

    try {
      await axios.post('/api/admin/update-user-role', {
        user_id: newUserEmail,
        new_role: selectedRole,
        notes: 'Added by owner',
      })

      // Show success message
      setSuccessMessage(`✅ User added successfully!`)
      setTimeout(() => setSuccessMessage(''), 3000)

      // Add to local list
      const newUser: UserItem = {
        id: newUserEmail,
        username: newUserEmail.split('@')[0],
        email: newUserEmail,
        role: selectedRole,
      }

      setUsers([...users, newUser])
      setNewUserEmail('')
      setSelectedRole('guest')
    } catch (err: any) {
      setSuccessMessage(`❌ Error: ${err.response?.data?.error || 'Failed to add user'}`)
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await axios.post('/api/admin/update-user-role', {
        user_id: userId,
        new_role: newRole,
      })

      // Update local list
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      )

      setSuccessMessage(`✅ Role updated!`)
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err: any) {
      setSuccessMessage(`❌ Error: ${err.response?.data?.error || 'Failed to update role'}`)
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  if (user?.role !== 'owner') {
    return (
      <div className="admin-container">
        <div className="admin-content">
          <div className="access-denied">
            <h1>❌ Access Denied</h1>
            <p>Only owners can access this page</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">

      {/* Success Message Toast */}
      {successMessage && (
        <div className="toast-notification">
          {successMessage}
        </div>
      )}

      <main className="admin-content">
        <div className="admin-header">
          <h1>👑 Owner Dashboard</h1>
          <p className="subtitle">Manage users and permissions</p>
        </div>

        <div className="admin-grid">
          {/* Add User Card */}
          <div className="admin-card">
            <h2>➕ Add User to Management</h2>

            <form onSubmit={handleAddUser} className="admin-form">
              <div className="form-group">
                <label>User Email / ID</label>
                <input
                  type="text"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Assign Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="form-select"
                >
                  <option value="guest">👤 Guest (Limited access)</option>
                  <option value="admin">⚙️ Admin (Full access)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                Add User
              </button>
            </form>
          </div>

          {/* Users Table Card */}
          <div className="admin-card admin-card-full">
            <h2>👥 Members & Roles</h2>

            {isLoading ? (
              <p>Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-muted">No users yet</p>
            ) : (
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Current Role</th>
                      <th>Change Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.username}</strong>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge badge-${u.role}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <div className="role-dropdown">
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              className="role-select"
                            >
                              <option value="guest">👤 Guest</option>
                              <option value="admin">⚙️ Admin</option>
                              <option value="owner">👑 Owner</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="admin-card">
            <h2>📋 Role Levels</h2>

            <div className="role-info">
              <div className="role-item">
                <h3>👑 Owner</h3>
                <p>Full system access. Can manage users and assign roles.</p>
              </div>

              <div className="role-item">
                <h3>⚙️ Admin</h3>
                <p>Full access to all features and configurations.</p>
              </div>

              <div className="role-item">
                <h3>👤 Guest</h3>
                <p>Limited access. Can view but not edit settings.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
