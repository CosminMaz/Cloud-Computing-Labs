import { useState } from 'react';
import Stars from './Stars';

const PAGE_SIZE = 5;

export default function ReviewSection({ reviewStats, myReview, canReview, onSubmit, submitting }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [page, setPage] = useState(1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rating) return;
        await onSubmit({ rating, comment: comment || null });
    };

    return (
        <div className="card">
            {/* Header + aggregate */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Reviews</h3>
                {reviewStats?.review_count > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Stars value={Math.round(reviewStats.avg_rating)} size="1rem" />
                        <strong>{reviewStats.avg_rating}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            ({reviewStats.review_count} review{reviewStats.review_count !== 1 ? 's' : ''})
                        </span>
                    </div>
                )}
            </div>

            {/* Distribution bars */}
            {reviewStats?.review_count > 0 && (
                <div style={{ marginBottom: 20 }}>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = reviewStats.distribution[star] || 0;
                        const pct = (count / reviewStats.review_count) * 100;
                        return (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: '0.8rem' }}>
                                <span style={{ color: '#f59e0b', whiteSpace: 'nowrap' }}>{star} ★</span>
                                <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 3, transition: 'width 0.3s' }} />
                                </div>
                                <span style={{ color: 'var(--text-muted)', minWidth: 16, textAlign: 'right' }}>{count}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Submit / existing review */}
            {myReview ? (
                <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    <Stars value={myReview.rating} size="1rem" />
                    <strong style={{ marginLeft: 6 }}>Your review</strong>
                    {myReview.comment && <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>{myReview.comment}</p>}
                </div>
            ) : canReview ? (
                <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>Leave a review</div>
                    <Stars
                        value={rating}
                        interactive
                        hover={hover}
                        size="1.6rem"
                        onHover={setHover}
                        onLeave={() => setHover(0)}
                        onClick={setRating}
                    />
                    <textarea
                        className="textarea"
                        placeholder="Share your experience (optional)…"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        style={{ marginTop: 10, marginBottom: 10 }}
                    />
                    <button className="btn btn-primary" type="submit" disabled={!rating || submitting} style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                        {submitting ? 'Submitting…' : 'Submit Review'}
                    </button>
                </form>
            ) : null}

            {/* Review list */}
            {reviewStats?.reviews?.length > 0 ? (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {reviewStats.reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(r => (
                            <div key={r.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Stars value={r.rating} size="0.9rem" />
                                        <strong style={{ fontSize: '0.85rem' }}>{r.client_name || 'Anonymous'}</strong>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                {r.comment && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.comment}</p>}
                            </div>
                        ))}
                    </div>
                    {reviewStats.reviews.length > PAGE_SIZE && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                            <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}
                                disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {page} / {Math.ceil(reviewStats.reviews.length / PAGE_SIZE)}
                            </span>
                            <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}
                                disabled={page >= Math.ceil(reviewStats.reviews.length / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>Next →</button>
                        </div>
                    )}
                </>
            ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No reviews yet. Be the first!</p>
            )}
        </div>
    );
}
