import { useState, useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { getMyBookings, updateMyProfile, updateBookingStatus, uploadProfilePicture } from '../../services/api';
import Navbar from '../../components/Navbar';

const STATUS_BADGE = {
    pending:   'badge-warning',
    confirmed: 'badge-accent',
    completed: 'badge-success',
    cancelled: 'badge-danger',
};

export default function ContractorDashboard() {
    const { instance, accounts } = useMsal();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null); // booking id being updated
    const [profile, setProfile] = useState({ display_name: '', skills: '', hourly_rate: '', bio: '', profile_image_url: '' });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
                const { data } = await getMyBookings(idToken);
                setBookings(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [instance, accounts]);

    const handleStatusUpdate = async (bookingId, status) => {
        setUpdating(bookingId);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data } = await updateBookingStatus(idToken, bookingId, status);
            setBookings(prev => prev.map(b => b.id === bookingId ? data : b));
        } catch (err) { console.error(err); }
        finally { setUpdating(null); }
    };


    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data } = await updateMyProfile(idToken, {
                display_name: profile.display_name,
                skills: profile.skills,
                hourly_rate: parseFloat(profile.hourly_rate) || 0,
                bio: profile.bio,
            });
            // Keep the freshly returned image url in sync (server is source of truth).
            setProfile(p => ({ ...p, profile_image_url: data.profile_image_url || p.profile_image_url }));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handlePickFile = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting same file
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError('Please choose an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image must be smaller than 5 MB.');
            return;
        }

        setUploading(true);
        setUploadError(null);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data } = await uploadProfilePicture(idToken, file);
            setProfile(p => ({ ...p, profile_image_url: data.profile_image_url }));
        } catch (err) {
            console.error(err);
            setUploadError(err.response?.data?.detail || 'Upload failed. Did you save your profile first?');
        } finally {
            setUploading(false);
        }
    };

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        completed: bookings.filter(b => b.status === 'completed').length,
    };

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <h1>Contractor Dashboard</h1>
                    <p>Manage your bookings and public profile.</p>
                </div>

                {/* Stats */}
                <div className="stats-bar">
                    <div className="stat-card">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Bookings</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.completed}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="card" style={{ marginBottom: 28 }}>
                    <h3 style={{ marginBottom: 16 }}>Upcoming Bookings</h3>
                    {loading ? (
                        <div className="empty-state"><span>⏳</span></div>
                    ) : bookings.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px 0' }}>
                            <span>📅</span>
                            <p>No bookings yet. Share your profile link to get started!</p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Date &amp; Time</th>
                                        <th>Notes</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(b => (
                                        <tr key={b.id}>
                                            <td>{b.id}</td>
                                            <td>{new Date(b.scheduled_at).toLocaleString()}</td>
                                            <td>{b.notes || '—'}</td>
                                            <td><span className={`badge ${STATUS_BADGE[b.status] || ''}`}>{b.status}</span></td>
                                            <td>
                                                {b.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                                                            disabled={updating === b.id}
                                                            onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                                                        >
                                                            {updating === b.id ? '…' : '✓ Accept'}
                                                        </button>
                                                        <button
                                                            className="btn btn-danger"
                                                            style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                                                            disabled={updating === b.id}
                                                            onClick={() => handleStatusUpdate(b.id, 'cancelled')}
                                                        >
                                                            {updating === b.id ? '…' : '✗ Decline'}
                                                        </button>
                                                    </div>
                                                )}
                                                {b.status === 'confirmed' && (
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                                                        disabled={updating === b.id}
                                                        onClick={() => handleStatusUpdate(b.id, 'completed')}
                                                    >
                                                        {updating === b.id ? '…' : '✓ Mark Complete'}
                                                    </button>
                                                )}
                                                {(b.status === 'completed' || b.status === 'cancelled') && (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Edit Profile */}
                <div className="card">
                    <h3 style={{ marginBottom: 20 }}>Edit Your Profile</h3>

                    {/* Profile picture upload */}
                    <div className="flex items-center gap-4" style={{ marginBottom: 24 }}>
                        {profile.profile_image_url ? (
                            <img
                                src={profile.profile_image_url}
                                alt="Profile"
                                style={{
                                    width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
                                    border: '1px solid var(--border)',
                                }}
                            />
                        ) : (
                            <div className="avatar avatar-lg">📷</div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={handlePickFile}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading…' : profile.profile_image_url ? 'Change picture' : 'Upload picture'}
                            </button>
                            {uploadError && (
                                <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{uploadError}</span>
                            )}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                JPG, PNG, WEBP or GIF — up to 5 MB.
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-group">
                            <label htmlFor="display_name">Display Name</label>
                            <input id="display_name" className="input" placeholder="e.g. Jane Smith" required
                                value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="skills">Skills (comma-separated)</label>
                            <input id="skills" className="input" placeholder="e.g. Plumbing, Electrical, Painting"
                                value={profile.skills} onChange={e => setProfile(p => ({ ...p, skills: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="hourly_rate">Hourly Rate ($)</label>
                            <input id="hourly_rate" type="number" min="0" step="0.01" className="input" placeholder="e.g. 50"
                                value={profile.hourly_rate} onChange={e => setProfile(p => ({ ...p, hourly_rate: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="bio">Bio</label>
                            <textarea id="bio" className="textarea" placeholder="Tell clients a bit about yourself…"
                                value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
                        </div>
                        <div className="flex gap-3 items-center">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving…' : 'Save Profile'}
                            </button>
                            {saved && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>✓ Profile saved!</span>}
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
