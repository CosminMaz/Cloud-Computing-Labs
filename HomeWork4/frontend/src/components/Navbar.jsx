import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const navigate = useNavigate();
    const rawName = accounts[0]?.name || '';
    const name = rawName.toLowerCase() === 'unknown' ? '' : rawName;

    const handleLogout = () => {
        instance.logoutRedirect({ postLogoutRedirectUri: '/' });
    };

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            height: '60px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 24px',
            background: 'rgba(13, 15, 20, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
        }}>
            <span
                onClick={() => navigate('/')}
                style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
                Cloud<span style={{ color: 'var(--accent)' }}>CRM</span>
            </span>

            {isAuthenticated && (
                <div className="flex items-center gap-3">
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.85rem' }}>
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{name}</span>
                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={handleLogout}>
                        Log out
                    </button>
                </div>
            )}
        </nav>
    );
}
