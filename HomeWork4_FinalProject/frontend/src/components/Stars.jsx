export default function Stars({ value = 0, interactive = false, hover = 0, onHover, onLeave, onClick, size = '1.2rem' }) {
    return (
        <span style={{ display: 'inline-flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(n => (
                <span
                    key={n}
                    style={{
                        fontSize: size,
                        cursor: interactive ? 'pointer' : 'default',
                        color: n <= (hover || value) ? '#f59e0b' : 'var(--text-muted)',
                        lineHeight: 1,
                    }}
                    onMouseEnter={() => interactive && onHover?.(n)}
                    onMouseLeave={() => interactive && onLeave?.()}
                    onClick={() => interactive && onClick?.(n)}
                >★</span>
            ))}
        </span>
    );
}
