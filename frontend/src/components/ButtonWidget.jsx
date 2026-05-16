export default function ButtonWidget({ value, label, note, color }) {
  const isOn = value !== undefined && value !== null && value >= 0.5;
  const litColor = color || '#cc2222';

  const displayValue = value === undefined || value === null ? '—'
    : typeof value === 'number' ? `${Math.round(value * 100)}` : value;

  return (
    <div style={styles.container}>
      {/* Value readout above the button */}
      <div style={styles.valueText}>{displayValue}</div>

      {/* The button itself */}
      <div
        style={{
          ...styles.button,
          background: `radial-gradient(circle at 40% 38%, rgba(255,255,255,0.15) 0%, ${litColor} 55%, rgba(0,0,0,0.45) 100%)`,
          boxShadow: isOn
            ? `0 0 20px 6px ${litColor}99, 0 0 6px 2px ${litColor}, inset 0 1px 0 rgba(255,255,255,0.2)`
            : `0 0 8px 2px ${litColor}55, inset 0 2px 4px rgba(0,0,0,0.4)`,
          border: `2px solid ${litColor}`,
        }}
      />

      {/* Sticky-note style label */}
      {note && (
        <div style={styles.stickyNote}>
          <span style={styles.stickyText}>{note}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    gap: '8px',
  },
  valueText: {
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.55)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.04em',
  },
  button: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    cursor: 'default',
    transition: 'box-shadow 120ms ease',
  },
  stickyNote: {
    backgroundColor: '#c8b870',
    padding: '5px 12px',
    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
    marginTop: '2px',
  },
  stickyText: {
    fontFamily: "'Patrick Hand', cursive",
    fontSize: '0.9rem',
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
  },
};
