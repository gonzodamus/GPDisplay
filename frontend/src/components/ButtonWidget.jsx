export default function ButtonWidget({ value, label, note, color }) {
  const isOn = value !== undefined && value !== null && value >= 0.5;
  const litColor = color || '#cc2222';

  return (
    <div style={styles.container}>
      {/* The button itself */}
      <div
        style={{
          ...styles.button,
          background: isOn
            ? `radial-gradient(circle at 40% 38%, rgba(255,255,255,0.2) 0%, ${litColor} 55%, rgba(0,0,0,0.4) 100%)`
            : `radial-gradient(circle at 40% 38%, rgba(255,255,255,0.05) 0%, rgba(80,80,80,0.6) 55%, rgba(0,0,0,0.5) 100%)`,
          boxShadow: isOn
            ? `0 0 24px 8px ${litColor}bb, 0 0 8px 2px ${litColor}, inset 0 1px 0 rgba(255,255,255,0.2)`
            : `inset 0 2px 6px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06)`,
          border: isOn
            ? `2px solid ${litColor}`
            : `2px solid rgba(255,255,255,0.15)`,
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
    gap: '28px',
  },
  valueText: {
    fontSize: '2rem',
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
    backgroundColor: '#ede3c2',
    padding: '5px 12px',
    borderRadius: '3px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
    marginTop: '2px',
  },
  stickyText: {
    fontFamily: "'Patrick Hand', cursive",
    fontSize: '2rem',
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
  },
};
