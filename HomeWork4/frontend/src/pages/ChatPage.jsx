import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { getMe, getMessageHistory, markMessagesRead } from '../services/api';
import Navbar from '../components/Navbar';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE = BASE_URL.startsWith('https')
    ? BASE_URL.replace('https://', 'wss://')
    : BASE_URL.replace('http://', 'ws://');

export default function ChatPage() {
    const { userId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [myId, setMyId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [wsReady, setWsReady] = useState(false);
    const wsRef = useRef(null);
    const bottomRef = useRef(null);

    const otherName = state?.name || `User #${userId}`;
    const otherAvatar = state?.avatar || null;

    useEffect(() => {
        let ws;
        const init = async () => {
            try {
                const { idToken } = await instance.acquireTokenSilent({
                    scopes: ['openid', 'profile', 'email'],
                    account: accounts[0],
                });

                const { data: me } = await getMe(idToken);
                setMyId(me.id);

                const { data: history } = await getMessageHistory(idToken, userId);
                setMessages(history);
                setLoading(false);
                markMessagesRead(idToken, userId).catch(() => {});

                ws = new WebSocket(`${WS_BASE}/api/ws/${me.id}?token=${encodeURIComponent(idToken)}`);
                wsRef.current = ws;

                ws.onopen = () => setWsReady(true);
                ws.onclose = () => setWsReady(false);
                ws.onerror = (e) => console.error('WS error', e);
                ws.onmessage = (e) => {
                    const msg = JSON.parse(e.data);
                    if (String(msg.from_id) === String(userId) || String(msg.to_id) === String(userId)) {
                        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
                    }
                };
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        init();
        return () => ws?.close();
    }, [userId, instance, accounts]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const send = () => {
        const content = input.trim();
        if (!content || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ to: parseInt(userId), content }));
        setInput('');
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <>
            <Navbar />
            <div style={{
                maxWidth: 700,
                margin: '0 auto',
                padding: '80px 16px 0',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <button
                        className="btn btn-ghost"
                        style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>
                    {otherAvatar ? (
                        <img src={otherAvatar} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} alt={otherName} />
                    ) : (
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 600, fontSize: '1rem',
                        }}>
                            {otherName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{otherName}</div>
                        <div style={{ fontSize: '0.75rem', color: wsReady ? 'var(--success)' : 'var(--text-muted)' }}>
                            {wsReady ? '● Online' : '○ Connecting…'}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
                    {loading ? (
                        <div style={{ margin: 'auto', color: 'var(--text-muted)' }}>Loading…</div>
                    ) : messages.length === 0 ? (
                        <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>👋</div>
                            <div>No messages yet. Say hello!</div>
                        </div>
                    ) : messages.map((msg, i) => {
                        const isMine = String(msg.from_id) === String(myId);
                        return (
                            <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    maxWidth: '72%',
                                    padding: '8px 14px',
                                    borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    background: isMine ? 'var(--accent)' : 'var(--bg-elevated)',
                                    color: isMine ? '#fff' : 'var(--text-primary)',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.45,
                                    wordBreak: 'break-word',
                                }}>
                                    {msg.content}
                                    <div style={{ fontSize: '0.68rem', opacity: 0.65, marginTop: 4, textAlign: 'right' }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div style={{ display: 'flex', gap: 8, padding: '12px 0 16px' }}>
                    <textarea
                        className="input"
                        style={{ flex: 1, resize: 'none', minHeight: 44, maxHeight: 120, lineHeight: 1.4, padding: '10px 14px' }}
                        placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        rows={1}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={send}
                        disabled={!wsReady || !input.trim()}
                        style={{ alignSelf: 'flex-end', padding: '10px 22px' }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </>
    );
}
