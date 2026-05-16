const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    padding: '8px 16px',
    gap: '6px',
  },
  percentage: {
    fontSize: '0.8rem',
    color: 'var(--gp-fg)',
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  },
  track: {
    flex: 1,
    width: '48px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '6px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    borderRadius: '6px',
    transition: 'none',
  },
  label: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
};

export default function FaderWidget({ value, label, color }) {
  const isUndefined = value === undefined || value === null;
  const clamped = isUndefined ? 0 : Math.min(1, Math.max(0, value));
  const pct = Math.round(clamped * 100);
  const displayPct = isUndefined ? '—' : `${pct}`;
  const fillColor = color || 'var(--gp-accent)';

  return (
    <div style={styles.container}>
      <div style={styles.percentage}>{displayPct}</div>
      <div style={styles.track}>
        <div style={{ ...styles.fill, height: `${pct}%`, background: fillColor }} />
      </div>
      {label && <div style={styles.label}>{label}</div>}
    </div>
  );
}
