import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getContractor, createBooking } from '../../services/api';
import Navbar from '../../components/Navbar';
import FaqChatbot from '../../components/FaqChatbot';
import { Icon, PulseDot } from '../../components/DesignSystem';

const TIME_SLOTS = ['07:30', '09:00', '11:00', '13:30', '15:00', '16:30'];

function generateDates() {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return {
            iso: d.toISOString().split('T')[0],
            d: d.getDate(),
            day: d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase(),
            label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
    });
}

function LoadingState() {
    return (
        <div className="cc-paper" style={{ minHeight: '100vh' }}>
            <Navbar/>
            <section style={{ padding: '56px 40px', maxWidth: 1180, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-3)' }}>
                    <Icon name="spinner" size={20} style={{ animation: 'cc-spin 1s linear infinite' }}/>
                    <span className="serif" style={{ fontSize: 22 }}>loading profile…</span>
                </div>
            </section>
        </div>
    );
}

export default function ContractorProfile() {
    const { id } = useParams();
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [contractor, setContractor] = useState(null);
    const [loading, setLoading] = useState(true);

    const dates = generateDates();
    const [selectedDateIdx, setSelectedDateIdx] = useState(0);
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [notes, setNotes] = useState('');
    const [booking, setBooking] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [bookingError, setBookingError] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { idToken } = await instance.acquireTokenSilent({
                    scopes: ['openid', 'profile', 'email'], account: accounts[0],
                });
                const { data } = await getContractor(idToken, id);
                setContractor(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [id, instance, accounts]);

    const handleBook = async () => {
        setSubmitting(true);
        setBookingError(null);
        try {
            const { idToken } = await instance.acquireTokenSilent({
                scopes: ['openid', 'profile', 'email'], account: accounts[0],
            });
            const scheduledAt = new Date(`${dates[selectedDateIdx].iso}T${selectedTime}:00`).toISOString();
            const { data } = await createBooking(idToken, {
                contractor_id: contractor.user_id,
                scheduled_at: scheduledAt,
                notes,
            });
            setBooking(data);
        } catch (err) {
            console.error(err);
            const status = err.response?.status;
            setBookingError(status === 409
                ? 'That slot was just taken — pick another window.'
                : 'Booking failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingState/>;
    if (!contractor) return (
        <div className="cc-paper" style={{ minHeight: '100vh' }}>
            <Navbar/>
            <section style={{ padding: '120px 40px', textAlign: 'center' }}>
                <h2 className="serif" style={{ fontSize: 32 }}>Contractor not found.</h2>
            </section>
        </div>
    );

    const skills = contractor.skills ? contractor.skills.split(',').map(s => s.trim()) : [];
    const firstName = contractor.display_name.split(' ')[0];
    const primaryTrade = skills[0]?.toLowerCase() || 'contractor';
    const estCost = contractor.hourly_rate ? `~$${contractor.hourly_rate * 2}` : '—';
    const selectedDate = dates[selectedDateIdx];

    return (
        <div className="cc-paper" style={{ minHeight: '100vh' }}>
            <Navbar/>

            <section style={{ padding: '32px 40px 80px', maxWidth: 1180, margin: '0 auto' }}>
                <button className="cc-btn cc-btn-ghost cc-btn-sm"
                        style={{ marginBottom: 24, marginLeft: -10 }}
                        onClick={() => navigate('/client/home')}>
                    <Icon name="arrowL" size={14}/> back to directory
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'flex-start' }}>
                    {/* Left: profile */}
                    <div>
                        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                            <div style={{
                                width: 160, flexShrink: 0, aspectRatio: '3/4', overflow: 'hidden',
                                background: 'var(--paper-2)',
                                backgroundImage: 'repeating-linear-gradient(135deg, rgba(24,23,26,.05) 0 1px, transparent 1px 8px)',
                                display: 'flex', alignItems: 'flex-end',
                            }}>
                                {contractor.profile_image_url ? (
                                    <img src={contractor.profile_image_url} alt={contractor.display_name}
                                         style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                                ) : (
                                    <span className="cc-placeholder-tag">{firstName.toLowerCase()} · portrait</span>
                                )}
                            </div>
                            <div style={{ flex: 1, paddingTop: 4 }}>
                                <div className="cc-toprule">
                                    <span className="label-cap">{primaryTrade}</span>
                                </div>
                                <h1 className="serif" style={{ fontSize: 'clamp(36px,4vw,52px)', lineHeight: 1, fontWeight: 500, letterSpacing: '-0.025em', margin: 0 }}>
                                    {contractor.display_name}
                                </h1>

                                <div style={{ display: 'flex', gap: 20, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--rule)', flexWrap: 'wrap' }}>
                                    {[
                                        ['hourly', contractor.hourly_rate ? `$${contractor.hourly_rate}` : '—'],
                                        ['available', <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><PulseDot color="var(--moss)" size={5}/> now</span>],
                                    ].map(([l, v]) => (
                                        <div key={l}>
                                            <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{v}</div>
                                            <div className="label-cap" style={{ marginTop: 2 }}>{l}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {contractor.bio && (
                            <div style={{ marginTop: 36 }}>
                                <div className="label-cap" style={{ marginBottom: 12 }}>about</div>
                                <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)' }}>{contractor.bio}</p>
                            </div>
                        )}

                        {skills.length > 0 && (
                            <div style={{ marginTop: 28 }}>
                                <div className="label-cap" style={{ marginBottom: 12 }}>specialties</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {skills.map(s => (
                                        <span key={s} className="cc-tag cc-tag-skill cc-tag-plain">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <FaqChatbot contractorName={firstName}/>
                    </div>

                    {/* Right: booking */}
                    <div style={{ position: 'sticky', top: 100 }}>
                        <div className="cc-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)',
                                          background: 'var(--paper-2)' }}>
                                <div className="label-cap">book a window</div>
                                <div className="serif" style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>
                                    {booking ? "You're booked." : 'Pick a day, then a time.'}
                                </div>
                            </div>

                            {booking ? (
                                <div style={{ padding: 32 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--moss)', marginBottom: 16 }}>
                                        <Icon name="check" size={18}/>
                                        <span className="label-cap" style={{ color: 'var(--moss)' }}>confirmed · #{booking.id}</span>
                                    </div>
                                    <div className="serif" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.2 }}>
                                        {selectedDate.label} — {selectedTime}
                                    </div>
                                    <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 14, lineHeight: 1.6 }}>
                                        {firstName} got your request. Status: <strong>{booking.status}</strong>.
                                        Cancel up to 12 hours ahead, no charge.
                                    </p>
                                    <button className="cc-btn cc-btn-outline"
                                            style={{ marginTop: 20, width: '100%' }}
                                            onClick={() => navigate('/client/home')}>
                                        back to directory
                                    </button>
                                </div>
                            ) : (
                                <div style={{ padding: 24 }}>
                                    {/* Booking error */}
                                    {bookingError && (
                                        <div style={{ marginBottom: 18, padding: '12px 16px', background: 'var(--rust-soft)',
                                                      border: '1px solid var(--rust)', borderRadius: 4, fontSize: 13,
                                                      color: 'var(--rust)', lineHeight: 1.5 }}>
                                            {bookingError}
                                        </div>
                                    )}

                                    {/* Date scrubber */}
                                    <div className="label-cap" style={{ marginBottom: 10 }}>day</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                                        {dates.map((d, idx) => {
                                            const isOn = idx === selectedDateIdx;
                                            return (
                                                <button key={d.iso} onClick={() => setSelectedDateIdx(idx)}
                                                    style={{
                                                        padding: '10px 0', cursor: 'pointer',
                                                        background: isOn ? 'var(--ink)' : 'transparent',
                                                        color: isOn ? 'var(--paper)' : 'var(--ink)',
                                                        border: '1px solid', borderColor: isOn ? 'var(--ink)' : 'var(--rule)',
                                                        transition: 'all 140ms',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                                    }}>
                                                    <span className="mono" style={{ fontSize: 9, letterSpacing: '0.08em',
                                                        opacity: 0.7, textTransform: 'uppercase' }}>{d.day}</span>
                                                    <span className="serif" style={{ fontSize: 18, fontWeight: 500 }}>{d.d}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Time slots */}
                                    <div className="label-cap" style={{ marginTop: 22, marginBottom: 10 }}>time slot</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                                        {TIME_SLOTS.map(t => {
                                            const isOn = t === selectedTime;
                                            return (
                                                <button key={t} onClick={() => setSelectedTime(t)}
                                                    style={{
                                                        padding: '10px 0', cursor: 'pointer',
                                                        background: isOn ? 'var(--ink)' : 'transparent',
                                                        color: isOn ? 'var(--paper)' : 'var(--ink)',
                                                        border: '1px solid', borderColor: isOn ? 'var(--ink)' : 'var(--rule)',
                                                        fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.04em',
                                                        transition: 'all 140ms',
                                                    }}>
                                                    {t}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Notes */}
                                    <div style={{ marginTop: 22 }}>
                                        <label className="cc-label" htmlFor="notes">what do you need done?</label>
                                        <textarea id="notes" className="cc-textarea" rows={3}
                                            placeholder="describe the job — be specific. photos help."
                                            value={notes} onChange={e => setNotes(e.target.value)}/>
                                    </div>

                                    {/* Estimate */}
                                    {contractor.hourly_rate && (
                                        <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--paper-2)',
                                                      borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>est. 2h duration</div>
                                                <div className="serif" style={{ fontSize: 22, fontWeight: 500, marginTop: 2 }}>{estCost}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>charged after</div>
                                                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>job is complete</div>
                                            </div>
                                        </div>
                                    )}

                                    <button onClick={handleBook} disabled={submitting}
                                        className="cc-btn cc-btn-signal cc-btn-lg"
                                        style={{ marginTop: 16, width: '100%' }}>
                                        {submitting
                                            ? 'sending request…'
                                            : `request · ${selectedDate.label}, ${selectedTime}`}
                                        {!submitting && <Icon name="arrow"/>}
                                    </button>
                                    <p className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', marginTop: 10 }}>
                                        no charge until {firstName} accepts
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
