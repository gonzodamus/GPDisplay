const KNOB_H = 48;

export default function FaderWidget({ value, color }) {
  const isUndefined = value === undefined || value === null;
  const clamped = isUndefined ? 0 : Math.min(1, Math.max(0, value));

  const knobColor = color || '#4a7ab5';
  const knobTop = `calc(${(1 - clamped)} * (100% - ${KNOB_H}px))`;

  return (
    <div style={styles.outer}>
      <div style={styles.trackFrame}>
        <div style={styles.trackArea}>
          <div style={styles.track}>
            <div style={{ ...styles.tick, top: '7%' }} />
          </div>
          <div
            style={{
              ...styles.knob,
              top: knobTop,
              backgroundColor: knobColor,
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  rgba(255,255,255,0.13) 0px,
                  rgba(255,255,255,0.13) 2px,
                  transparent 2px,
                  transparent 7px
                ),
                linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.3) 100%)
              `,
            }}
          >
            <div style={styles.knobCenter} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  outer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: '50px',
  },
  trackFrame: {
    background: '#262626',
    borderRadius: '10px',
    border: '2px solid rgba(255,255,255,0.13)',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.6), 0 4px 14px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  trackArea: {
    position: 'relative',
    width: '80px',
    height: '280px',
    flexShrink: 0,
  },
  track: {
    position: 'absolute',
    top: '6px',
    bottom: '6px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '12px',
    background: '#505050',
    borderRadius: '4px',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.5)',
  },
  tick: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '64px',
    height: '2px',
    background: 'rgba(255,255,255,0.5)',
    borderRadius: '1px',
    zIndex: 2,
  },
  knob: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '68px',
    height: `${KNOB_H}px`,
    borderRadius: '6px',
    border: '2px solid rgba(255,255,255,0.22)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.2)',
    zIndex: 1,
    transition: 'top 80ms linear',
  },
  knobCenter: {
    position: 'absolute',
    top: '50%',
    left: '8px',
    right: '8px',
    height: '2px',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.35)',
    borderRadius: '1px',
  },
};
