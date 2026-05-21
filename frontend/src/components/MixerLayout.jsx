const ZERO_POS = 0.22; // zero-dB line sits 22% from top of rail

function capTopPct(value) {
  const v = value === undefined || value === null ? 0 : Math.min(1, Math.max(0, value));
  return (1 - v) * 100;
}

function resolveLabel(oscState, oscAddress, fallback) {
  if (!oscAddress) return fallback;
  const captionAddr = oscAddress.replace('/SetValue', '/SetCaption');
  const nameAddr = oscAddress.replace('/SetValue', 'Name');
  const caption = oscState[captionAddr] ?? oscState[nameAddr];
  return caption !== undefined && caption !== null ? caption : fallback;
}

function Channel({ label, value, capColor }) {
  const top = capTopPct(value);
  return (
    <div style={styles.channel}>
      <div style={styles.chName}>{label}</div>
      <div style={styles.faderArea}>
        <div style={styles.rail}>
          <div style={{ ...styles.railLine }} />
          <div style={{ ...styles.zeroMark, top: `${ZERO_POS * 100}%` }} />
          <div style={{ ...styles.signal, top: `${top}%`, background: `linear-gradient(180deg, ${capColor}, color-mix(in oklab, ${capColor} 50%, black 50%))` }} />
          <div style={{ ...styles.cap, top: `${top}%`, '--cap': capColor }} />
        </div>
      </div>
    </div>
  );
}

function Rivet({ style }) {
  return (
    <div style={{ ...styles.rivetWrap, ...style }}>
      <div style={styles.rivetHalo} />
      <div style={styles.rivet} />
    </div>
  );
}

function CanvasRivets() {
  return (
    <>
      <Rivet style={{ position: 'absolute', top: 16, left: 16 }} />
      <Rivet style={{ position: 'absolute', top: 16, right: 16 }} />
      <Rivet style={{ position: 'absolute', bottom: 16, left: 16 }} />
      <Rivet style={{ position: 'absolute', bottom: 16, right: 16 }} />
    </>
  );
}

function PanelRivets() {
  return (
    <>
      <Rivet style={{ position: 'absolute', top: 10, left: 10, zIndex: 4 }} />
      <Rivet style={{ position: 'absolute', top: 10, right: 10, zIndex: 4 }} />
      <Rivet style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 4 }} />
      <Rivet style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 4 }} />
    </>
  );
}

