import { useState, useEffect, useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { getContractors } from '../../services/api';
import ContractorCard from '../../components/ContractorCard';
import Navbar from '../../components/Navbar';
import { Icon } from '../../components/DesignSystem';

const TRADES = ['all', 'electrical', 'plumbing', 'carpentry', 'hvac', 'painting', 'general'];

function LoadingGrid() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 24 }}>
            {[0,1,2,3,4,5].map(i => (
                <div key={i} className="cc-card" style={{ overflow: 'hidden', padding: 0,
                    animation: `cc-fade-up 320ms var(--ease-out) ${i*50}ms backwards` }}>
                    <div className="cc-skeleton" style={{ aspectRatio: '4/3', borderRadius: 0 }}/>
                    <div style={{ padding: 22 }}>
                        <div className="cc-skeleton" style={{ height: 24, width: '70%' }}/>
                        <div className="cc-skeleton" style={{ height: 12, width: '90%', marginTop: 16 }}/>
                        <div className="cc-skeleton" style={{ height: 12, width: '60%', marginTop: 6 }}/>
                        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                            <div className="cc-skeleton" style={{ height: 22, width: 60, borderRadius: 999 }}/>
                            <div className="cc-skeleton" style={{ height: 22, width: 80, borderRadius: 999 }}/>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ search }) {
    return (
        <div style={{ textAlign: 'center', maxWidth: 480, margin: '80px auto 0' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto', border: '1px solid var(--rule)',
                          borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                <Icon name="search" size={20} stroke={1.2}/>
            </div>
            <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, marginTop: 22, letterSpacing: '-0.02em' }}>
                Nobody matches <span style={{ fontStyle: 'italic' }}>that</span>.
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', marginTop: 14 }}>
                {search
                    ? `No results for "${search}". Try a broader trade name or check your spelling.`
                    : 'No contractors have signed up in this category yet.'}
            </p>
        </div>
    );
}

export default function ClientHome() {
    const { instance, accounts } = useMsal();
    const [contractors, setContractors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTrade, setActiveTrade] = useState('all');
    const [sort, setSort] = useState('relevant');

    useEffect(() => {
        const fetch = async () => {
            try {
                const { idToken } = await instance.acquireTokenSilent({
                    scopes: ['openid', 'profile', 'email'], account: accounts[0],
                });
                const { data } = await getContractors(idToken);
                setContractors(data);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [instance, accounts]);

    const filtered = useMemo(() => {
        let r = contractors;
        if (activeTrade !== 'all') r = r.filter(c => (c.skills || '').toLowerCase().includes(activeTrade));
        if (search) {
            const q = search.toLowerCase();
            r = r.filter(c =>
                c.display_name.toLowerCase().includes(q) ||
                (c.skills || '').toLowerCase().includes(q) ||
                (c.bio || '').toLowerCase().includes(q)
            );
        }
        if (sort === 'rate') r = [...r].sort((a,b) => a.hourly_rate - b.hourly_rate);
        return r;
    }, [contractors, search, activeTrade, sort]);

    return (
        <div className="cc-paper" style={{ minHeight: '100vh' }}>
            <Navbar/>

            <section style={{ padding: '56px 40px 24px', maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, flexWrap: 'wrap' }}>
                    <div>
                        <div className="cc-toprule"><span className="label-cap">find a pro</span></div>
                        <h1 className="serif" style={{ fontSize: 'clamp(40px,4vw,56px)', lineHeight: 1, fontWeight: 500, letterSpacing: '-0.028em', margin: 0 }}>
                            {loading ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, color: 'var(--ink-3)' }}>
                                    <Icon name="spinner" size={28} style={{ animation: 'cc-spin 1s linear infinite' }}/>
                                    gathering pros…
                                </span>
                            ) : (
                                <>
                                    <span style={{ color: 'var(--signal)' }}>{filtered.length}</span>{' '}
                                    {filtered.length === 1 ? 'contractor' : 'contractors'}<br/>
                                    <span style={{ fontStyle: 'italic', fontWeight: 400 }}>within reach</span>.
                                </>
                            )}
                        </h1>
                    </div>
                    {!loading && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>sort</span>
                            {['relevant','rate'].map(s => (
                                <button key={s} onClick={() => setSort(s)}
                                    className={`cc-btn cc-btn-sm ${sort === s ? 'cc-btn-primary' : 'cc-btn-ghost'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search + filter */}
                <div style={{ marginTop: 36, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
                              paddingBottom: 16, borderBottom: '1px solid var(--rule)' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 480 }}>
                        <Icon name="search" size={14} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--ink-3)' }}/>
                        <input className="cc-input" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="search by name, trade, or what needs fixing…"
                            style={{ paddingLeft: 38 }}/>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {TRADES.map(t => (
                            <button key={t} onClick={() => setActiveTrade(t)}
                                className={`cc-btn cc-btn-sm ${activeTrade === t ? 'cc-btn-primary' : 'cc-btn-ghost'}`}
                                style={{ textTransform: 'lowercase' }}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section style={{ padding: '32px 40px 80px', maxWidth: 1280, margin: '0 auto' }}>
                {error ? (
                    <div style={{ textAlign: 'center', maxWidth: 520, margin: '40px auto 0' }}>
                        <div className="cc-toprule" style={{ color: 'var(--rust)', justifyContent: 'center' }}>
                            <span className="label-cap" style={{ color: 'var(--rust)' }}>connection · interrupted</span>
                        </div>
                        <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 12 }}>
                            Can&apos;t reach the directory right now.
                        </h3>
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', marginTop: 12 }}>
                            Either we&apos;re having a moment, or your connection is. Refresh to try again.
                        </p>
                        <button className="cc-btn cc-btn-signal cc-btn-lg"
                                style={{ marginTop: 20 }}
                                onClick={() => window.location.reload()}>
                            Try again <Icon name="arrow"/>
                        </button>
                    </div>
                ) : loading ? (
                    <LoadingGrid/>
                ) : filtered.length === 0 ? (
                    <EmptyState search={search}/>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 24 }}>
                        {filtered.map((c, i) => <ContractorCard key={c.id} contractor={c} delay={i * 40}/>)}
                    </div>
                )}
            </section>
        </div>
    );
}
