import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, updateBookingStatus, payBooking, approveRevision, releasePayment } from '../../services/api';

const PLATFORM_FEE = 0.10;
import Navbar from '../../components/Navbar';

const STATUS_BADGE = {
    pending:   'badge-warning',
    confirmed: 'badge-accent',
    completed: 'badge-success',
    cancelled: 'badge-danger',
};

const getStatusLabel = (b) => {
    if (b.status === 'cancelled') {
        if (b.cancelled_by === 'client') return 'Cancelled by you';
        if (b.cancelled_by === 'contractor') return 'Cancelled by contractor';
        return 'Cancelled';
    }
    if (b.status === 'pending') {
        return b.payment?.status === 'quoted' ? 'Quote received — payment required' : 'Awaiting quote from contractor';
    }
    if (b.status === 'confirmed') {
        if (b.payment?.status === 'pending_revision') return 'Contractor requested a price revision';
        if (b.payment?.status === 'in_escrow') return `Confirmed — ${b.payment.final_amount.toFixed(2)} RON in escrow`;
        return 'Confirmed';
    }
    if (b.status === 'completed') {
        if (b.payment?.status === 'released') return 'Completed — payment released';
        if (b.payment?.status === 'in_escrow') return 'Completed — awaiting your payment release';
        return 'Completed';
    }
    return b.status;
};

