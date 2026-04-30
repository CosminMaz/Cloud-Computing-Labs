import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, PulseDot } from './DesignSystem';

export default function ContractorCard({ contractor, delay = 0 }) {
    const navigate = useNavigate();
    const [hover, setHover] = useState(false);
    const skills = contractor.skills
        ? contractor.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)
        : [];

    return (
        <article
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => navigate(`/client/contractors/${contractor.id}`)}
            className="cc-card"
            style={{
                overflow: 'hidden', cursor: 'pointer',
                animation: `cc-fade-up 360ms var(--ease-out) ${delay}ms backwards`,
                transition: 'transform 220ms var(--ease-out), border-color 220ms var(--ease-out), box-shadow 220ms var(--ease-out)',
                transform: hover ? 'translateY(-3px)' : 'none',
                borderColor: hover ? 'var(--ink)' : 'var(--rule)',
                boxShadow: hover ? '0 20px 40px -20px rgba(24,23,26,0.18)' : 'none',
            }}>
            {/* Image area */}
            <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden',
                          background: 'var(--paper-2)',
                          backgroundImage: 'repeating-linear-gradient(135deg, rgba(24,23,26,.05) 0 1px, transparent 1px 8px)',
                          display: 'flex', alignItems: 'flex-end' }}>
                {contractor.profile_image_url ? (
                    <img src={contractor.profile_image_url} alt={contractor.display_name}
                         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
                ) : (
                    <span className="cc-placeholder-tag">{contractor.display_name.split(' ')[0].toLowerCase()} · portrait</span>
                )}
                <div style={{
                    position: 'absolute', top: 12, right: 12, padding: '4px 10px',
                    background: 'var(--paper)', border: '1px solid var(--rule)',
                    fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500,
                }}>
                    ${contractor.hourly_rate}<span style={{ color: 'var(--ink-3)' }}>/hr</span>
                </div>
                <div style={{
                    position: 'absolute', bottom: 12, left: 12, padding: '4px 10px',
                    background: 'var(--ink)', color: 'var(--paper)',
                    fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <PulseDot color="var(--moss)" size={5}/> available
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '20px 22px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <h3 className="serif" style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
                        {contractor.display_name}
                    </h3>
                    {contractor.hourly_rate && (
                        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                            <Icon name="star" size={11} style={{ verticalAlign: '-1px', color: 'var(--signal)' }}/> 4.9
                        </span>
                    )}
                </div>

                {contractor.bio && (
                    <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 14,
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {contractor.bio}
                    </p>
                )}

                {skills.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
                        {skills.map(s => (
                            <span key={s} className="cc-tag cc-tag-skill cc-tag-plain">{s}</span>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--rule)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        view profile &amp; book
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                                   color: hover ? 'var(--signal)' : 'var(--ink)', transition: 'color 140ms' }}>
                        <Icon name="arrow" size={14}/>
                    </span>
                </div>
            </div>
        </article>
    );
}
