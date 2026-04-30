import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { Logotype } from './DesignSystem';

export default function Navbar({ links = true }) {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const navigate = useNavigate();
    const rawName = accounts[0]?.name || '';
    const name = rawName.toLowerCase() === 'unknown' ? '' : rawName;
    const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const handleLogout = () => instance.logoutRedirect({ postLogoutRedirectUri: '/' });

    return (
        <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 40px', borderBottom: '1px solid var(--rule)',
            background: 'rgba(245, 241, 234, 0.92)', backdropFilter: 'blur(8px)',
            position: 'sticky', top: 0, zIndex: 100,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <Logotype />
                </div>
                {links && (
                    <nav style={{ display: 'flex', gap: 24 }}>
                        <a onClick={() => navigate('/client/home')}
                           className="mono" style={{ fontSize: 12, color: 'var(--ink)', textDecoration: 'none', letterSpacing: '0.04em', cursor: 'pointer' }}>
                            find a pro
                        </a>
                        <a className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none', letterSpacing: '0.04em', cursor: 'pointer' }}>
                            how it works
                        </a>
                    </nav>
                )}
            </div>

            {isAuthenticated ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>signed in as</span>
                    <span style={{ fontSize: 13, color: 'var(--ink)' }}>{name}</span>
                    <div style={{
                        width: 30, height: 30, borderRadius: '50%', background: 'var(--ink)',
                        color: 'var(--paper)', display: 'grid', placeItems: 'center',
                        fontSize: 11, fontWeight: 500, flexShrink: 0,
                    }}>
                        {initials || '?'}
                    </div>
                    <button className="cc-btn cc-btn-ghost cc-btn-sm"
                            style={{ color: 'var(--ink-3)', fontSize: 11 }}
                            onClick={handleLogout}>
                        sign out
                    </button>
                </div>
            ) : (
                <button className="cc-btn cc-btn-primary cc-btn-sm">Sign in</button>
            )}
        </header>
    );
}
