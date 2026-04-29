import { useNavigate } from 'react-router-dom';

export default function ContractorCard({ contractor }) {
    const navigate = useNavigate();
    const initials = contractor.display_name
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const skills = contractor.skills
        ? contractor.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex items-center gap-3">
                {contractor.profile_image_url ? (
                    <img
                        src={contractor.profile_image_url}
                        alt={contractor.display_name}
                        style={{
                            width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
                            border: '1px solid var(--border)', flexShrink: 0,
                        }}
                    />
                ) : (
                    <div className="avatar avatar-lg">{initials}</div>
                )}
                <div>
                    <h3 style={{ color: 'var(--text-primary)' }}>{contractor.display_name}</h3>
                    <span className="badge badge-accent">
                        ${contractor.hourly_rate}/hr
                    </span>
                </div>
            </div>

            {contractor.bio && (
                <p style={{ fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {contractor.bio}
                </p>
            )}

            {skills.length > 0 && (
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {skills.map(skill => (
                        <span key={skill} className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{skill}</span>
                    ))}
                </div>
            )}

            <button
                className="btn btn-primary"
                style={{ marginTop: 'auto' }}
                onClick={() => navigate(`/client/contractors/${contractor.id}`)}
            >
                View Profile & Book
            </button>
        </div>
    );
}
