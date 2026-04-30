import { useState, useRef, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { askChatbot } from '../services/api';
import { Icon, PulseDot } from './DesignSystem';

const SUGGESTIONS = [
    'Do you do emergency calls?',
    'How far do you travel?',
    'What\'s your hourly rate?',
    'Are you licensed?',
];

export default function FaqChatbot({ contractorName = 'their' }) {
    const { instance, accounts } = useMsal();
    const [messages, setMessages] = useState([
        { role: 'bot', text: `Hi — I'm ${contractorName}'s digital answer-line. Ask anything before you book.` },
    ]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, sending]);

    const handleSend = async (question) => {
        const q = (question || input).trim();
        if (!q || sending) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: q }]);
        setSending(true);
        try {
            const { idToken } = await instance.acquireTokenSilent({
                scopes: ['openid', 'profile', 'email'], account: accounts[0],
            });
            const { data } = await askChatbot(idToken, q);
            setMessages(prev => [...prev, { role: 'bot', text: data.answer }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
        } finally {
            setSending(false);
        }
    };

    const showSuggestions = messages.length <= 2 && !sending;

    return (
        <div style={{ marginTop: 36 }}>
            <div className="label-cap" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                ask before you book <PulseDot/>
            </div>

            <div className="cc-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div ref={scrollRef} style={{
                    padding: '20px 22px', maxHeight: 280, overflowY: 'auto',
                    display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '78%', padding: '10px 14px',
                            background: m.role === 'user' ? 'var(--ink)' : 'var(--paper-2)',
                            color: m.role === 'user' ? 'var(--paper)' : 'var(--ink)',
                            fontSize: 13.5, lineHeight: 1.5, borderRadius: 4,
                            animation: 'cc-fade-up 220ms var(--ease-out)',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                            {m.text}
                        </div>
                    ))}
                    {sending && (
                        <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: 'var(--paper-2)', borderRadius: 4 }}>
                            <span style={{ display: 'inline-flex', gap: 4 }}>
                                {[0,1,2].map(i => (
                                    <span key={i} style={{
                                        width: 5, height: 5, borderRadius: '50%', background: 'var(--ink-3)',
                                        animation: `cc-pulse-dot 1.2s ${i*0.15}s infinite`,
                                        display: 'inline-block',
                                    }}/>
                                ))}
                            </span>
                        </div>
                    )}
                </div>

                {showSuggestions && (
                    <div style={{ padding: '0 22px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {SUGGESTIONS.map(s => (
                            <button key={s} onClick={() => handleSend(s)}
                                className="cc-btn cc-btn-sm cc-btn-ghost"
                                style={{ background: 'var(--paper-2)', fontSize: 11.5 }}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={e => { e.preventDefault(); handleSend(); }}
                      style={{ padding: 14, borderTop: '1px solid var(--rule)', display: 'flex', gap: 8 }}>
                    <input className="cc-input" placeholder="type a question…"
                        value={input} onChange={e => setInput(e.target.value)}
                        disabled={sending} style={{ flex: 1 }}/>
                    <button type="submit" className="cc-btn cc-btn-primary" disabled={!input.trim() || sending}>
                        <Icon name="arrow" size={14}/>
                    </button>
                </form>
            </div>
        </div>
    );
}