export default function MixerLayout({ oscState, connected }) {
  const songTitle = oscState['/CurrentSongName'] ?? 'Predecessor';
  const songPart = oscState['/SelectedSongPartName'] ?? null;
  const setlistName = oscState['/GlobalRackspace/SetlistNameName'] ?? 'Token';

  const k1Val = oscState['/GlobalRackspace/k1vol/SetValue'];
  const k2Val = oscState['/GlobalRackspace/k2vol/SetValue'];
  const mainVal = oscState['/GlobalRackspace/mainvol/SetValue'];

  const k1Label = resolveLabel(oscState, '/GlobalRackspace/k1vol/SetValue', 'K1');
  const k2Label = resolveLabel(oscState, '/GlobalRackspace/k2vol/SetValue', 'K2');

  const ohShitVal = oscState['/GlobalRackspace/ohshit/SetValue'];
  const isTriggered = ohShitVal !== undefined && ohShitVal !== null && ohShitVal >= 0.5;

  return (
    <div style={styles.canvas}>
      {/* Atmospheric overlays */}
      <div style={styles.atmo} />
      <div style={styles.atmoScratches} />

      {/* Base grain overlay */}
      <div style={styles.grain} />

      {/* Canvas corner rivets */}
      <CanvasRivets />

      {/* Logo watermark — V1-style oversized bleed from the left */}
      <div style={styles.watermark} aria-hidden="true">
        <img
          src="/finality-logo-distressed.png"
          alt=""
          style={styles.watermarkImg}
        />
      </div>

      {/* Disconnected indicator */}
      {!connected && <div style={styles.disconnectedBanner} />}

      {/* Main grid */}
      <div style={{ ...styles.grid, opacity: connected ? 1 : 0.4 }}>
        {/* Left: Now Playing */}
        <section style={styles.nowPlaying}>
          <h1 style={{
            ...styles.songTitle,
            fontSize: songTitle.length > 18 ? 86 : songTitle.length > 12 ? 108 : 132,
          }}>{songTitle}</h1>
          {songPart && songPart.trim() && songPart !== 'Song' && (
            <div style={styles.songPart}>{songPart}</div>
          )}
          <div style={styles.metaRow}>
            <span style={styles.pill}>
              <span style={styles.pillLabel}>Setlist</span>
              <strong style={styles.pillValue}>{setlistName}</strong>
            </span>
          </div>
        </section>

        {/* Center: Faders */}
        <section style={styles.fadersPanel}>
          <PanelRivets />
          <Channel label={k1Label} value={k1Val} capColor="#6aa3ff" />
          <Channel label={k2Label} value={k2Val} capColor="#d94a55" />
          <Channel label="Main" value={mainVal} capColor="#c9ccd1" />
        </section>

        {/* Right: Oh Shit button */}
        <aside style={styles.killSide}>
          <div style={{
            ...styles.killBtn,
            '--c': isTriggered ? '#5a0010' : '#2a1015',
            boxShadow: isTriggered
              ? 'inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -6px 14px rgba(0,0,0,0.5), 0 18px 40px rgba(0,0,0,0.55), 0 0 48px 16px rgba(255,40,55,0.45), 0 0 100px 32px rgba(255,40,55,0.20)'
              : 'inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -6px 14px rgba(0,0,0,0.5), 0 18px 40px rgba(0,0,0,0.55)',
            background: isTriggered
              ? 'radial-gradient(70% 60% at 50% 38%, color-mix(in oklab, #5a0010 70%, white 12%), #5a0010 70%)'
              : 'radial-gradient(70% 60% at 50% 38%, color-mix(in oklab, #2a1015 70%, white 12%), #2a1015 70%)',
          }}>
            <div style={styles.killLens} />
            <div style={{
              ...styles.killText,
              color: isTriggered ? 'rgba(255,90,90,0.90)' : 'rgba(255,255,255,0.14)',
              textShadow: isTriggered ? '0 0 20px rgba(255,40,55,0.8), 0 1px 0 rgba(0,0,0,0.5)' : '0 1px 0 rgba(0,0,0,0.5)',
            }}>OH SHIT!</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const RUST = 'rgba(160,70,28,';

const styles = {
  canvas: {
    position: 'relative',
    width: '1920px',
    height: '480px',
    overflow: 'hidden',
    background: [
      `radial-gradient(7% 14% at 8% 78%, ${RUST}0.30), transparent 70%)`,
      `radial-gradient(5% 10% at 22% 18%, ${RUST}0.26), transparent 75%)`,
      `radial-gradient(4% 9% at 78% 18%, ${RUST}0.22), transparent 70%)`,
      `radial-gradient(6% 12% at 92% 82%, ${RUST}0.28), transparent 70%)`,
      `radial-gradient(3% 8% at 52% 12%, ${RUST}0.20), transparent 70%)`,
      'linear-gradient(180deg, #18161a 0%, #1f1c1d 50%, #14110f 100%)',
      '#1a1718',
    ].join(', '),
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    color: '#e8ebf0',
    WebkitFontSmoothing: 'antialiased',
  },

  // Brushed metal striations
  atmo: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
    background: [
      'repeating-linear-gradient(90deg, rgba(255,240,220,0.018) 0px, rgba(255,240,220,0.018) 1px, transparent 1px, transparent 3px)',
      'radial-gradient(80% 120% at 50% 50%, rgba(255,235,210,0.025), transparent 65%)',
      'radial-gradient(60% 100% at 0% 0%, rgba(0,0,0,0.32), transparent 50%)',
      'radial-gradient(60% 100% at 100% 100%, rgba(0,0,0,0.38), transparent 50%)',
    ].join(', '),
  },

  // SVG scratch lines
  atmoScratches: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='480'><g stroke='white' stroke-width='1' fill='none' opacity='0.08'><path d='M 120 60 L 280 75'/><path d='M 540 380 L 720 392'/><path d='M 1200 110 L 1330 116'/><path d='M 1660 320 L 1820 332'/><path d='M 80 240 L 200 246'/><path d='M 1500 50 L 1620 60'/><path d='M 1400 420 L 1480 422'/></g><g stroke='black' stroke-width='1' fill='none' opacity='0.25'><path d='M 320 200 L 480 210'/><path d='M 900 60 L 1080 70'/><path d='M 1100 400 L 1240 410'/></g></svg>")`,
    opacity: 0.9,
  },

  // Coarse grain overlay
  grain: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 5,
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.13 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
    opacity: 0.95,
    mixBlendMode: 'overlay',
  },

  // Logo watermark
  watermark: {
    position: 'absolute',
    top: -80,
    bottom: -80,
    left: -240,
    width: 2100,
    pointerEvents: 'none',
    zIndex: 0,
    display: 'flex',
    alignItems: 'center',
    overflow: 'visible',
  },
  watermarkImg: {
    width: 2100,
    height: 'auto',
    filter: 'invert(1) brightness(1.55) contrast(1.05) drop-shadow(0 0 40px rgba(160,70,28,0.30))',
    opacity: 0.10,
  },

  disconnectedBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    background: '#ff0000',
    zIndex: 100,
  },

  grid: {
    position: 'relative',
    zIndex: 3,
    width: '100%',
    height: '100%',
    display: 'grid',
    gridTemplateColumns: '620px 1fr 360px',
    gap: 32,
    padding: '40px 48px',
    boxSizing: 'border-box',
  },

  // Left column
  nowPlaying: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
  },
  songTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 132,
    lineHeight: 0.86,
    letterSpacing: '0.005em',
    margin: 0,
    color: '#d9d3c8',
    textShadow: '0 1px 0 rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.6)',
    wordBreak: 'break-word',
  },
  songPart: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 64,
    lineHeight: 1,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: '10px 0 0',
    color: '#a89a82',
    textShadow: '0 1px 0 rgba(0,0,0,0.7)',
  },
  metaRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 14px',
    border: '1px solid rgba(220,180,140,0.18)',
    borderRadius: 999,
    background: 'rgba(40,28,20,0.35)',
    fontSize: 12,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'rgba(232,235,240,0.62)',
  },
  pillLabel: {
    letterSpacing: '0.2em',
  },
  pillValue: {
    color: '#e8ebf0',
    fontWeight: 600,
    letterSpacing: '0.2em',
  },

  // Center faders panel
  fadersPanel: {
    position: 'relative',
    border: '1px solid rgba(255,230,200,0.10)',
    background: 'linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.08))',
    borderRadius: 18,
    padding: '20px 22px',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 22,
    boxShadow: 'inset 0 1px 0 rgba(255,235,210,0.06), inset 0 0 0 1px rgba(0,0,0,0.55), 0 20px 50px rgba(0,0,0,0.55)',
  },

  // Channel
  channel: {
    flex: '1 1 0',
    minWidth: 0,
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    gap: 14,
    padding: '4px 0',
  },
  chName: {
    fontSize: 14,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'rgba(232,235,240,0.62)',
    minHeight: 18,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
  faderArea: {
    position: 'relative',
    minHeight: 0,
    display: 'grid',
    justifyContent: 'center',
  },
  rail: {
    position: 'relative',
    width: 64,
    height: '100%',
    borderRadius: 8,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.25))',
    border: '1px solid rgba(255,255,255,0.16)',
    boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  railLine: {
    position: 'absolute',
    left: '50%',
    top: 8,
    bottom: 8,
    width: 1,
    background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.2) 10%, rgba(255,255,255,0.2) 90%, transparent)',
    transform: 'translateX(-0.5px)',
  },
  zeroMark: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 1,
    background: 'rgba(255,255,255,0.22)',
  },
  signal: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 3,
    bottom: 6,
    borderRadius: 2,
    opacity: 0.45,
  },
  cap: {
    position: 'absolute',
    left: '50%',
    width: 'calc(100% - 14px)',
    height: 30,
    transform: 'translate(-50%, -50%)',
    borderRadius: 4,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, var(--cap, #888) 50%, rgba(0,0,0,0.3) 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.35), 0 6px 14px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.6)',
    transition: 'top 80ms linear',
  },

  // Right kill button
  killSide: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  killBtn: {
    position: 'relative',
    width: 240,
    height: 240,
    borderRadius: 24,
    border: '1px solid rgba(0,0,0,0.6)',
    display: 'grid',
    placeItems: 'center',
    transition: 'box-shadow 200ms ease',
  },
  killLens: {
    position: 'absolute',
    inset: '18%',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.04), transparent 60%)',
  },
  killText: {
    position: 'relative',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 38,
    letterSpacing: '0.18em',
    transition: 'color 200ms ease, text-shadow 200ms ease',
  },

  // Rivets
  rivetWrap: {
    width: 14,
    height: 14,
    pointerEvents: 'none',
  },
  rivetHalo: {
    position: 'absolute',
    inset: -10,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(160,70,28,0.55), rgba(160,70,28,0.15) 55%, transparent 75%)',
  },
  rivet: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 40% 35%, #4a4a4f 0%, #25262a 55%, #0e0f12 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 2px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.6)',
  },
};
