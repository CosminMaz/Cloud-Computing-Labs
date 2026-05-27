import { useState, useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, updateMyProfile, uploadProfilePicture, getContractorReviews } from '../../services/api';
import Navbar from '../../components/Navbar';
import ReviewSection from '../../components/ReviewSection';

export default function ContractorProfilePage() {
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [reviewStats, setReviewStats] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
                const { data } = await getMyProfile(idToken);
                setProfile(data);
                try {
                    const { data: reviews } = await getContractorReviews(idToken, data.user_id);
                    setReviewStats(reviews);
                } catch { /* no reviews yet */ }
                setForm({
                    display_name: data.display_name || '',
                    skills: data.skills || '',
                    hourly_rate: data.hourly_rate ?? '',
                    bio: data.bio || '',
                    profile_image_url: data.profile_image_url || '',
                    ai_custom_prompt: data.ai_custom_prompt || '',
                    phone: data.phone || '',
                    contact_email: data.contact_email || '',
                    location: data.location || '',
                    years_experience: data.years_experience ?? '',
                    website: data.website || '',
                });
            } catch (err) {
                if (err.response?.status === 404) {
                    setEditing(true);
                    setForm({ display_name: '', skills: '', hourly_rate: '', bio: '', profile_image_url: '', ai_custom_prompt: '', phone: '', contact_email: '', location: '', years_experience: '', website: '' });
                } else {
                    console.error(err);
                }
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [instance, accounts]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data } = await updateMyProfile(idToken, {
                display_name: form.display_name,
                skills: form.skills,
                hourly_rate: parseFloat(form.hourly_rate) || 0,
                bio: form.bio,
                ai_custom_prompt: form.ai_custom_prompt || null,
                phone: form.phone || null,
                contact_email: form.contact_email || null,
                location: form.location || null,
                years_experience: parseInt(form.years_experience, 10) || 0,
                website: form.website || null,
            });
            setProfile(data);
            setForm(f => ({ ...f, profile_image_url: data.profile_image_url || f.profile_image_url }));
            setSaved(true);
            setEditing(false);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handleCancel = () => {
        setForm({
            display_name: profile.display_name || '',
            skills: profile.skills || '',
            hourly_rate: profile.hourly_rate ?? '',
            bio: profile.bio || '',
            profile_image_url: profile.profile_image_url || '',
            ai_custom_prompt: profile.ai_custom_prompt || '',
            phone: profile.phone || '',
            contact_email: profile.contact_email || '',
            location: profile.location || '',
            years_experience: profile.years_experience ?? '',
            website: profile.website || '',
        });
        setEditing(false);
    };

    const handlePickFile = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) { setUploadError('Please choose an image file.'); return; }
        if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be smaller than 5 MB.'); return; }
        setUploading(true);
        setUploadError(null);
        try {
            const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
            const { data } = await uploadProfilePicture(idToken, file);
            setProfile(p => ({ ...p, profile_image_url: data.profile_image_url }));
            setForm(f => ({ ...f, profile_image_url: data.profile_image_url }));
        } catch (err) {
            setUploadError(err.response?.data?.detail || 'Upload failed. Did you save your profile first?');
        } finally { setUploading(false); }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/client/contractors/${profile?.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const skills = profile?.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    if (loading) return <><Navbar /><div className="page"><div className="empty-state"><span>⏳</span></div></div></>;

    return (
        <>
            <Navbar />
            <div className="page" style={{ maxWidth: 1100 }}>
                <button className="btn btn-ghost" onClick={() => navigate('/contractor/dashboard')} style={{ marginBottom: 24 }}>
                    ← Back to Dashboard
                </button>

                <div className="page-header">
                    <h1>My Profile</h1>
                    <p>This is how clients see you on Reparo.</p>
                </div>

                {editing ? (
                    /* ── Edit Mode ─────────────────────────────────── */
                    <div className="card">
                        <h3 style={{ marginBottom: 20 }}>Edit Profile</h3>

                        {/* Profile picture */}
                        <div className="flex items-center gap-4" style={{ marginBottom: 24 }}>
                            {form.profile_image_url ? (
                                <img src={form.profile_image_url} alt="Profile"
                                    style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                            ) : (
                                <div className="avatar avatar-lg">📷</div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                <button type="button" className="btn btn-outline" onClick={handlePickFile} disabled={uploading}>
                                    {uploading ? 'Uploading…' : form.profile_image_url ? 'Change picture' : 'Upload picture'}
                                </button>
                                {uploadError && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{uploadError}</span>}
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>JPG, PNG, WEBP or GIF — up to 5 MB.</span>
                            </div>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group">
                                <label htmlFor="display_name">Display Name</label>
                                <input id="display_name" className="input" placeholder="e.g. Jane Smith" required
                                    value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="skills">Skills (comma-separated)</label>
                                <input id="skills" className="input" placeholder="e.g. Plumbing, Electrical, Painting"
                                    value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                <div>
                                    <label htmlFor="hourly_rate">Hourly Rate (RON)</label>
                                    <input id="hourly_rate" type="number" min="0" step="1" className="input" placeholder="e.g. 150"
                                        value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} />
                                </div>
                                <div>
                                    <label htmlFor="years_experience">Years of Experience</label>
                                    <input id="years_experience" type="number" min="0" step="1" className="input" placeholder="e.g. 5"
                                        value={form.years_experience} onChange={e => setForm(f => ({ ...f, years_experience: e.target.value }))} />
                                </div>
                                <div>
                                    <label htmlFor="location">Location</label>
                                    <input id="location" className="input" placeholder="e.g. Bucharest, RO"
                                        value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                                </div>
                            </div>
                            
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                <div>
                                    <label htmlFor="phone">Public Phone</label>
                                    <input id="phone" type="tel" className="input" placeholder="+40 700 000 000"
                                        value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                                </div>
                                <div>
                                    <label htmlFor="contact_email">Public Email</label>
                                    <input id="contact_email" type="email" className="input" placeholder="contact@example.com"
                                        value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                                </div>
                                <div>
                                    <label htmlFor="website">Website / Portfolio</label>
                                    <input id="website" type="url" className="input" placeholder="https://"
                                        value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="bio">Bio</label>
                                <textarea id="bio" className="textarea" placeholder="Tell clients a bit about yourself…"
                                    value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="ai_custom_prompt">AI Assistant Instructions</label>
                                <textarea id="ai_custom_prompt" className="textarea"
                                    placeholder="e.g. I'm available Mon–Fri 8am–6pm. I don't handle emergency calls. Minimum charge is 150 RON."
                                    value={form.ai_custom_prompt}
                                    onChange={e => setForm(f => ({ ...f, ai_custom_prompt: e.target.value }))}
                                    style={{ minHeight: 100 }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    This text is sent to the AI assistant so it can answer client questions accurately. Leave blank to use only your public profile.
                                </span>
                            </div>
                            <div className="flex gap-3 items-center">
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</button>
                                {profile && <button type="button" className="btn btn-outline" onClick={handleCancel}>Cancel</button>}
                            </div>
                        </form>
                    </div>
                ) : (
                    /* ── View Mode ─────────────────────────────────── */
                    <div className="profile-layout">
                    <div className="profile-layout-left">
                    <div className="card">
                        <div className="flex items-center gap-4" style={{ marginBottom: 24 }}>
                            {profile?.profile_image_url ? (
                                <img src={profile.profile_image_url} alt={profile.display_name}
                                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                            ) : (
                                <div className="avatar avatar-lg" style={{ width: 80, height: 80, fontSize: '1.5rem' }}>
                                    {(profile?.display_name || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <h2 style={{ marginBottom: 6 }}>{profile?.display_name}</h2>
                                {profile?.hourly_rate > 0 && (
                                    <span className="badge badge-accent">{profile.hourly_rate} RON/hr</span>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                            <div className="grid-3" style={{ gap: 16 }}>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Phone</div>
                                    <div>{profile?.phone || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Email</div>
                                    <div>{profile?.contact_email || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Location</div>
                                    <div>{profile?.location || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Experience</div>
                                    <div>{profile?.years_experience ? `${profile.years_experience} years` : '—'}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Website</div>
                                    {profile?.website ? (
                                        <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                                            {profile.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    ) : '—'}
                                </div>
                            </div>
                        </div>

                        {profile?.bio && (
                            <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>{profile.bio}</p>
                        )}

                        {skills.length > 0 && (
                            <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: 20 }}>
                                {skills.map(s => <span key={s} className="badge badge-accent">{s}</span>)}
                            </div>
                        )}

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                AI assistant instructions: {profile?.ai_custom_prompt
                                    ? <span style={{ color: 'var(--success)' }}>✓ Configured</span>
                                    : <span style={{ color: 'var(--warning)' }}>Not set — using public profile only</span>
                                }
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
                            <button className="btn btn-outline" onClick={handleCopyLink}>
                                {copied ? '✓ Copied!' : '🔗 Copy profile link'}
                            </button>
                        </div>
                        {saved && <span style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: 8, display: 'block' }}>✓ Profile saved!</span>}
                    </div>
                    </div>
                    <div className="profile-layout-right">
                    <ReviewSection
                        reviewStats={reviewStats}
                        myReview={null}
                        canReview={false}
                        onSubmit={() => {}}
                        submitting={false}
                    />
                    </div>
                    </div>
                )}
            </div>
        </>
    );
}
