export default function SwitchWidget({ value, label, color }) {
  const isOn = value !== undefined && value !== null && value >= 0.5;
  const litColor = color || '#4a7ab5';

  return (
    <div style={styles.container}>
      {label && <div style={styles.groupLabel}>{label}</div>}
      <div
        style={{
          ...styles.button,
          background: isOn
            ? `radial-gradient(circle at 40% 38%, rgba(255,255,255,0.35) 0%, ${litColor} 55%, rgba(0,0,0,0.3) 100%)`
            : 'linear-gradient(160deg, #4a4a4a 0%, #2e2e2e 100%)',
          boxShadow: isOn
            ? `0 0 14px 3px ${litColor}88, inset 0 1px 0 rgba(255,255,255,0.25), 0 3px 6px rgba(0,0,0,0.5)`
            : 'inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.08)',
          border: isOn
            ? `1.5px solid ${litColor}`
            : '1.5px solid rgba(255,255,255,0.1)',
        }}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    gap: '8px',
  },
  groupLabel: {
    fontSize: '0.68rem',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '4px',
    padding: '2px 8px',
  },
  button: {
    width: '56px',
    height: '56px',
    borderRadius: '8px',
    cursor: 'default',
    transition: 'box-shadow 120ms ease, background 120ms ease',
  },
};
