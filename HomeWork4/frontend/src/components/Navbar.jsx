import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ balance = null }) {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const rawName = accounts[0]?.name || '';
    const name = rawName.toLowerCase() === 'unknown' ? '' : rawName;

    const isContractor = pathname.startsWith('/contractor');
    const isClient = pathname.startsWith('/client');

    const handleLogout = () => {
        instance.logoutRedirect({ postLogoutRedirectUri: '/' });
    };

    const navLinkStyle = (active) => ({
        fontSize: '0.85rem',
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--bg-elevated)' : 'transparent',
    });

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            height: '60px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 24px',
            background: 'rgba(13, 15, 20, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
        }}>
            <div className="flex items-center gap-4">
                <span
                    onClick={() => navigate('/')}
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1.3rem', color: '#e8541a', cursor: 'pointer' }}
                >
                    Reparo
                </span>

                {isAuthenticated && isContractor && (
                    <>
                        <span onClick={() => navigate('/contractor/dashboard')} style={navLinkStyle(pathname === '/contractor/dashboard')}>Dashboard</span>
                        <span onClick={() => navigate('/contractor/profile')} style={navLinkStyle(pathname === '/contractor/profile')}>My Profile</span>
                    </>
                )}
                {isAuthenticated && isClient && (
                    <>
                        <span onClick={() => navigate('/client/home')} style={navLinkStyle(pathname === '/client/home')}>Find Contractors</span>
                        <span onClick={() => navigate('/client/bookings')} style={navLinkStyle(pathname === '/client/bookings')}>My Bookings</span>
                    </>
                )}
            </div>

            {isAuthenticated && (
                <div className="flex items-center gap-3">
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.85rem' }}>
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{name}</span>
                    {balance !== null && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                            {balance.toFixed(2)} RON
                        </span>
                    )}
                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={handleLogout}>
                        Log out
                    </button>
                </div>
            )}
        </nav>
    );
}
