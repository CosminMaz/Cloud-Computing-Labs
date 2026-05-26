import { useState, useEffect, Fragment, useRef, useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, updateBookingStatus, rescheduleBooking, getMe, getConversations, getMyProfile, setPaymentQuote, revisePayment } from '../../services/api';
import Navbar from '../../components/Navbar';
import BookingCalendar from '../../components/BookingCalendar';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE = BASE_URL.startsWith('https') ? BASE_URL.replace('https://', 'wss://') : BASE_URL.replace('http://', 'ws://');
const PLATFORM_FEE = 0.10;

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
    const [dashView, setDashView] = useState('table');
    const [selectedDay, setSelectedDay] = useState(null);
    const [selectedDayBooking, setSelectedDayBooking] = useState(null);
    const rowRefs = useRef({});
    const [myId, setMyId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const dashWsRef = useRef(null);
    const [balance, setBalance] = useState(null);
    const [quoteAmounts, setQuoteAmounts] = useState({});
    const [quoting, setQuoting] = useState(null);
    const [revising, setRevising] = useState(null);
    const [reviseAmounts, setReviseAmounts] = useState({});

    const unreadMap = useMemo(() =>
        Object.fromEntries(conversations.filter(c => c.unread_count > 0).map(c => [c.user_id, c.unread_count])),
        [conversations]
    );
    const totalUnread = useMemo(() => conversations.reduce((sum, c) => sum + c.unread_count, 0), [conversations]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
                const [bookingsRes, profileRes] = await Promise.all([getMyBookings(idToken), getMyProfile(idToken)]);
                setBookings(bookingsRes.data);
                setBalance(profileRes.data.balance ?? 0);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [instance, accounts]);

    useEffect(() => {
        let ws;
        const initMessaging = async () => {
            try {
                const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
                const [meRes, convRes] = await Promise.all([getMe(idToken), getConversations(idToken)]);
                setMyId(meRes.data.id);
                setConversations(convRes.data);

                ws = new WebSocket(`${WS_BASE}/api/ws/${meRes.data.id}?token=${encodeURIComponent(idToken)}`);
                dashWsRef.current = ws;
                ws.onmessage = (e) => {
                    const msg = JSON.parse(e.data);
                    if (msg.from_id === meRes.data.id) return;
                    setConversations(prev => {
                        const exists = prev.find(c => c.user_id === msg.from_id);
                        if (exists) {
                            return [...prev.map(c => c.user_id === msg.from_id
                                ? { ...c, unread_count: c.unread_count + 1, last_message: msg.content, last_message_at: msg.created_at, is_mine: false }
                                : c
                            )].sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
                        }
                        getConversations(idToken).then(r => setConversations(r.data));
                        return prev;
                    });
                };
            } catch (err) { console.error(err); }
        };
        initMessaging();
        return () => { ws?.close(); };
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

    const handleSendQuote = async (bookingId) => {
        const amount = parseFloat(quoteAmounts[bookingId]);
        if (!amount || amount <= 0) return;
        setQuoting(bookingId);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data: payment } = await setPaymentQuote(idToken, bookingId, amount);
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, payment } : b));
        } catch (err) { console.error(err); }
        finally { setQuoting(null); }
    };

    const handleSendRevision = async (bookingId) => {
        const amount = parseFloat(reviseAmounts[bookingId]);
        if (!amount || amount <= 0) return;
        setRevising(bookingId);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data: payment } = await revisePayment(idToken, bookingId, amount);
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, payment } : b));
        } catch (err) { console.error(err); }
        finally { setRevising(null); }
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

    const handleSelectDay = (date, preSelected) => {
        const dayBookings = visible.filter(b => {
            const bd = new Date(b.scheduled_at);
            return bd.toDateString() === date.toDateString();
        });
        setSelectedDay({ date, bookings: dayBookings });
        setSelectedDayBooking(preSelected || null);
    };

    const handleViewInTable = (booking) => {
        setSelectedDay(null);
        setDashView('table');
        setExpandedId(booking.id);
        setTimeout(() => {
            rowRefs.current[booking.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
    };

    const [copied, setCopied] = useState(null);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 1500);
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
            <Navbar balance={balance} />
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

                {/* Messages */}
                <div className="card" style={{ marginBottom: 28 }}>
                    <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        Messages
                        {totalUnread > 0 && (
                            <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '999px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                                {totalUnread}
                            </span>
                        )}
                    </h3>
                    {conversations.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No messages yet.</p>
                    ) : (
                        <div>
                            {conversations.map((c, i) => (
                                <div
                                    key={c.user_id}
                                    onClick={() => {
                                        setConversations(prev => prev.map(x => x.user_id === c.user_id ? { ...x, unread_count: 0 } : x));
                                        navigate(`/chat/${c.user_id}`, { state: { name: c.display_name } });
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '10px 8px', cursor: 'pointer',
                                        borderBottom: i < conversations.length - 1 ? '1px solid var(--border)' : 'none',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'transparent',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 600, fontSize: '0.88rem',
                                        color: c.unread_count > 0 ? 'var(--accent)' : 'var(--text-muted)',
                                    }}>
                                        {(c.display_name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: c.unread_count > 0 ? 600 : 400, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {c.display_name || `User #${c.user_id}`}
                                            {c.unread_count > 0 && (
                                                <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '999px', padding: '1px 6px', fontSize: '0.65rem', fontWeight: 700 }}>
                                                    {c.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.is_mine ? 'You: ' : ''}{c.last_message}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                        {new Date(c.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                        <h3 style={{ margin: 0 }}>Bookings</h3>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            {dashView === 'table' && (<>
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
                            </>)}
                            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                <button
                                    onClick={() => setDashView('table')}
                                    style={{ padding: '6px 14px', fontSize: '0.82rem', border: 'none', cursor: 'pointer', background: dashView === 'table' ? 'var(--accent)' : 'var(--bg-elevated)', color: dashView === 'table' ? '#fff' : 'var(--text-muted)', transition: 'background var(--transition)' }}
                                >☰ Table</button>
                                <button
                                    onClick={() => setDashView('calendar')}
                                    style={{ padding: '6px 14px', fontSize: '0.82rem', border: 'none', cursor: 'pointer', background: dashView === 'calendar' ? 'var(--accent)' : 'var(--bg-elevated)', color: dashView === 'calendar' ? '#fff' : 'var(--text-muted)', transition: 'background var(--transition)' }}
                                >📅 Calendar</button>
                            </div>
                        </div>
                    </div>

                    {dashView === 'calendar' && (
                        <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 300px' : '1fr', gap: 20, alignItems: 'start' }}>
                            <BookingCalendar bookings={visible} onSelectDay={handleSelectDay} />

                            {selectedDay && (
                                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                {selectedDay.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {selectedDay.bookings.length} booking{selectedDay.bookings.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <button onClick={() => { setSelectedDay(null); setSelectedDayBooking(null); }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }}>✕</button>
                                    </div>

                                    {selectedDay.bookings.length === 0 ? (
                                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No bookings this day.</div>
                                    ) : (
                                        <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                                            {selectedDay.bookings.map(b => (
                                                <div key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <div
                                                        onClick={() => setSelectedDayBooking(selectedDayBooking?.id === b.id ? null : b)}
                                                        style={{ padding: '12px 16px', cursor: 'pointer', background: selectedDayBooking?.id === b.id ? 'var(--bg-hover)' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                    >
                                                        <div>
                                                            <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{b.service_type || 'General Service'}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.client_name || b.client_email} · {new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </div>
                                                        <span className={`badge ${STATUS_BADGE[b.status] || ''}`}>{b.status}</span>
                                                    </div>
                                                    {selectedDayBooking?.id === b.id && (
                                                        <div style={{ padding: '0 16px 14px', fontSize: '0.82rem' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, color: 'var(--text-muted)' }}>
                                                                {b.client_email && <span onClick={() => copyToClipboard(b.client_email)} title="Click to copy" style={{ cursor: 'pointer', color: copied === b.client_email ? 'var(--success)' : 'var(--text-muted)' }}>📧 {copied === b.client_email ? '✓ Copied!' : b.client_email}</span>}
                                                                {b.client_phone && <span onClick={() => copyToClipboard(b.client_phone)} title="Click to copy" style={{ cursor: 'pointer', color: copied === b.client_phone ? 'var(--success)' : 'var(--text-muted)' }}>📞 {copied === b.client_phone ? '✓ Copied!' : b.client_phone}</span>}
                                                                {b.service_address && <span>📍 {b.service_address}</span>}
                                                                {b.notes && <span>📝 {b.notes}</span>}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                                {b.status === 'pending' && (
                                                                    <button className="btn btn-ghost" style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => handleViewInTable(b)}>↗ Set Quote in table</button>
                                                                )}
                                                                {b.status === 'confirmed' && b.payment?.status === 'in_escrow' && (
                                                                    <button className="btn btn-outline" style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', padding: '4px 10px' }} disabled={updating === b.id} onClick={() => handleStatusUpdate(b.id, 'completed')}>{updating === b.id ? '…' : '✓ Complete'}</button>
                                                                )}
                                                                <button className="btn btn-ghost" style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => handleViewInTable(b)}>↗ View in table</button>
                                                                <button className="btn btn-ghost" style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => navigate(`/chat/${b.client_id}`, { state: { name: b.client_name || b.client_email } })}>💬 Chat</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {dashView === 'table' && (
                    <>
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
                                                ref={el => rowRefs.current[b.id] = el}
                                                style={{ cursor: 'pointer', outline: expandedId === b.id ? '2px solid var(--accent)' : 'none' }}
                                                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                                            >
                                                <td>
                                                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {b.client_name || '—'}
                                                        {unreadMap[b.client_id] > 0 && (
                                                            <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '999px', padding: '1px 6px', fontSize: '0.62rem', fontWeight: 700 }}>
                                                                {unreadMap[b.client_id]}
                                                            </span>
                                                        )}
                                                    </div>
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
                                                            <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Client</span>
                                                                <strong>{b.client_name || '—'}</strong><br/>
                                                                {b.client_email && (
                                                                    <span onClick={() => copyToClipboard(b.client_email)} title="Click to copy"
                                                                        style={{ cursor: 'pointer', color: copied === b.client_email ? 'var(--success)' : 'var(--text-muted)' }}>
                                                                        {copied === b.client_email ? '✓ Copied!' : b.client_email}
                                                                    </span>
                                                                )}<br/>
                                                                {b.client_phone && b.client_phone !== 'No phone' ? (
                                                                    <span onClick={() => copyToClipboard(b.client_phone)} title="Click to copy"
                                                                        style={{ cursor: 'pointer', color: copied === b.client_phone ? 'var(--success)' : 'var(--text-muted)' }}>
                                                                        {copied === b.client_phone ? '✓ Copied!' : b.client_phone}
                                                                    </span>
                                                                ) : <span style={{ color: 'var(--text-muted)' }}>No phone</span>}
                                                            </div>
                                                            <div><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Created</span> <strong>{new Date(b.created_at).toLocaleString()}</strong></div>
                                                            {b.notes && <div style={{ maxWidth: 400 }}><span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Notes</span> {b.notes}</div>}
                                                        </div>
                                                        {b.status === 'pending' && (() => {
                                                            const amt = parseFloat(quoteAmounts[b.id]) || 0;
                                                            const fee = amt * PLATFORM_FEE;
                                                            const payout = amt - fee;
                                                            const hasQuote = b.payment?.status === 'quoted';
                                                            return (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                                                                        {hasQuote ? `Quote sent: ${b.payment.quoted_amount.toFixed(2)} RON — awaiting client payment` : 'Set a price to confirm this booking'}
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                                        <input
                                                                            type="number" min="1" step="1" className="input"
                                                                            placeholder={hasQuote ? `${b.payment.quoted_amount}` : 'Amount (RON)'}
                                                                            value={quoteAmounts[b.id] || ''}
                                                                            onChange={e => setQuoteAmounts(prev => ({ ...prev, [b.id]: e.target.value }))}
                                                                            style={{ width: 140 }}
                                                                        />
                                                                        <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }}
                                                                            disabled={quoting === b.id || !quoteAmounts[b.id]}
                                                                            onClick={() => handleSendQuote(b.id)}>
                                                                            {quoting === b.id ? '…' : hasQuote ? 'Update Quote' : 'Send Quote'}
                                                                        </button>
                                                                        <button className="btn btn-danger" style={{ borderRadius: 'var(--radius-sm)' }}
                                                                            disabled={updating === b.id} onClick={() => handleStatusUpdate(b.id, 'cancelled')}>
                                                                            {updating === b.id ? '…' : '✗ Decline'}
                                                                        </button>
                                                                    </div>
                                                                    {amt > 0 && (
                                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
                                                                            <span>Client pays: <strong style={{ color: 'var(--text-primary)' }}>{amt.toFixed(2)} RON</strong></span>
                                                                            <span>Platform fee ({(PLATFORM_FEE * 100).toFixed(0)}%): <strong style={{ color: 'var(--warning)' }}>{fee.toFixed(2)} RON</strong></span>
                                                                            <span>You receive: <strong style={{ color: 'var(--success)' }}>{payout.toFixed(2)} RON</strong></span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                        {b.status === 'confirmed' && b.payment?.status === 'pending_revision' && (
                                                            <div style={{ fontSize: '0.82rem', color: 'var(--warning)' }}>
                                                                Revision of {b.payment.revised_amount?.toFixed(2)} RON pending client approval
                                                            </div>
                                                        )}
                                                        {b.status === 'confirmed' && b.payment?.status === 'in_escrow' && (() => {
                                                            const amt = parseFloat(reviseAmounts[b.id]) || 0;
                                                            const fee = amt * PLATFORM_FEE;
                                                            const payout = amt - fee;
                                                            return (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                                        {b.payment.final_amount.toFixed(2)} RON secured in escrow
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                                        <button className="btn btn-outline" style={{ borderRadius: 'var(--radius-sm)' }}
                                                                            disabled={updating === b.id} onClick={() => handleStatusUpdate(b.id, 'completed')}>
                                                                            {updating === b.id ? '…' : '✓ Mark Complete'}
                                                                        </button>
                                                                        <input type="number" min="1" step="1" className="input"
                                                                            placeholder="Revised amount (RON)"
                                                                            value={reviseAmounts[b.id] || ''}
                                                                            onChange={e => setReviseAmounts(prev => ({ ...prev, [b.id]: e.target.value }))}
                                                                            style={{ width: 180 }} />
                                                                        <button className="btn btn-ghost" style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}
                                                                            disabled={revising === b.id || !reviseAmounts[b.id]}
                                                                            onClick={() => handleSendRevision(b.id)}>
                                                                            {revising === b.id ? '…' : 'Request Revision'}
                                                                        </button>
                                                                    </div>
                                                                    {amt > 0 && (
                                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
                                                                            <span>Client pays: <strong style={{ color: 'var(--text-primary)' }}>{amt.toFixed(2)} RON</strong></span>
                                                                            <span>Platform fee: <strong style={{ color: 'var(--warning)' }}>{fee.toFixed(2)} RON</strong></span>
                                                                            <span>You receive: <strong style={{ color: 'var(--success)' }}>{payout.toFixed(2)} RON</strong></span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                        {b.status === 'completed' && b.payment?.status === 'in_escrow' && (
                                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                                Awaiting client to release {b.payment.final_amount.toFixed(2)} RON
                                                            </div>
                                                        )}
                                                        {b.status === 'completed' && b.payment?.status === 'released' && (
                                                            <div style={{ fontSize: '0.82rem', color: 'var(--success)' }}>
                                                                ✓ Payment released — you received {b.payment.contractor_payout?.toFixed(2)} RON
                                                            </div>
                                                        )}
                                                        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                                            <button
                                                                className="btn btn-ghost"
                                                                style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}
                                                                onClick={() => navigate(`/chat/${b.client_id}`, { state: { name: b.client_name || b.client_email } })}
                                                            >
                                                                💬 Message {b.client_name ? b.client_name.split(' ')[0] : 'Client'}
                                                            </button>
                                                            {(b.status === 'pending' || b.status === 'confirmed') && (
                                                                <>{rescheduling === b.id ? (
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
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    </>
                    )}
                </div>
            </div>
        </>
    );
}
