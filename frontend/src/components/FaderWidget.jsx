const KNOB_H = 36;

export default function FaderWidget({ value, label, color }) {
  const isUndefined = value === undefined || value === null;
  const clamped = isUndefined ? 0 : Math.min(1, Math.max(0, value));

  const knobColor = color || '#4a7ab5';
  const knobTop = `calc(${(1 - clamped) * 100}% - ${KNOB_H / 2}px)`;

  return (
    <div style={styles.outer}>
      <div style={styles.trackArea}>
        <div style={styles.track}>
          <div style={{ ...styles.tick, top: '27%' }} />
        </div>
        <div
          style={{
            ...styles.knob,
            top: knobTop,
            backgroundColor: knobColor,
            borderColor: knobColor,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                rgba(255,255,255,0.18) 0px,
                rgba(255,255,255,0.18) 2px,
                transparent 2px,
                transparent 7px
              ),
              linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.25) 100%)
            `,
          }}
        />
      </div>

      {label && <div style={styles.faderLabel}>{label}</div>}
    </div>
  );
}

const styles = {
  outer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    paddingTop: '48px',
    justifyContent: 'flex-start',
  },
  trackArea: {
    position: 'relative',
    width: '60px',
    height: '220px',
    flexShrink: 0,
  },
  track: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '8px',
    background: 'linear-gradient(180deg, #111 0%, #1a1a1a 100%)',
    borderRadius: '4px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)',
  },
  tick: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '24px',
    height: '2px',
    background: 'rgba(255,255,255,0.35)',
    borderRadius: '1px',
  },
  knob: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '52px',
    height: `${KNOB_H}px`,
    borderRadius: '4px',
    border: '1.5px solid',
    boxShadow: '0 3px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.2)',
    zIndex: 1,
    transition: 'top 80ms linear',
  },
  faderLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: '0.05em',
    marginTop: '10px',
    marginBottom: '6px',
    textTransform: 'uppercase',
  },
};
