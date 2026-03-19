import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Music.css'

const API = 'http://localhost:9000/api'

export default function Music() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userId = user.id

  const [tab, setTab] = useState('melodies')

  // Melodies state
  const [melodies, setMelodies] = useState([])
  const [melodiesLoading, setMelodiesLoading] = useState(true)
  const [melodiesError, setMelodiesError] = useState('')
  const [melodyForm, setMelodyForm] = useState({ name: '', genre: '', album: '', artist: '' })
  const [melodyFormError, setMelodyFormError] = useState('')
  const [melodyFormLoading, setMelodyFormLoading] = useState(false)

  // Playlists state
  const [playlists, setPlaylists] = useState([])
  const [playlistsLoading, setPlaylistsLoading] = useState(false)
  const [playlistsError, setPlaylistsError] = useState('')
  const [playlistForm, setPlaylistForm] = useState({ name: '', melodyNames: '', description: '' })
  const [playlistFormError, setPlaylistFormError] = useState('')
  const [playlistFormLoading, setPlaylistFormLoading] = useState(false)

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchMelodies()
  }, [token, navigate])

  const fetchMelodies = async () => {
    setMelodiesLoading(true)
    setMelodiesError('')
    try {
      const res = await fetch(`${API}/music/melodies`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load melodies')
      setMelodies(data)
    } catch (err) {
      setMelodiesError(err.message)
    } finally {
      setMelodiesLoading(false)
    }
  }

  const handleMelodyChange = (e) =>
    setMelodyForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleAddMelody = async (e) => {
    e.preventDefault()
    setMelodyFormError('')
    if (!melodyForm.name.trim()) { setMelodyFormError('Name is required'); return }
    setMelodyFormLoading(true)
    try {
      const res = await fetch(`${API}/music/melody`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(melodyForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not add melody')
      setMelodies((prev) => [...prev, data])
      setMelodyForm({ name: '', genre: '', album: '', artist: '' })
    } catch (err) {
      setMelodyFormError(err.message)
    } finally {
      setMelodyFormLoading(false)
    }
  }

  const handleDeleteMelody = async (name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      const res = await fetch(`${API}/music/melody?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Could not delete melody')
      }
      setMelodies((prev) => prev.filter((m) => m.name !== name))
    } catch (err) {
      setMelodiesError(err.message)
    }
  }

  const handleTabChange = (newTab) => {
    setTab(newTab)
    if (newTab === 'playlists' && playlists.length === 0 && !playlistsLoading) {
      fetchPlaylists()
    }
  }

  const fetchPlaylists = async () => {
    setPlaylistsLoading(true)
    setPlaylistsError('')
    // Javanilla has no GET /playlists endpoint, we track locally
    setPlaylistsLoading(false)
  }

  const handlePlaylistChange = (e) =>
    setPlaylistForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleAddPlaylist = async (e) => {
    e.preventDefault()
    setPlaylistFormError('')
    if (!playlistForm.name.trim()) { setPlaylistFormError('Name is required'); return }
    const melodyNames = playlistForm.melodyNames
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    setPlaylistFormLoading(true)
    try {
      const res = await fetch(`${API}/music/playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playlistForm.name,
          melodyNames,
          description: playlistForm.description,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create playlist')
      setPlaylists((prev) => [...prev, data])
      setPlaylistForm({ name: '', melodyNames: '', description: '' })
    } catch (err) {
      setPlaylistFormError(err.message)
    } finally {
      setPlaylistFormLoading(false)
    }
  }

  const handleDeletePlaylist = async (name) => {
    if (!window.confirm(`Delete playlist "${name}"?`)) return
    try {
      const res = await fetch(`${API}/music/playlist?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Could not delete playlist')
      }
      setPlaylists((prev) => prev.filter((p) => p.name !== name))
    } catch (err) {
      setPlaylistsError(err.message)
    }
  }

  return (
    <div className="music-wrapper">
      <nav className="music-nav">
        <span className="nav-logo">&#9654; Winamp</span>
        <div className="nav-links">
          <button className="btn-ghost" onClick={() => navigate(`/profile/${userId}`)}>Profile</button>
          <button className="btn-ghost" onClick={() => { localStorage.clear(); navigate('/login') }}>Log out</button>
        </div>
      </nav>

      <div className="music-container">
        <h1 className="music-title">Music Catalog</h1>

        <div className="tabs">
          <button
            className={`tab-btn${tab === 'melodies' ? ' active' : ''}`}
            onClick={() => handleTabChange('melodies')}
          >
            Melodies
          </button>
          <button
            className={`tab-btn${tab === 'playlists' ? ' active' : ''}`}
            onClick={() => handleTabChange('playlists')}
          >
            Playlists
          </button>
        </div>

        {tab === 'melodies' && (
          <div className="tab-content">
            {/* Add melody form */}
            <div className="music-card">
              <h2 className="card-title">Add Melody</h2>
              {melodyFormError && <p className="music-error">{melodyFormError}</p>}
              <form onSubmit={handleAddMelody} className="music-form">
                <div className="form-row">
                  <input
                    name="name"
                    placeholder="Name *"
                    value={melodyForm.name}
                    onChange={handleMelodyChange}
                    className="music-input"
                  />
                  <input
                    name="genre"
                    placeholder="Genre"
                    value={melodyForm.genre}
                    onChange={handleMelodyChange}
                    className="music-input"
                  />
                </div>
                <div className="form-row">
                  <input
                    name="album"
                    placeholder="Album"
                    value={melodyForm.album}
                    onChange={handleMelodyChange}
                    className="music-input"
                  />
                  <input
                    name="artist"
                    placeholder="Artist"
                    value={melodyForm.artist}
                    onChange={handleMelodyChange}
                    className="music-input"
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={melodyFormLoading}>
                  {melodyFormLoading ? 'Adding…' : 'Add Melody'}
                </button>
              </form>
            </div>

            {/* Melodies list */}
            <div className="music-card">
              <div className="card-header">
                <h2 className="card-title">All Melodies</h2>
                <button className="btn-ghost" onClick={fetchMelodies} disabled={melodiesLoading}>
                  {melodiesLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>

              {melodiesError && <p className="music-error">{melodiesError}</p>}

              {!melodiesLoading && melodies.length === 0 && !melodiesError && (
                <p className="music-empty">No melodies yet. Add one above.</p>
              )}

              {melodies.length > 0 && (
                <ul className="music-list">
                  {melodies.map((m) => (
                    <li key={m.name} className="music-item">
                      <div className="item-info">
                        <span className="item-name">{m.name}</span>
                        <span className="item-meta">
                          {[m.artist, m.album, m.genre].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      <button
                        className="btn-danger-sm"
                        onClick={() => handleDeleteMelody(m.name)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === 'playlists' && (
          <div className="tab-content">
            {/* Create playlist form */}
            <div className="music-card">
              <h2 className="card-title">Create Playlist</h2>
              {playlistFormError && <p className="music-error">{playlistFormError}</p>}
              <form onSubmit={handleAddPlaylist} className="music-form">
                <input
                  name="name"
                  placeholder="Playlist name *"
                  value={playlistForm.name}
                  onChange={handlePlaylistChange}
                  className="music-input"
                />
                <input
                  name="melodyNames"
                  placeholder="Melody names (comma-separated)"
                  value={playlistForm.melodyNames}
                  onChange={handlePlaylistChange}
                  className="music-input"
                />
                <input
                  name="description"
                  placeholder="Description"
                  value={playlistForm.description}
                  onChange={handlePlaylistChange}
                  className="music-input"
                />
                <button type="submit" className="btn-primary" disabled={playlistFormLoading}>
                  {playlistFormLoading ? 'Creating…' : 'Create Playlist'}
                </button>
              </form>
            </div>

            {/* Playlists list */}
            <div className="music-card">
              <h2 className="card-title">My Playlists</h2>

              {playlistsError && <p className="music-error">{playlistsError}</p>}

              {playlists.length === 0 && !playlistsError && (
                <p className="music-empty">No playlists yet. Create one above.</p>
              )}

              {playlists.length > 0 && (
                <ul className="music-list">
                  {playlists.map((p) => (
                    <li key={p.name} className="music-item music-item--playlist">
                      <div className="item-info">
                        <span className="item-name">{p.name}</span>
                        {p.description && <span className="item-meta">{p.description}</span>}
                        {p.melodyNames && p.melodyNames.length > 0 && (
                          <span className="item-tracks">
                            {p.melodyNames.length} track{p.melodyNames.length !== 1 ? 's' : ''}: {p.melodyNames.join(', ')}
                          </span>
                        )}
                      </div>
                      <button
                        className="btn-danger-sm"
                        onClick={() => handleDeletePlaylist(p.name)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
