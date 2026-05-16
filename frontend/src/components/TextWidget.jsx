export default function TextWidget({ value, label, fontSize = '1.5rem' }) {
  const displayValue = value === undefined || value === null ? '—' : value;

  // Large font sizes → song/rackspace name display (dark box)
  const isNameDisplay = parseFloat(fontSize) >= 2;

  if (isNameDisplay) {
    return (
      <div style={styles.nameOuter}>
        <div style={styles.nameBox}>
          <div style={{ ...styles.nameText, fontSize }}>{displayValue}</div>
        </div>
      </div>
    );
  }

  // Smaller → tape banner label
  return (
    <div style={styles.tapeOuter}>
      {label && <div style={styles.tapeSmallLabel}>{label}</div>}
      <div style={styles.tapeWrap}>
        <div style={styles.tape}>
          <span style={styles.tapeText}>{displayValue}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  nameOuter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%',
    padding: '16px 20px',
  },
  nameBox: {
    background: '#2a2a2a',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    padding: '10px 24px',
    maxWidth: '100%',
  },
  nameText: {
    color: '#f0f0f0',
    fontWeight: 700,
    lineHeight: 1.15,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    letterSpacing: '-0.01em',
  },

  tapeOuter: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: '100%',
    padding: '0 12px',
    gap: '4px',
  },
  tapeSmallLabel: {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  tapeWrap: {
    display: 'flex',
  },
  tape: {
    backgroundColor: '#c8b870',
    padding: '4px 18px 4px 10px',
    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
  },
  tapeText: {
    fontFamily: "'Patrick Hand', cursive",
    fontSize: '1rem',
    color: '#1a1a1a',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },
};
