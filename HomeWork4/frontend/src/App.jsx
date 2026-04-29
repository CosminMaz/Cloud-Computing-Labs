import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import { useEffect, useState } from 'react';
import { getMe } from './services/api';

import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import SelectRole from './pages/SelectRole';
import ClientHome from './pages/client/ClientHome';
import ContractorProfile from './pages/client/ContractorProfile';
import ContractorDashboard from './pages/contractor/ContractorDashboard';

function LandingPage() {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || accounts.length === 0) return;

        const resolveRole = async () => {
            setChecking(true);
            try {
                const { idToken } = await instance.acquireTokenSilent({
                    scopes: ['openid', 'profile', 'email'],
                    account: accounts[0],
                });

                try {
                    // User already exists in DB — route by their saved role
                    const { data } = await getMe(idToken);
                    navigate(data.role === 'contractor' ? '/contractor/dashboard' : '/client/home');
                } catch (err) {
                    if (err.response?.status === 404) {
                        // First time logging in — ask them to pick a role
                        navigate('/select-role');
                    }
                }
            } catch (err) {
                console.error('Token error', err);
            } finally {
                setChecking(false);
            }
        };

        resolveRole();
    }, [isAuthenticated, accounts, instance, navigate]);

    const handleLogin = () => instance.loginRedirect(loginRequest).catch(console.error);

    return (
        <>
            <Navbar />
            <div style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 24, padding: '80px 24px',
                textAlign: 'center',
            }}>
                <div style={{
                    fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #f0f2f8 0%, #6366f1 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    CloudCRM
                </div>
                <p style={{ maxWidth: 400 }}>
                    The modern marketplace connecting skilled contractors with clients who need them.
                </p>
                <button
                    className="btn btn-primary"
                    onClick={handleLogin}
                    disabled={checking}
                    style={{ fontSize: '1rem', padding: '12px 32px' }}
                >
                    {checking ? 'Signing you in…' : 'Get Started →'}
                </button>
            </div>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/select-role" element={<ProtectedRoute><SelectRole /></ProtectedRoute>} />

                {/* Client Routes */}
                <Route path="/client/home" element={<ProtectedRoute><ClientHome /></ProtectedRoute>} />
                <Route path="/client/contractors/:id" element={<ProtectedRoute><ContractorProfile /></ProtectedRoute>} />

                {/* Contractor Routes */}
                <Route path="/contractor/dashboard" element={<ProtectedRoute><ContractorDashboard /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
