import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { upsertMe } from '../services/api';
import Navbar from '../components/Navbar';
import { Icon } from '../components/DesignSystem';

export default function SelectRole() {
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(null);
    const [hovered, setHovered] = useState(null);

    const handleSelect = async (role) => {
        setLoading(role);
        try {
            const tokenResponse = await instance.acquireTokenSilent({
                scopes: ['openid', 'profile', 'email'],
                account: accounts[0],
            });
            await upsertMe(tokenResponse.idToken, { role });
            navigate(role === 'client' ? '/client/home' : '/contractor/dashboard');
        } catch (err) {
            console.error(err);
            setLoading(null);
        }
    };

    const options = [
        {
            role: 'client',
            meta: 'most people start here',
            title: 'I need to hire someone',
            sub: 'Find a vetted contractor and book a time window. No quotes you have to chase.',
            action: 'browse contractors',
        },
        {
            role: 'contractor',
            meta: 'for the trades',
            title: 'I take on jobs',
            sub: 'Build a public profile, set your rate, and get bookings sent to your inbox.',
            action: 'set up my shop',
        },
    ];

    return (
        <div className="cc-paper" style={{ minHeight: '100vh' }}>
            <Navbar links={false}/>
            <section style={{ padding: '80px 40px', maxWidth: 1080, margin: '0 auto' }}>
                <div className="cc-toprule"><span className="label-cap">welcome to cloudcrm</span></div>
                <h1 className="serif" style={{ fontSize: 'clamp(40px,5vw,56px)', lineHeight: 1.05, fontWeight: 500, letterSpacing: '-0.03em', margin: 0 }}>
                    Which side of the<br/>workshop are you on?
                </h1>
                <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: 460, marginTop: 18 }}>
                    You can always switch later — pick what you&apos;re here for today.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 56 }}>
                    {options.map(opt => (
                        <button key={opt.role}
                            onMouseEnter={() => setHovered(opt.role)}
                            onMouseLeave={() => setHovered(null)}
                            onClick={() => handleSelect(opt.role)}
                            disabled={loading !== null}
                            className="cc-card"
                            style={{
                                padding: 0, textAlign: 'left', cursor: loading ? 'not-allowed' : 'pointer',
                                background: hovered === opt.role ? 'var(--ink)' : '#fbf8f1',
                                color: hovered === opt.role ? 'var(--paper)' : 'var(--ink)',
                                transition: 'all 220ms var(--ease-out)',
                                transform: hovered === opt.role ? 'translateY(-2px)' : 'translateY(0)',
                                border: '1px solid var(--rule)',
                                opacity: loading && loading !== opt.role ? 0.5 : 1,
                            }}>
                            <div style={{ padding: '32px 32px 24px',
                                          borderBottom: hovered === opt.role ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--rule)' }}>
                                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                                    color: hovered === opt.role ? 'var(--signal)' : 'var(--ink-3)' }}>
                                    · {opt.meta}
                                </div>
                                <div className="serif" style={{ fontSize: 'clamp(28px,3vw,38px)', lineHeight: 1.05, fontWeight: 500, marginTop: 18, letterSpacing: '-0.025em' }}>
                                    {opt.title}
                                </div>
                                <div style={{ fontSize: 14, lineHeight: 1.55, marginTop: 16, opacity: 0.85, maxWidth: 360 }}>
                                    {opt.sub}
                                </div>
                            </div>
                            <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="mono" style={{ fontSize: 12, letterSpacing: '0.04em' }}>
                                    {loading === opt.role ? 'setting up…' : opt.action}
                                </span>
                                <Icon name="arrow" size={18}/>
                            </div>
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: 48, fontSize: 12, color: 'var(--ink-3)' }} className="mono">
                    ↳ this only takes a sec — you can edit your profile at any time.
                </div>
            </section>
        </div>
    );
}
