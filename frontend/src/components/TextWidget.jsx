const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '8px 12px',
  },
  label: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  value: {
    color: 'var(--gp-fg)',
    lineHeight: 1.15,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontVariantNumeric: 'tabular-nums',
  },
};

export default function TextWidget({ value, label, fontSize = '1.5rem' }) {
  const displayValue = value === undefined || value === null ? '—' : value;

  return (
    <div style={styles.container}>
      {label && <div style={styles.label}>{label}</div>}
      <div style={{ ...styles.value, fontSize }}>{displayValue}</div>
    </div>
  );
}
