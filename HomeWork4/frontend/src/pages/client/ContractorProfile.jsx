import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getContractor, createBooking } from '../../services/api';
import Navbar from '../../components/Navbar';

export default function ContractorProfile() {
    const { id } = useParams();
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [contractor, setContractor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scheduledAt, setScheduledAt] = useState('');
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
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data } = await createBooking(idToken, {
                contractor_id: contractor.user_id,  // User.id, not ContractorProfile.id
                scheduled_at: new Date(scheduledAt).toISOString(),
                notes,
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
                        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                            {skills.map(s => <span key={s} className="badge badge-accent">{s}</span>)}
                        </div>
                    )}
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
                            <div className="form-group">
                                <label htmlFor="scheduled_at">Date & Time</label>
                                <input id="scheduled_at" type="datetime-local" className="input" required
                                    value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="notes">Notes (optional)</label>
                                <textarea id="notes" className="textarea" placeholder="Describe what you need…"
                                    value={notes} onChange={e => setNotes(e.target.value)} />
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
