import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { upsertMe } from '../services/api';
import Navbar from '../components/Navbar';

export default function SelectRole() {
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(null);

    const handleSelect = async (role) => {
        setLoading(role);
        try {
            const tokenResponse = await instance.acquireTokenSilent({
                scopes: ['openid', 'profile', 'email'],
                account: accounts[0],
            });
            // Backend reads entra_id and email from the verified JWT — we only send role
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
            icon: '🔍',
            title: 'I\'m a Client',
            desc: 'I\'m looking to hire skilled contractors for my projects.',
        },
        {
            role: 'contractor',
            icon: '🛠️',
            title: 'I\'m a Contractor',
            desc: 'I offer professional services and want to find clients.',
        },
    ];

    return (
        <>
            <Navbar />
            <div style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 32, padding: '80px 24px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h1>Welcome to CloudCRM</h1>
                    <p style={{ marginTop: 8 }}>Before we begin, tell us who you are.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, width: '100%', maxWidth: 600 }}>
                    {options.map(({ role, icon, title, desc }) => (
                        <button
                            key={role}
                            onClick={() => handleSelect(role)}
                            disabled={loading !== null}
                            style={{
                                background: 'var(--bg-surface)',
                                border: `2px solid ${loading === role ? 'var(--accent)' : 'var(--border)'}`,
                                borderRadius: 'var(--radius-lg)',
                                padding: '32px 24px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', flexDirection: 'column', gap: 12,
                                textAlign: 'left', transition: 'all 0.2s ease',
                                opacity: loading && loading !== role ? 0.5 : 1,
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--accent)'; }}
                            onMouseLeave={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                            <span style={{ fontSize: '2.5rem' }}>{icon}</span>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{title}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</span>
                            {loading === role && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Setting up your account…</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
