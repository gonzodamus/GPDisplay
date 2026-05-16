export default function TextWidget({ value, label, fontSize = '2rem' }) {
  const displayValue = value === undefined || value === null ? '—' : value;

  // fontSize >= 1.5rem → dark box display (song title, setlist name)
  const isNameDisplay = parseFloat(fontSize) >= 1.5;

  if (isNameDisplay) {
    return (
      <div style={styles.nameOuter}>
        <div style={styles.nameBox}>
          <div style={{ ...styles.nameText, fontSize }}>{displayValue}</div>
        </div>
      </div>
    );
  }

  // Smaller → tape banner label (instrument names under faders)
  return (
    <div style={styles.tapeOuter}>
      <div style={styles.tape}>
        <span style={styles.tapeText}>{displayValue}</span>
      </div>
    </div>
  );
}

const styles = {
  nameOuter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '10px 20px',
  },
  nameBox: {
    background: '#2a2a2a',
    borderRadius: '8px',
    border: '1px solid rgba(200,200,200,0.3)',
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 12px',
  },
  tape: {
    backgroundColor: '#ede3c2',
    padding: '5px 16px',
    borderRadius: '3px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
  },
  tapeText: {
    fontFamily: "'Patrick Hand', cursive",
    fontSize: '2.2rem',
    color: '#1a1a1a',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },
};
