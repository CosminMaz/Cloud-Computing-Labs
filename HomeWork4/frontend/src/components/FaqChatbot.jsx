import { useState, useRef, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { askChatbot } from '../services/api';

const GREETING = "Hi! Ask me anything about scheduling, rates, or coverage area.";

/**
 * Chat-style UI backed by Custom Question Answering. Sends user questions
 * through the backend (POST /api/chat/ask) so the CQA key stays server-side.
 */
export default function FaqChatbot({ title = 'FAQ Bot', subtitle, height = 420 }) {
    const { instance, accounts } = useMsal();
    const [messages, setMessages] = useState([{ role: 'bot', text: GREETING }]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, sending]);

    const handleSend = async (e) => {
        e.preventDefault();
        const question = input.trim();
        if (!question || sending) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: question }]);
        setSending(true);

        try {
            const { idToken } = await instance.acquireTokenSilent({
                scopes: ['openid', 'profile', 'email'],
                account: accounts[0],
            });
            const { data } = await askChatbot(idToken, question);
            setMessages(prev => [...prev, { role: 'bot', text: data.answer }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                <h3>💬 {title}</h3>
                {subtitle && <p style={{ fontSize: '0.8rem', marginTop: 4 }}>{subtitle}</p>}
            </div>

            <div
                ref={scrollRef}
                style={{
                    height,
                    overflowY: 'auto',
                    padding: '16px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    background: 'var(--bg-base)',
                }}
            >
                {messages.map((m, i) => (
                    <div
                        key={i}
                        style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '78%',
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-md)',
                            background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                            color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                            fontSize: '0.88rem',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        {m.text}
                    </div>
                ))}
                {sending && (
                    <div
                        style={{
                            alignSelf: 'flex-start',
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-muted)',
                            fontSize: '0.88rem',
                        }}
                    >
                        …thinking
                    </div>
                )}
            </div>

            <form
                onSubmit={handleSend}
                style={{
                    display: 'flex',
                    gap: 8,
                    padding: 16,
                    borderTop: '1px solid var(--border)',
                }}
            >
                <input
                    className="input"
                    placeholder="Type your question…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={sending}
                    style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
}
