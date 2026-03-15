import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Profile.css'

const API = 'http://localhost:8080'

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ display_name: '', favorite_genre: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetch(`${API}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setUser(data)
        setForm({ display_name: data.display_name, favorite_genre: data.favorite_genre })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, token, navigate])

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      const res = await fetch(`${API}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setUser(data)
      setSuccess('Profile updated!')
      setEditing(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete your account? This cannot be undone.')) return
    try {
      const res = await fetch(`${API}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Could not delete account')
      localStorage.clear()
      navigate('/register')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  if (loading) return <div className="profile-loading">Loading…</div>

  return (
    <div className="profile-wrapper">
      <nav className="profile-nav">
        <span className="nav-logo">&#9654; Winamp</span>
        <button className="btn-ghost" onClick={handleLogout}>Log out</button>
      </nav>

      <div className="profile-card">
        <div className="profile-avatar">
          {(user?.display_name || user?.username || '?')[0].toUpperCase()}
        </div>
        <h2 className="profile-name">{user?.display_name || user?.username}</h2>
        <p className="profile-username">@{user?.username}</p>
        {user?.favorite_genre && (
          <span className="genre-badge">{user.favorite_genre}</span>
        )}

        {error && <p className="profile-error">{error}</p>}
        {success && <p className="profile-success">{success}</p>}

        {editing ? (
          <form onSubmit={handleUpdate} className="profile-form">
            <div className="field">
              <label htmlFor="display_name">Display Name</label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                value={form.display_name}
                onChange={handleChange}
                placeholder="Display name"
              />
            </div>
            <div className="field">
              <label htmlFor="favorite_genre">Favorite Genre</label>
              <input
                id="favorite_genre"
                name="favorite_genre"
                type="text"
                value={form.favorite_genre}
                onChange={handleChange}
                placeholder="e.g. Rock, Jazz, Pop…"
              />
            </div>
            <div className="profile-actions">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-actions">
            <button className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
            <button className="btn-danger" onClick={handleDelete}>Delete Account</button>
          </div>
        )}
      </div>
    </div>
  )
}
