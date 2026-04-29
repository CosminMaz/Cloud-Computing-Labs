import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { getContractors } from '../../services/api';
import ContractorCard from '../../components/ContractorCard';
import Navbar from '../../components/Navbar';

export default function ClientHome() {
    const { instance, accounts } = useMsal();
    const [contractors, setContractors] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContractors = async () => {
            try {
                const { idToken } = await instance.acquireTokenSilent({
                    scopes: ['openid', 'profile', 'email'],
                    account: accounts[0],
                });
                const { data } = await getContractors(idToken);
                setContractors(data);
                setFiltered(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchContractors();
    }, [instance, accounts]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            contractors.filter(c =>
                c.display_name.toLowerCase().includes(q) ||
                (c.skills || '').toLowerCase().includes(q) ||
                (c.bio || '').toLowerCase().includes(q)
            )
        );
    }, [search, contractors]);

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <h1>Find a Contractor</h1>
                    <p>Browse skilled professionals and book your next appointment.</p>
                </div>

                <input
                    className="input"
                    placeholder="🔍  Search by name, skill, or keyword…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ marginBottom: 28, maxWidth: 480 }}
                />

                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading contractors…</p></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <span>🔎</span>
                        <h3>No contractors found</h3>
                        <p>{search ? 'Try a different search term.' : 'No contractors have signed up yet.'}</p>
                    </div>
                ) : (
                    <div className="grid-3">
                        {filtered.map(c => <ContractorCard key={c.id} contractor={c} />)}
                    </div>
                )}
            </div>
        </>
    );
}
