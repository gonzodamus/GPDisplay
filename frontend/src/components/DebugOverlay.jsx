import { useState, useEffect } from 'react'

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h`
}

function ageColor(ts) {
  if (!ts) return 'rgba(255,255,255,0.2)'
  const s = (Date.now() - ts) / 1000
  if (s < 10) return '#44dd44'
  if (s < 60) return '#ffaa22'
  return '#ff4444'
}

export default function DebugOverlay({ lastSeen, oscState }) {
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const entries = Object.keys(lastSeen)
    .sort()
    .map(addr => ({ addr, value: oscState[addr], ts: lastSeen[addr] }))

  return (
    <div style={styles.overlay}>
      <div style={styles.header}>OSC Debug — press ` to close</div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Address</th>
            <th style={styles.th}>Value</th>
            <th style={styles.th}>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ addr, value, ts }) => (
            <tr key={addr}>
              <td style={styles.tdAddr}>{addr}</td>
              <td style={styles.tdVal}>{String(value ?? '—')}</td>
              <td style={{ ...styles.tdAge, color: ageColor(ts) }}>{timeAgo(ts)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.92)',
    zIndex: 1000,
    padding: '24px 32px',
    overflowY: 'auto',
  },
  header: {
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '16px',
    letterSpacing: '0.05em',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.8rem',
    fontVariantNumeric: 'tabular-nums',
  },
  th: {
    textAlign: 'left',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 400,
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.7rem',
  },
  tdAddr: {
    padding: '6px 16px 6px 0',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'monospace',
  },
  tdVal: {
    padding: '6px 16px 6px 0',
    color: '#f0f0f0',
    fontFamily: 'monospace',
    maxWidth: '320px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tdAge: {
    padding: '6px 0',
    fontFamily: 'monospace',
  },
}
