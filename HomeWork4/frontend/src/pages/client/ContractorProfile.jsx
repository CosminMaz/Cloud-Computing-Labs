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
            <div className="page" style={{ maxWidth: 700 }}>
                <button className="btn btn-ghost" onClick={() => navigate('/client/home')} style={{ marginBottom: 24 }}>
                    ← Back to search
                </button>

                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="flex items-center gap-4" style={{ marginBottom: 20 }}>
                        {contractor.profile_image_url ? (
                            <img
                                src={contractor.profile_image_url}
                                alt={contractor.display_name}
                                style={{
                                    width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
                                    border: '1px solid var(--border)', flexShrink: 0,
                                }}
                            />
                        ) : (
                            <div className="avatar avatar-lg">{initials}</div>
                        )}
                        <div>
                            <h2>{contractor.display_name}</h2>
                            <span className="badge badge-accent" style={{ marginTop: 6 }}>
                                ${contractor.hourly_rate}/hr
                            </span>
                        </div>
                    </div>

                    {contractor.bio && <p style={{ marginBottom: 16 }}>{contractor.bio}</p>}

                    {skills.length > 0 && (
                        <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: 24 }}>
                            {skills.map(s => <span key={s} className="badge badge-accent">{s}</span>)}
                        </div>
                    )}

                    <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Phone</div>
                                <div>{contractor.phone || 'Not specified'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Email</div>
                                <div>{contractor.contact_email || 'Not specified'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Location</div>
                                <div>{contractor.location || 'Not specified'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Experience</div>
                                <div>{contractor.years_experience ? `${contractor.years_experience} years` : 'Not specified'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Website</div>
                                {contractor.website ? (
                                    <a href={contractor.website.startsWith('http') ? contractor.website : `https://${contractor.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                                        {contractor.website.replace(/^https?:\/\//, '')}
                                    </a>
                                ) : '—'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <FaqChatbot
                        title={`Ask ${contractor.display_name}'s assistant`}
                        subtitle="Ask about availability, rates, or services before booking."
                        contractorId={contractor.id}
                    />
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: 20 }}>Book an Appointment</h3>
                    {booking ? (
                        <div className="empty-state" style={{ padding: '30px 0' }}>
                            <span>🎉</span>
                            <h3>Booking Confirmed!</h3>
                            <p>Your booking (ID #{booking.id}) has been created with status <strong>{booking.status}</strong>.</p>
                            <button className="btn btn-outline" onClick={() => navigate('/client/home')}>Back to Search</button>
                        </div>
                    ) : (
                        <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
    
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="label">Your Phone Number</label>
                                    <input className="input" type="tel" placeholder="+40 700 000 000" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Service Address</label>
                                    <input className="input" placeholder="Street, City or 'Remote'" required value={serviceAddress} onChange={e => setServiceAddress(e.target.value)} />
                                </div>
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
        </>
    );
}
