import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import ProtectedRoute from './components/ProtectedRoute';
import ClientHome from './pages/client/ClientHome';
import ContractorDashboard from './pages/contractor/ContractorDashboard';
import { useEffect } from 'react';

function LandingPage() {
    const { instance } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            // Temporarily routing everyone to the client dashboard.
            // When we connect the backend in Phase 2, this will check your database role!
            navigate('/client/home');
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = () => {
        instance.loginRedirect(loginRequest).catch(e => console.error(e));
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Welcome to Cloud CRM</h1>
            <p>Please log in to continue.</p>
            <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
                Sign In
            </button>
        </div>
    );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Protected Client Routes */}
        <Route path="/client/home" element={
            <ProtectedRoute>
                <ClientHome />
            </ProtectedRoute>
        } />

        {/* Protected Contractor Routes */}
        <Route path="/contractor/dashboard" element={
            <ProtectedRoute>
                <ContractorDashboard />
            </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
