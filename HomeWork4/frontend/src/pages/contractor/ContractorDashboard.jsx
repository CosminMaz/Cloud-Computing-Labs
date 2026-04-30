import { useState, useEffect, useRef, useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { getMyBookings, updateMyProfile, updateBookingStatus, uploadProfilePicture } from '../../services/api';
import { Icon, PulseDot } from '../../components/DesignSystem';

const STATUS_TAG = {
    pending:   'cc-tag-pending',
    confirmed: 'cc-tag-confirmed',
    completed: 'cc-tag-completed',
    cancelled: 'cc-tag-cancelled',
};

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function fmtDay(iso) {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' });
}

function Logotype() {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="serif" style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em' }}>
                Cloud<span style={{ fontStyle: 'italic', color: 'var(--signal)' }}>CRM</span>
            </span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--bone-3)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>shop</span>
        </div>
    );
}

function Sidebar({ active, bookings, onLogout }) {
    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    const thisWeekEarnings = useMemo(() => {
        const now = new Date();
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
        return bookings.filter(b => {
            const d = new Date(b.scheduled_at);
            return (b.status === 'confirmed' || b.status === 'completed') && d >= weekStart;
        }).length;
    }, [bookings]);

    return (
        <aside style={{
            borderRight: '1px solid var(--rule-dark)', padding: '20px 0',
            display: 'flex', flexDirection: 'column', gap: 4,
            width: 220, flexShrink: 0,
        }}>
            <div style={{ padding: '0 22px 22px' }}><Logotype/></div>

            <div style={{ padding: '0 12px' }}>
                {[
                    { id: 'inbox',    label: 'Bookings',   ico: 'inbox',    badge: pendingCount > 0 ? pendingCount : null },
                    { id: 'profile',  label: 'My profile', ico: 'user' },
                    { id: 'clients',  label: 'Clients',    ico: 'users' },
                ].map(it => (
                    <div key={it.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                        borderRadius: 4, cursor: 'pointer',
                        background: active === it.id ? 'var(--graphite-3)' : 'transparent',
                        color: active === it.id ? 'var(--bone)' : 'var(--bone-2)',
                        fontSize: 13,
                    }}>
                        <Icon name={it.ico} size={15}/>
                        <span style={{ flex: 1 }}>{it.label}</span>
                        {it.badge && (
                            <span className="mono" style={{
                                fontSize: 10, padding: '1px 6px', borderRadius: 999,
                                background: 'var(--signal)', color: '#fff',
                            }}>{it.badge}</span>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 'auto', padding: '12px 22px', borderTop: '1px solid var(--rule-dark)' }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--bone-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                    this week
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span className="serif" style={{ fontSize: 24, fontWeight: 500 }}>{weekStart_count(bookings)} jobs</span>
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--bone-3)', marginTop: 4 }}>
                    {bookings.filter(b => b.status === 'confirmed').length} confirmed
                </div>
                <button className="cc-btn cc-btn-ghost cc-btn-sm"
                        style={{ marginTop: 16, width: '100%', color: 'var(--bone-3)', fontSize: 11 }}
                        onClick={onLogout}>
                    sign out
                </button>
            </div>
        </aside>
    );
}

function weekStart_count(bookings) {
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    return bookings.filter(b => {
        const d = new Date(b.scheduled_at);
        return (b.status === 'confirmed' || b.status === 'completed') && d >= weekStart;
    }).length;
}

function BookingRow({ b, updating, onAccept, onDecline, onComplete }) {
    const [hover, setHover] = useState(false);
    return (
        <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            style={{
                borderBottom: '1px solid var(--rule-dark)',
                background: hover ? 'var(--graphite-2)' : 'transparent',
                transition: 'background 100ms',
                opacity: updating ? 0.5 : 1,
            }}>
            <td style={{ padding: '14px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--bone-3)' }}>
                #{b.id}
            </td>
            <td style={{ padding: '14px 12px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--bone)' }}>
                    {fmtDay(b.scheduled_at)} {fmtDate(b.scheduled_at)}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--bone-3)', marginTop: 2 }}>
                    {fmtTime(b.scheduled_at)}
                </div>
            </td>
            <td style={{ padding: '14px 12px', color: 'var(--bone-2)', maxWidth: 320 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.notes || '—'}
                </div>
            </td>
            <td style={{ padding: '14px 12px' }}>
                <span className={`cc-tag ${STATUS_TAG[b.status] || ''}`}>{b.status}</span>
            </td>
            <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                {b.status === 'pending' && (
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button onClick={onDecline} className="cc-btn cc-btn-sm cc-btn-ghost" disabled={updating}>
                            <Icon name="x" size={11}/> decline
                        </button>
                        <button onClick={onAccept} className="cc-btn cc-btn-sm cc-btn-signal" disabled={updating}>
                            <Icon name="check" size={11}/> accept
                        </button>
                    </div>
                )}
                {b.status === 'confirmed' && (
                    <button onClick={onComplete} className="cc-btn cc-btn-sm cc-btn-outline" disabled={updating}>
                        mark complete
                    </button>
                )}
                {(b.status === 'completed' || b.status === 'cancelled') && (
                    <span className="mono" style={{ fontSize: 11, color: 'var(--bone-3)' }}>—</span>
                )}
            </td>
        </tr>
    );
}

function ProfileEditor({ onSave }) {
    const { instance, accounts } = useMsal();
    const [name, setName] = useState('');
    const [skills, setSkills] = useState('');
    const [rate, setRate] = useState('');
    const [bio, setBio] = useState('');
    const [availability, setAvailability] = useState('weekdays · 7am–6pm');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const fileInputRef = useRef(null);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { idToken } = await instance.acquireTokenSilent({
                scopes: ['openid', 'profile', 'email'], account: accounts[0],
            });
            await updateMyProfile(idToken, {
                display_name: name,
                skills,
                hourly_rate: parseFloat(rate) || 0,
                bio,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2400);
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) { setUploadError('Please choose an image file.'); return; }
        if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be under 5 MB.'); return; }
        setUploading(true);
        setUploadError(null);
        try {
            const { idToken } = await instance.acquireTokenSilent({
                scopes: ['openid', 'profile', 'email'], account: accounts[0],
            });
            const { data } = await uploadProfilePicture(idToken, file);
            setProfileImageUrl(data.profile_image_url);
        } catch (err) {
            setUploadError(err.response?.data?.detail || 'Upload failed. Save your profile first.');
        } finally { setUploading(false); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--bone-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        edit · public profile
                    </div>
                    <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4 }}>
                        How clients see you
                    </h2>
                </div>
                <span className="mono" style={{ fontSize: 11, color: saved ? 'var(--moss)' : 'var(--bone-3)' }}>
                    {saved ? '✓ saved · just now' : 'not saved'}
                </span>
            </div>

            {/* Photo uploader */}
            <div style={{ padding: 18, border: '1px dashed var(--rule-dark-2)', borderRadius: 8,
                          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profile"
                         style={{ width: 64, height: 64, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}/>
                ) : (
                    <div style={{
                        width: 64, height: 64, background: 'var(--graphite-3)', flexShrink: 0,
                        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 1px, transparent 1px 8px)',
                        display: 'flex', alignItems: 'flex-end',
                    }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--bone-3)', padding: 4 }}>headshot</span>
                    </div>
                )}
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Profile photo</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--bone-3)', marginTop: 4 }}>
                        jpg / png / webp · up to 5mb
                    </div>
                    {uploadError && <div style={{ fontSize: 11, color: 'var(--rust)', marginTop: 4 }}>{uploadError}</div>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }}/>
                <button onClick={() => fileInputRef.current?.click()}
                        className="cc-btn cc-btn-sm cc-btn-outline" disabled={uploading}>
                    <Icon name="upload" size={13}/> {uploading ? 'uploading…' : 'change photo'}
                </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label className="cc-label">display name</label>
                    <input className="cc-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Smith"/>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label className="cc-label">trade · skills (comma-separated)</label>
                    <input className="cc-input" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Plumbing, Repipe, Hot-water"/>
                </div>
                <div>
                    <label className="cc-label">hourly rate</label>
                    <div style={{ position: 'relative' }}>
                        <span className="mono" style={{ position: 'absolute', left: 12, top: 11, color: 'var(--bone-3)', fontSize: 13 }}>$</span>
                        <input className="cc-input" value={rate} onChange={e => setRate(e.target.value)}
                            type="number" min="0" step="0.01" placeholder="e.g. 95"
                            style={{ paddingLeft: 22, paddingRight: 56, fontFamily: 'var(--mono)' }}/>
                        <span className="mono" style={{ position: 'absolute', right: 12, top: 11, color: 'var(--bone-3)', fontSize: 11 }}>/ hr</span>
                    </div>
                </div>
                <div>
                    <label className="cc-label">availability</label>
                    <select className="cc-select" value={availability} onChange={e => setAvailability(e.target.value)}>
                        <option>weekdays · 7am–6pm</option>
                        <option>weekdays + saturdays</option>
                        <option>flexible / on-call</option>
                    </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label className="cc-label">bio · 2–3 sentences</label>
                    <textarea className="cc-textarea" value={bio} onChange={e => setBio(e.target.value)}
                        placeholder="Tell clients a bit about yourself…"/>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--bone-3)' }}>
                        ↳ changes go live immediately
                    </span>
                    <button type="submit" className="cc-btn cc-btn-primary" disabled={saving}>
                        {saving ? 'saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function ContractorDashboard() {
    const { instance, accounts } = useMsal();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [filter, setFilter] = useState('all');

    const userName = accounts[0]?.name || '';

    useEffect(() => {
        const fetch = async () => {
            try {
                const { idToken } = await instance.acquireTokenSilent({
                    scopes: ['openid', 'profile', 'email'], account: accounts[0],
                });
                const { data } = await getMyBookings(idToken);
                setBookings(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [instance, accounts]);

    const handleLogout = () => instance.logoutRedirect({ postLogoutRedirectUri: '/' });

    const upd = async (id, status) => {
        setUpdating(id);
        try {
            const { idToken } = await instance.acquireTokenSilent({
                scopes: ['openid', 'profile', 'email'], account: accounts[0],
            });
            const { data } = await updateBookingStatus(idToken, id, status);
            setBookings(prev => prev.map(b => b.id === id ? data : b));
        } catch (err) { console.error(err); }
        finally { setUpdating(null); }
    };

    const counts = {
        all: bookings.length,
        pending:   bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };

    const filtered = useMemo(() => {
        if (filter === 'all') return bookings;
        return bookings.filter(b => b.status === filter);
    }, [bookings, filter]);

    const pendingCount = counts.pending;

    return (
        <div className="cc-graphite" style={{ minHeight: '100vh', display: 'flex' }}>
            <Sidebar active="inbox" bookings={bookings} onLogout={handleLogout}/>

            <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Header bar */}
                <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--rule-dark)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--bone-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Bookings · {userName || 'Contractor'}
                        </div>
                        <h1 className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', margin: '4px 0 0' }}>
                            {loading ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                                    <Icon name="spinner" size={20} style={{ animation: 'cc-spin 1s linear infinite' }}/>
                                    Loading…
                                </span>
                            ) : pendingCount > 0 ? `${pendingCount} need a decision` : 'all clear'}
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="cc-btn cc-btn-signal cc-btn-sm">
                            <Icon name="plus" size={13}/> add manually
                        </button>
                    </div>
                </div>

                {/* Stats strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--rule-dark)' }}>
                    {[
                        ['total',      counts.all,       'all bookings',   'var(--bone)'],
                        ['pending',    counts.pending,   'awaiting reply', 'var(--ochre)'],
                        ['confirmed',  counts.confirmed, 'on the book',    'var(--signal)'],
                        ['completed',  counts.completed, 'jobs done',      'var(--moss)'],
                    ].map(([l, v, sub, c]) => (
                        <div key={l} style={{ padding: '20px 24px', borderRight: '1px solid var(--rule-dark)' }}>
                            <div className="mono" style={{ fontSize: 10, color: 'var(--bone-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                {l}
                            </div>
                            <div className="serif" style={{ fontSize: 32, fontWeight: 500, color: c, marginTop: 6, letterSpacing: '-0.02em' }}>
                                {v}
                            </div>
                            <div className="mono" style={{ fontSize: 11, color: 'var(--bone-3)', marginTop: 2 }}>{sub}</div>
                        </div>
                    ))}
                </div>

                {/* Filter tabs */}
                <div style={{ padding: '14px 32px', borderBottom: '1px solid var(--rule-dark)',
                              display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {['all','pending','confirmed','completed','cancelled'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`cc-btn cc-btn-sm ${filter === f ? 'cc-btn-primary' : 'cc-btn-ghost'}`}
                                style={{ textTransform: 'lowercase' }}>
                                {f} <span className="mono" style={{ opacity: 0.6, marginLeft: 4 }}>{counts[f]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bookings table */}
                <div style={{ padding: '0 32px', overflowX: 'auto' }}>
                    {loading ? (
                        <div>
                            {[0,1,2,3,4].map(i => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 100px 1fr 100px 120px',
                                                      gap: 12, padding: '14px 12px', borderBottom: '1px solid var(--rule-dark)',
                                                      animation: `cc-fade-up 320ms var(--ease-out) ${i*40}ms backwards` }}>
                                    <div className="cc-skeleton" style={{ height: 14 }}/>
                                    <div className="cc-skeleton" style={{ height: 14 }}/>
                                    <div className="cc-skeleton" style={{ height: 14, width: '70%' }}/>
                                    <div className="cc-skeleton" style={{ height: 22, borderRadius: 999 }}/>
                                    <div className="cc-skeleton" style={{ height: 28 }}/>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ display: 'grid', placeItems: 'center', padding: '60px 32px' }}>
                            <div style={{ textAlign: 'center', maxWidth: 460 }}>
                                <div style={{ width: 64, height: 64, margin: '0 auto', border: '1px dashed var(--rule-dark-2)',
                                              borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                                    <Icon name="inbox" size={22} stroke={1.2}/>
                                </div>
                                <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, marginTop: 22, letterSpacing: '-0.02em' }}>
                                    {filter === 'all' ? 'No bookings yet.' : `No ${filter} bookings.`}
                                </h3>
                                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--bone-2)', marginTop: 14 }}>
                                    {filter === 'all'
                                        ? 'Once a client books a window, it\'ll land here. Fill out your profile to get discovered.'
                                        : 'No bookings match this filter.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--rule-dark)' }}>
                                    {['#', 'when', 'job notes', 'status', ''].map((h, i) => (
                                        <th key={i} className="mono" style={{
                                            textAlign: 'left', padding: '12px 12px',
                                            fontSize: 10, fontWeight: 500, color: 'var(--bone-3)',
                                            letterSpacing: '0.12em', textTransform: 'uppercase',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(b => (
                                    <BookingRow key={b.id} b={b} updating={updating === b.id}
                                        onAccept={() => upd(b.id, 'confirmed')}
                                        onDecline={() => upd(b.id, 'cancelled')}
                                        onComplete={() => upd(b.id, 'completed')}/>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Profile editor */}
                <div style={{ borderTop: '1px solid var(--rule-dark)', marginTop: 32, padding: 32 }}>
                    <ProfileEditor/>
                </div>
            </main>
        </div>
    );
}
