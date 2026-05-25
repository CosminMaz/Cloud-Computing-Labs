import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getContractor, createBooking } from '../../services/api';
import Navbar from '../../components/Navbar';
import FaqChatbot from '../../components/FaqChatbot';

export default function ContractorProfile() {
    const { id } = useParams();
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [contractor, setContractor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [serviceAddress, setServiceAddress] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [booking, setBooking] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
                const { data } = await getContractor(idToken, id);
                setContractor(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [id, instance, accounts]);

    const handleBook = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const dt = new Date(`${date}T${time}:00`);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data } = await createBooking(idToken, {
                contractor_id: contractor.user_id,  // User.id, not ContractorProfile.id
                scheduled_at: dt.toISOString(),
                service_type: serviceType,
                service_address: serviceAddress || null,
                client_phone: clientPhone || null,
                notes: notes || null,
            });
            setBooking(data);
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    };

    if (loading) return <><Navbar /><div className="page"><div className="empty-state"><span>⏳</span></div></div></>;
    if (!contractor) return <><Navbar /><div className="page"><div className="empty-state"><span>❌</span><p>Contractor not found.</p></div></div></>;

    const skills = contractor.skills ? contractor.skills.split(',').map(s => s.trim()) : [];
    const initials = contractor.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return (
        <>
            <Navbar />
            <div className="page" style={{ maxWidth: 1100 }}>
                <button className="btn btn-ghost" onClick={() => navigate('/client/home')} style={{ marginBottom: 24 }}>
                    ← Back to search
                </button>

                <div className="profile-layout">
                    {/* ── Left column: profile info ── */}
                    <div className="profile-layout-left">

                        {/* Header card */}
                        <div className="card">
                            <div className="flex items-center gap-4" style={{ marginBottom: 20 }}>
                                {contractor.profile_image_url ? (
                                    <img src={contractor.profile_image_url} alt={contractor.display_name}
                                        style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                                ) : (
                                    <div className="avatar avatar-lg" style={{ width: 80, height: 80, fontSize: '1.6rem' }}>{initials}</div>
                                )}
                                <div>
                                    <h2 style={{ marginBottom: 6 }}>{contractor.display_name}</h2>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <span className="badge badge-accent">{contractor.hourly_rate} RON/hr</span>
                                        {contractor.location && <span className="badge" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>📍 {contractor.location}</span>}
                                        {contractor.years_experience > 0 && <span className="badge" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>⏱ {contractor.years_experience} yrs exp</span>}
                                    </div>
                                </div>
                            </div>

                            {contractor.bio && <p style={{ marginBottom: skills.length > 0 ? 16 : 0 }}>{contractor.bio}</p>}

                            {skills.length > 0 && (
                                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                    {skills.map(s => <span key={s} className="badge badge-accent">{s}</span>)}
                                </div>
                            )}
                        </div>

                        {/* Contact info card */}
                        <div className="card">
                            <h3 style={{ marginBottom: 16, fontSize: '0.95rem' }}>Contact Information</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4 }}>Phone</div>
                                    <div style={{ fontSize: '0.9rem' }}>{contractor.phone || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4 }}>Email</div>
                                    <div style={{ fontSize: '0.9rem' }}>{contractor.contact_email || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4 }}>Location</div>
                                    <div style={{ fontSize: '0.9rem' }}>{contractor.location || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4 }}>Website</div>
                                    {contractor.website ? (
                                        <a href={contractor.website.startsWith('http') ? contractor.website : `https://${contractor.website}`}
                                            target="_blank" rel="noreferrer"
                                            style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>
                                            {contractor.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    ) : <span style={{ fontSize: '0.9rem' }}>—</span>}
                                </div>
                            </div>
                        </div>

                        {/* Collapsible AI chatbot */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <button
                                onClick={() => setChatOpen(o => !o)}
                                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                            >
                                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>💬 Ask AI Assistant</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{chatOpen ? '▲ Collapse' : '▼ Expand'}</span>
                            </button>
                            {chatOpen && (
                                <div style={{ padding: '0 20px 20px' }}>
                                    <FaqChatbot
                                        title={`Ask ${contractor.display_name}'s assistant`}
                                        subtitle="Ask about availability, rates, or services before booking."
                                        contractorId={contractor.id}
                                        bare
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right column: booking form ── */}
                    <div className="profile-layout-right">
                        <div className="card">
                            <h3 style={{ marginBottom: 20 }}>Book an Appointment</h3>
                            {booking ? (
                                <div className="empty-state" style={{ padding: '30px 0' }}>
                                    <span>🎉</span>
                                    <h3>Booking Confirmed!</h3>
                                    <p>Your booking (ID #{booking.id}) has been created with status <strong>{booking.status}</strong>.</p>
                                    <button className="btn btn-outline" onClick={() => navigate('/client/bookings')}>View My Bookings</button>
                                </div>
                            ) : (
                                <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div className="form-group">
                                            <label className="label">Date</label>
                                            <input className="input" type="date" required value={date} onChange={e => setDate(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Time</label>
                                            <input className="input" type="time" required value={time} onChange={e => setTime(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="label">Service Type</label>
                                        <input className="input" placeholder="e.g. Plumbing Repair, Consultation" required value={serviceType} onChange={e => setServiceType(e.target.value)} />
                                    </div>

                                    <div className="form-group">
                                        <label className="label">Your Phone Number</label>
                                        <input className="input" type="tel" placeholder="+40 700 000 000" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                                    </div>

                                    <div className="form-group">
                                        <label className="label">Service Address</label>
                                        <input className="input" placeholder="Street, City or 'Remote'" required value={serviceAddress} onChange={e => setServiceAddress(e.target.value)} />
                                    </div>

                                    <div className="form-group">
                                        <label className="label">Details & Notes</label>
                                        <textarea className="textarea" placeholder="Describe the issue or requirements…" value={notes} onChange={e => setNotes(e.target.value)} />
                                    </div>

                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Booking…' : 'Confirm Booking'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
