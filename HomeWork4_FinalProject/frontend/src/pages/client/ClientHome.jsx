import { useState, useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { getContractors } from '../../services/api';
import ContractorCard from '../../components/ContractorCard';
import Navbar from '../../components/Navbar';

const LIMIT = 20;

export default function ClientHome() {
    const { instance, accounts } = useMsal();
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const debounceTimer = useRef(null);

    const handleSearch = (value) => {
        setSearch(value);
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setPage(1);
            setDebouncedSearch(value);
        }, 350);
    };

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const { idToken } = await instance.acquireTokenSilent({ scopes: ['openid', 'profile', 'email'], account: accounts[0] });
                const { data } = await getContractors(idToken, { page, search: debouncedSearch, limit: LIMIT });
                setItems(data.items);
                setTotal(data.total);
                setPages(data.pages);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [page, debouncedSearch, instance, accounts]);

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <h1>Find a Contractor</h1>
                    <p>Browse skilled professionals and book your next appointment.</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
                    <input
                        className="input"
                        placeholder="🔍  Search by name, skill, location…"
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        style={{ maxWidth: 480, flex: 1 }}
                    />
                    {!loading && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                            {total} contractor{total !== 1 ? 's' : ''} found
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="empty-state"><span>⏳</span><p>Loading contractors…</p></div>
                ) : items.length === 0 ? (
                    <div className="empty-state">
                        <span>🔎</span>
                        <h3>No contractors found</h3>
                        <p>{debouncedSearch ? 'Try a different search term.' : 'No contractors have signed up yet.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid-3">
                            {items.map(c => <ContractorCard key={c.id} contractor={c} />)}
                        </div>

                        {pages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 }}>
                                <button
                                    className="btn btn-outline"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    ← Prev
                                </button>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Page {page} of {pages}
                                </span>
                                <button
                                    className="btn btn-outline"
                                    disabled={page >= pages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
