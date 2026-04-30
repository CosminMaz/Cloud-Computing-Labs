import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import { useEffect, useState } from 'react';
import { getMe } from './services/api';

import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { Icon, Placeholder, Logotype } from './components/DesignSystem';

import SelectRole from './pages/SelectRole';
import ClientHome from './pages/client/ClientHome';
import ContractorProfile from './pages/client/ContractorProfile';
import ContractorDashboard from './pages/contractor/ContractorDashboard';

const DEMO_CARDS = [
    { name: 'Marisol Vega',    trade: 'electrical',  rate: 95,  rot: 'rotate(2deg)',  pos: { top: 0, right: 0 } },
    { name: 'Theo Becker',     trade: 'plumbing',    rate: 110, rot: 'rotate(-3deg)', pos: { top: 80, left: 0 } },
    { name: 'Wes Okonkwo',     trade: 'painting',    rate: 65,  rot: 'rotate(1deg)',  pos: { top: 240, right: 30 } },
];

function FeatureCard({ card, style }) {
    return (
        <div className="cc-card" style={{
            position: 'absolute', width: 290, overflow: 'hidden',
            boxShadow: '0 30px 60px -30px rgba(24,23,26,0.25)',
            transform: card.rot, ...card.pos, ...style,
        }}>
            <Placeholder label={`portrait · ${card.name.split(' ')[0].toLowerCase()}`} aspect="4/3"/>
            <div style={{ padding: 18 }}>
                <div className="cc-toprule" style={{ color: 'var(--signal)', marginBottom: 8 }}>
                    <span className="label-cap" style={{ color: 'var(--signal)' }}>featured</span>
                </div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{card.name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                    {card.trade} · ${card.rate}/hr
                </div>
            </div>
        </div>
    );
}

function LandingPage() {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || accounts.length === 0) return;
        const resolve = async () => {
            setChecking(true);
            try {
                const { idToken } = await instance.acquireTokenSilent({
                    scopes: ['openid', 'profile', 'email'], account: accounts[0],
                });
                try {
                    const { data } = await getMe(idToken);
                    navigate(data.role === 'contractor' ? '/contractor/dashboard' : '/client/home');
                } catch (err) {
                    if (err.response?.status === 404) navigate('/select-role');
                }
            } catch (err) {
                console.error('Token error', err);
            } finally {
                setChecking(false);
            }
        };
        resolve();
    }, [isAuthenticated, accounts, instance, navigate]);

    const handleLogin = () => instance.loginRedirect(loginRequest).catch(console.error);

    return (
        <div className="cc-paper" style={{ minHeight: '100vh' }}>
            <Navbar links={false}/>

            {/* Hero */}
            <section style={{ padding: '80px 40px 40px', maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 64, alignItems: 'end' }}>
                    <div>
                        <div className="cc-toprule" style={{ color: 'var(--signal)' }}>
                            <span className="label-cap" style={{ color: 'var(--signal)' }}>A directory of trades · since 2025</span>
                        </div>
                        <h1 className="serif" style={{ fontSize: 'clamp(52px,6vw,88px)', lineHeight: 0.95, fontWeight: 500, letterSpacing: '-0.035em' }}>
                            Find someone who<br/>
                            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>actually shows up</span>
                            <span style={{ color: 'var(--signal)' }}>.</span>
                        </h1>
                        <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: 520, marginTop: 28 }}>
                            CloudCRM is a small, honest directory of skilled solo contractors —
                            electricians, plumbers, carpenters, painters — who run real one-person
                            shops and answer their own phone. Browse by trade. Read what they do.
                            Book a window. That&apos;s it.
                        </p>
                        <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
                            <button className="cc-btn cc-btn-signal cc-btn-lg"
                                    onClick={handleLogin} disabled={checking}>
                                {checking ? 'Signing you in…' : 'Browse contractors'} <Icon name="arrow"/>
                            </button>
                            <button className="cc-btn cc-btn-outline cc-btn-lg"
                                    onClick={handleLogin} disabled={checking}>
                                I&apos;m a contractor →
                            </button>
                        </div>

                        <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32,
                                      paddingTop: 28, borderTop: '1px solid var(--rule)' }}>
                            {[['247','verified pros'],['12','trade categories'],['4.91','avg. rating']].map(([n,l]) => (
                                <div key={l}>
                                    <div className="serif" style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-0.02em' }}>{n}</div>
                                    <div className="label-cap" style={{ marginTop: 4 }}>{l}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ position: 'relative', height: 540 }}>
                        {DEMO_CARDS.map(card => <FeatureCard key={card.name} card={card}/>)}
                    </div>
                </div>
            </section>

            {/* Categories strip */}
            <section style={{ padding: '40px 40px 80px', maxWidth: 1280, margin: '0 auto' }}>
                <div className="cc-toprule"><span className="label-cap">browse by trade</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 0,
                              border: '1px solid var(--rule)', borderRadius: 8, overflow: 'hidden' }}>
                    {[['Electrical',42,'bolt'],['Plumbing',38,'settings'],['Carpentry',29,'edit'],
                      ['HVAC',21,'sparkle'],['Painting',54,'image'],['General',63,'grid']].map(([name,count,ico],i) => (
                        <a key={name} onClick={handleLogin}
                           style={{ padding: '24px 20px', borderRight: i < 5 ? '1px solid var(--rule)' : 'none',
                                    display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer',
                                    transition: 'background 140ms var(--ease-out)' }}
                           onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
                           onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Icon name={ico} size={18}/>
                            <div className="serif" style={{ fontSize: 20, fontWeight: 500, marginTop: 8 }}>{name}</div>
                            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{count} pros</div>
                        </a>
                    ))}
                </div>
            </section>

            <footer style={{ borderTop: '1px solid var(--rule)', padding: '28px 40px',
                             display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Logotype/>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.05em' }}>
                    © 2026 — built for people who work with their hands
                </span>
            </footer>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/select-role" element={<ProtectedRoute><SelectRole /></ProtectedRoute>} />
                <Route path="/client/home" element={<ProtectedRoute><ClientHome /></ProtectedRoute>} />
                <Route path="/client/contractors/:id" element={<ProtectedRoute><ContractorProfile /></ProtectedRoute>} />
                <Route path="/contractor/dashboard" element={<ProtectedRoute><ContractorDashboard /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
