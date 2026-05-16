const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    gap: '8px',
  },
  dot: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  label: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
};

export default function SwitchWidget({ value, label, color }) {
  const isOn = value !== undefined && value !== null && value >= 0.5;

  const litColor = color || 'var(--gp-accent)';

  const dotStyle = {
    ...styles.dot,
    background: isOn ? litColor : 'rgba(255,255,255,0.15)',
    boxShadow: isOn ? `0 0 10px 2px ${litColor}` : 'none',
  };

  return (
    <div style={styles.container}>
      <div style={dotStyle} />
      {label && <div style={styles.label}>{label}</div>}
    </div>
  );
}
