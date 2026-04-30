export const Icon = ({ name, size = 16, stroke = 1.5, style = {}, className = '' }) => {
    const paths = {
        search:   <><circle cx="7" cy="7" r="5"/><path d="M11 11l4 4"/></>,
        arrow:    <path d="M3 8h11M10 4l4 4-4 4"/>,
        arrowL:   <path d="M13 8H2M6 4 2 8l4 4"/>,
        plus:     <path d="M8 3v10M3 8h10"/>,
        check:    <path d="M3 8.5 6.5 12 13 4.5"/>,
        x:        <path d="M4 4l8 8M12 4l-8 8"/>,
        chev:     <path d="M5 6l3 3 3-3"/>,
        chevR:    <path d="M6 5l3 3-3 3"/>,
        star:     <path d="M8 2.2l1.85 3.75 4.15.6-3 2.93.7 4.12L8 11.6l-3.7 1.95.7-4.12-3-2.93 4.15-.6L8 2.2z"/>,
        pin:      <><path d="M8 14s5-4.5 5-8a5 5 0 1 0-10 0c0 3.5 5 8 5 8z"/><circle cx="8" cy="6" r="1.7"/></>,
        clock:    <><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></>,
        calendar: <><rect x="2.5" y="3.5" width="11" height="10" rx="1.2"/><path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2"/></>,
        bolt:     <path d="M9 1.5 3.5 9h4l-1 5.5L13 7H9l1-5.5z"/>,
        chat:     <path d="M2.5 4.5C2.5 3.4 3.4 2.5 4.5 2.5h7c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H7l-3 2.5V11.5h-.5c-1.1 0-2-.9-2-2v-5z"/>,
        mail:     <><rect x="2" y="3.5" width="12" height="9" rx="1"/><path d="M2.5 4l5.5 4 5.5-4"/></>,
        user:     <><circle cx="8" cy="6" r="2.7"/><path d="M2.5 14c.5-2.5 2.7-4.3 5.5-4.3s5 1.8 5.5 4.3"/></>,
        users:    <><circle cx="6" cy="6" r="2.4"/><path d="M1.5 13c.4-2.2 2.3-3.7 4.5-3.7s4.1 1.5 4.5 3.7"/><circle cx="11.5" cy="5" r="1.8"/><path d="M11.5 8.5c1.7 0 3 1.1 3.2 2.7"/></>,
        grid:     <><rect x="2.5" y="2.5" width="4" height="4"/><rect x="9.5" y="2.5" width="4" height="4"/><rect x="2.5" y="9.5" width="4" height="4"/><rect x="9.5" y="9.5" width="4" height="4"/></>,
        list:     <path d="M5 4h9M5 8h9M5 12h9M2 4h.01M2 8h.01M2 12h.01"/>,
        settings: <><circle cx="8" cy="8" r="2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></>,
        inbox:    <><path d="M2 9h3l1 2h4l1-2h3"/><path d="M2 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/><rect x="2" y="9" width="12" height="5" rx="1"/></>,
        upload:   <><path d="M8 11V3M5 6l3-3 3 3"/><path d="M2.5 11v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2"/></>,
        image:    <><rect x="2" y="3" width="12" height="10" rx="1"/><circle cx="6" cy="7" r="1.2"/><path d="M14 11l-3.5-3.5L4 13"/></>,
        sparkle:  <><path d="M8 2v4M8 10v4M2 8h4M10 8h4"/><path d="M4 4l1.5 1.5M10.5 10.5L12 12M4 12l1.5-1.5M10.5 5.5L12 4"/></>,
        spinner:  <><circle cx="8" cy="8" r="6" opacity="0.2"/><path d="M14 8a6 6 0 0 0-6-6"/></>,
        edit:     <><path d="M2.5 13.5h3l8-8-3-3-8 8v3z"/><path d="M9.5 3.5l3 3"/></>,
        logo:     <><path d="M3 12c0-2.5 2-4.5 4.5-4.5h.2A4 4 0 0 1 14 9"/><path d="M3 12h11"/></>,
    };
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
             stroke="currentColor" strokeWidth={stroke}
             strokeLinecap="round" strokeLinejoin="round"
             style={style} className={className}>
            {paths[name] || null}
        </svg>
    );
};

export const Placeholder = ({ label = 'photo', aspect = '1 / 1', style = {}, children }) => (
    <div className="cc-placeholder" style={{ aspectRatio: aspect, ...style }}>
        <span className="cc-placeholder-tag">{label}</span>
        {children}
    </div>
);

export const PulseDot = ({ color = 'var(--signal)', size = 6 }) => (
    <span style={{
        display: 'inline-block', width: size, height: size, borderRadius: '50%',
        background: color, animation: 'cc-pulse-dot 1.6s var(--ease-in-out) infinite',
        flexShrink: 0,
    }}/>
);

export const Logotype = ({ size = 22 }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="serif" style={{ fontSize: size, fontWeight: 600, letterSpacing: '-0.03em' }}>
            Cloud<span style={{ fontStyle: 'italic', color: 'var(--signal)' }}>CRM</span>
        </span>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            est. 2025
        </span>
    </div>
);
