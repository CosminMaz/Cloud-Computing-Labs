import { useState, useEffect, Fragment } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, updateBookingStatus, rescheduleBooking } from '../../services/api';
import Navbar from '../../components/Navbar';

const STATUS_BADGE = {
    pending:   'badge-warning',
    confirmed: 'badge-accent',
    completed: 'badge-success',
    cancelled: 'badge-danger',
};


export default function ContractorDashboard() {
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [sortAsc, setSortAsc] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [rescheduling, setRescheduling] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');

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
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...data, client_email: b.client_email, client_name: b.client_name } : b));
        } catch (err) { console.error(err); }
        finally { setUpdating(null); }
    };

    const handleReschedule = async (bookingId) => {
        if (!rescheduleDate || !rescheduleTime) return;
        setUpdating(bookingId);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const dt = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();
            const { data } = await rescheduleBooking(idToken, bookingId, dt);
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, scheduled_at: data.scheduled_at } : b));
            setRescheduling(null);
            setRescheduleDate('');
            setRescheduleTime('');
        } catch (err) { console.error(err); }
        finally { setUpdating(null); }
    };

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };

    const q = search.toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    const visible = bookings
        .filter(b => activeTab === 'all' || b.status === activeTab)
        .filter(b => !q || (b.client_email || '').toLowerCase().includes(q) || (b.client_name || '').toLowerCase().includes(q) || (b.notes || '').toLowerCase().includes(q) || (b.service_type || '').toLowerCase().includes(q))
        .filter(b => !from || new Date(b.scheduled_at) >= from)
        .filter(b => !to || new Date(b.scheduled_at) <= to)
        .sort((a, b) => sortAsc
            ? new Date(a.scheduled_at) - new Date(b.scheduled_at)
            : new Date(b.scheduled_at) - new Date(a.scheduled_at)
        );

    const statCardStyle = (filter) => ({
        cursor: 'pointer',
        outline: activeTab === filter ? '2px solid var(--accent)' : '2px solid transparent',
        outlineOffset: 2,
        borderRadius: 'var(--radius-md)',
        transition: 'outline var(--transition)',
    });

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>Dashboard</h1>
                        <p>Manage your incoming bookings.</p>
                    </div>
                    <button className="btn btn-outline" onClick={() => navigate('/contractor/profile')}>
                        My Profile
                    </button>
                </div>

                {/* Stats — click to filter */}
                <div className="stats-bar">
                    <div className="stat-card" style={statCardStyle('all')} onClick={() => setActiveTab('all')}>
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div className="stat-card" style={statCardStyle('pending')} onClick={() => setActiveTab(activeTab === 'pending' ? 'all' : 'pending')}>
                        <span className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat-card" style={statCardStyle('confirmed')} onClick={() => setActiveTab(activeTab === 'confirmed' ? 'all' : 'confirmed')}>
                        <span className="stat-value" style={{ color: 'var(--accent)' }}>{stats.confirmed}</span>
                        <span className="stat-label">Confirmed</span>
                    </div>
                    <div className="stat-card" style={statCardStyle('completed')} onClick={() => setActiveTab(activeTab === 'completed' ? 'all' : 'completed')}>
                        <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.completed}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                    <div className="stat-card" style={statCardStyle('cancelled')} onClick={() => setActiveTab(activeTab === 'cancelled' ? 'all' : 'cancelled')}>
                        <span className="stat-value" style={{ color: 'var(--danger)' }}>{stats.cancelled}</span>
                        <span className="stat-label">Cancelled</span>
                    </div>
                </div>

                {/* Bookings */}
                <div className="card" style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                            Bookings
                            {activeTab !== 'all' && (
                                <span className="badge" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px' }}>
                                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                    <button onClick={() => setActiveTab('all')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>✕</button>
                                </span>
                            )}
                        </h3>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                className="input"
                                placeholder="Search client or notes…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: 220 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
                                <span style={{ color: 'var(--text-muted)' }}>–</span>
                                <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
                            </div>
                            <button className="btn btn-outline" onClick={() => setSortAsc(v => !v)}>
                                {sortAsc ? '↑ Oldest' : '↓ Newest'}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty-state"><span>⏳</span></div>
                    ) : visible.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px 0' }}>
                            <span>📅</span>
                            <p>{search || dateFrom || dateTo ? 'No bookings match your filters.' : activeTab !== 'all' ? `No ${activeTab} bookings.` : 'No bookings yet. Share your profile link to get started!'}</p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Client</th>
                                        <th>Service</th>
                                        <th>Date &amp; Time</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map(b => (
                                        <Fragment key={b.id}>
                                            <tr
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                                            >
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{b.client_name || '—'}</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.client_email || ''}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{b.service_type || 'General Service'}</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.service_address || 'No address specified'}</div>
                                                </td>
                                                <td>
                                                    <div>{new Date(b.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${STATUS_BADGE[b.status] || ''}`}>{b.status}</span>
                                                    {b.status === 'cancelled' && b.cancelled_by && (
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>by {b.cancelled_by}</div>
                                                    )}
                                                </td>
                                            </tr>
                                            {expandedId === b.id && (
                                                <tr>
                                                    <td colSpan={4} style={{ background: 'var(--bg-elevated)', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                                                        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: '0.85rem', marginBottom: 16 }}>
                                                            <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Booking ID</span> <strong>#{b.id}</strong></div>
                                                            <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Client</span> <strong>{b.client_name || '—'}</strong> <br/><span style={{ color: 'var(--text-muted)' }}>{b.client_email}</span><br/><span style={{ color: 'var(--text-muted)' }}>{b.client_phone || 'No phone'}</span></div>
                                                            <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Created</span> <strong>{new Date(b.created_at).toLocaleString()}</strong></div>
                                                            {b.notes && <div style={{ maxWidth: 400 }}><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Notes</span> {b.notes}</div>}
                                                        </div>
                                                        {b.status === 'pending' && (
                                                            <div className="flex gap-3">
                                                                <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }} disabled={updating === b.id} onClick={() => handleStatusUpdate(b.id, 'confirmed')}>
                                                                    {updating === b.id ? '…' : '✓ Accept'}
                                                                </button>
                                                                <button className="btn btn-danger" style={{ borderRadius: 'var(--radius-sm)' }} disabled={updating === b.id} onClick={() => handleStatusUpdate(b.id, 'cancelled')}>
                                                                    {updating === b.id ? '…' : '✗ Decline'}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {b.status === 'confirmed' && (
                                                            <button className="btn btn-outline" style={{ borderRadius: 'var(--radius-sm)' }} disabled={updating === b.id} onClick={() => handleStatusUpdate(b.id, 'completed')}>
                                                                {updating === b.id ? '…' : '✓ Mark Complete'}
                                                            </button>
                                                        )}

                                                        {(b.status === 'pending' || b.status === 'confirmed') && (
                                                            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                                                {rescheduling === b.id ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                                        <input type="date" className="input" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} style={{ width: 160 }} />
                                                                        <input type="time" className="input" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} style={{ width: 130 }} />
                                                                        <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }} disabled={updating === b.id || !rescheduleDate || !rescheduleTime} onClick={() => handleReschedule(b.id)}>
                                                                            {updating === b.id ? '…' : 'Confirm'}
                                                                        </button>
                                                                        <button className="btn btn-ghost" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => { setRescheduling(null); setRescheduleDate(''); setRescheduleTime(''); }}>
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button className="btn btn-outline" style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }} onClick={() => { setRescheduling(b.id); setRescheduleDate(''); setRescheduleTime(''); }}>
                                                                        📅 Reschedule
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