export default function ClientBookings() {
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(null);
    const [paying, setPaying] = useState(null);
    const [approving, setApproving] = useState(null);
    const [releasing, setReleasing] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
                const { data } = await getMyBookings(idToken);
                setBookings(data.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)));
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [instance, accounts]);

    const handleCancel = async (bookingId) => {
        setCancelling(bookingId);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data } = await updateBookingStatus(idToken, bookingId, 'cancelled');
            setBookings(prev => prev.map(b => b.id === bookingId ? data : b));
        } catch (err) { console.error(err); }
        finally { setCancelling(null); }
    };

    const handlePay = async (bookingId) => {
        setPaying(bookingId);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data: payment } = await payBooking(idToken, bookingId);
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'confirmed', payment } : b));
        } catch (err) { console.error(err); }
        finally { setPaying(null); }
    };

    const handleApproveRevision = async (bookingId) => {
        setApproving(bookingId);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data: payment } = await approveRevision(idToken, bookingId);
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, payment } : b));
        } catch (err) { console.error(err); }
        finally { setApproving(null); }
    };

    const handleRelease = async (bookingId) => {
        setReleasing(bookingId);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data: payment } = await releasePayment(idToken, bookingId);
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, payment } : b));
        } catch (err) { console.error(err); }
        finally { setReleasing(null); }
    };

    const stats = {
        active: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
        completed: bookings.filter(b => b.status === 'completed').length,
    };

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <h1>My Bookings</h1>
                    <p>Track the status of all your service requests.</p>
                </div>

                {!loading && bookings.length > 0 && (
                    <div className="stats-bar" style={{ marginBottom: 28 }}>
                        <div className="stat-card">
                            <span className="stat-value">{bookings.length}</span>
                            <span className="stat-label">Total</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value" style={{ color: 'var(--accent)' }}>{stats.active}</span>
                            <span className="stat-label">Active</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.completed}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="empty-state"><span>⏳</span></div>
                ) : bookings.length === 0 ? (
                    <div className="empty-state">
                        <span>📋</span>
                        <h3>No bookings yet</h3>
                        <p>Browse contractors and make your first booking.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/client/home')}>
                            Find Contractors
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {bookings.map(b => (
                            <div key={b.id} className="card" style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                        {b.contractor_profile_image_url ? (
                                            <img src={b.contractor_profile_image_url} alt={b.contractor_display_name}
                                                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                                        ) : (
                                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                                                {(b.contractor_display_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                                <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                                                    {b.contractor_display_name || `Contractor #${b.contractor_id}`}
                                                </span>
                                                <span className={`badge ${STATUS_BADGE[b.status] || ''}`}>{b.status}</span>
                                            </div>
                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                                                {b.service_type || 'General Service'}
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {getStatusLabel(b)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                        <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                                            📅 {new Date(b.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <button
                                            className="btn btn-outline"
                                            style={{ fontSize: '0.78rem', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}
                                            onClick={() => navigate(`/client/contractors/${b.contractor_profile_id || b.contractor_id}`)}
                                        >
                                            View Profile
                                        </button>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ fontSize: '0.78rem', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}
                                            onClick={() => navigate(`/chat/${b.contractor_id}`, { state: { name: b.contractor_display_name, avatar: b.contractor_profile_image_url } })}
                                        >
                                            💬 Chat
                                        </button>
                                    </div>
                                </div>

                                {b.notes && (
                                    <p style={{ margin: '12px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Address:</span> {b.service_address || 'None'} <br/>
                                        <span style={{ color: 'var(--text-muted)' }}>Notes:</span> {b.notes}
                                    </p>
                                )}

                                {(b.status === 'confirmed' || b.status === 'pending') && (b.contractor_phone || b.contractor_contact_email) && (
                                    <div style={{ marginTop: 12, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                                        <strong style={{ display: 'block', marginBottom: 6 }}>Contractor Contact Info</strong>
                                        <div style={{ display: 'flex', gap: 24, color: 'var(--text-secondary)' }}>
                                            {b.contractor_phone && <div>📞 {b.contractor_phone}</div>}
                                            {b.contractor_contact_email && <div>✉️ {b.contractor_contact_email}</div>}
                                        </div>
                                    </div>
                                )}

                                {/* Payment actions */}
                                {b.status === 'pending' && b.payment?.status === 'quoted' && (() => {
                                    const amt = b.payment.quoted_amount;
                                    const fee = amt * PLATFORM_FEE;
                                    const payout = amt - fee;
                                    return (
                                        <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                                <span>You pay: <strong style={{ color: 'var(--text-primary)' }}>{amt.toFixed(2)} RON</strong></span>
                                                <span>Platform fee ({(PLATFORM_FEE * 100).toFixed(0)}%): <strong style={{ color: 'var(--warning)' }}>{fee.toFixed(2)} RON</strong></span>
                                                <span>Contractor receives: <strong style={{ color: 'var(--success)' }}>{payout.toFixed(2)} RON</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button className="btn btn-primary" style={{ padding: '6px 20px', fontSize: '0.85rem' }}
                                                    disabled={paying === b.id} onClick={() => handlePay(b.id)}>
                                                    {paying === b.id ? 'Processing…' : `Pay ${amt.toFixed(2)} RON`}
                                                </button>
                                                <button className="btn btn-danger" style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                                                    disabled={cancelling === b.id} onClick={() => handleCancel(b.id)}>
                                                    {cancelling === b.id ? 'Cancelling…' : 'Decline & Cancel'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                                {b.status === 'pending' && !b.payment && (
                                    <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                                        <button className="btn btn-danger" style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                                            disabled={cancelling === b.id} onClick={() => handleCancel(b.id)}>
                                            {cancelling === b.id ? 'Cancelling…' : 'Cancel Booking'}
                                        </button>
                                    </div>
                                )}
                                {b.status === 'confirmed' && b.payment?.status === 'pending_revision' && (
                                    <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ fontSize: '0.82rem' }}>
                                            Contractor revised the price to <strong>{b.payment.revised_amount?.toFixed(2)} RON</strong>
                                            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>(was {b.payment.quoted_amount.toFixed(2)} RON)</span>
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                            <span>You pay: <strong style={{ color: 'var(--text-primary)' }}>{b.payment.revised_amount?.toFixed(2)} RON</strong></span>
                                            <span>Contractor receives: <strong style={{ color: 'var(--success)' }}>{((b.payment.revised_amount || 0) * (1 - PLATFORM_FEE)).toFixed(2)} RON</strong></span>
                                        </div>
                                        <button className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '6px 20px', fontSize: '0.85rem' }}
                                            disabled={approving === b.id} onClick={() => handleApproveRevision(b.id)}>
                                            {approving === b.id ? 'Approving…' : 'Approve New Price'}
                                        </button>
                                    </div>
                                )}
                                {b.status === 'completed' && b.payment?.status === 'in_escrow' && (
                                    <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            The contractor has marked this job as complete. Release the funds when you are satisfied with the work.
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 20 }}>
                                            <span>Releasing: <strong style={{ color: 'var(--text-primary)' }}>{b.payment.final_amount.toFixed(2)} RON</strong></span>
                                            <span>Contractor receives: <strong style={{ color: 'var(--success)' }}>{(b.payment.final_amount * (1 - PLATFORM_FEE)).toFixed(2)} RON</strong></span>
                                        </div>
                                        <button className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '6px 20px', fontSize: '0.85rem' }}
                                            disabled={releasing === b.id} onClick={() => handleRelease(b.id)}>
                                            {releasing === b.id ? 'Releasing…' : `Release ${b.payment.final_amount.toFixed(2)} RON`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
