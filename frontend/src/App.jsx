import { useState, useEffect } from 'react'
import { loadConfig } from './config.js'
import useOSC from './hooks/useOSC.js'
import WidgetContainer from './components/WidgetContainer.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import DebugOverlay from './components/DebugOverlay.jsx'

export default function App() {
  const [config, setConfig] = useState(null)
  const [debugOpen, setDebugOpen] = useState(false)
  const { oscState, lastSeen, connected } = useOSC()

  useEffect(() => {
    loadConfig().then(setConfig)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Backquote') setDebugOpen(open => !open)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!config) {
    return (
      <div style={styles.loading}>
        Loading…
      </div>
    )
  }

  const { columns } = config.layout

  return (
    <div style={styles.root}>
      {!connected && <div className="disconnected-banner" />}
      <div
        className={connected ? '' : 'dimmed'}
        style={styles.display}
      >
        {columns.map((col, colIdx) => {
          const direction = col.direction || 'row'
          const items = col.items || []
          const hasFader = items.some(item => item.type === 'fader')
          return (
            <div
              key={colIdx}
              style={{
                ...styles.column,
                width: col.width,
                flexDirection: direction,
                flexWrap: direction === 'row' ? 'wrap' : 'nowrap',
                alignItems: direction === 'column' ? 'stretch' : 'center',
                justifyContent: hasFader ? 'center' : 'flex-start',
                paddingTop: col.paddingTop || 0,
                paddingLeft: col.paddingLeft || 0,
              }}
            >
              {items.map((item, itemIdx) => (
                <ErrorBoundary key={itemIdx} name={item.oscAddress || item.type}>
                  <div
                    style={{
                      ...styles.itemWrapper,
                      flex: direction === 'row' ? '1 1 0' : '0 0 auto',
                    }}
                  >
                    <WidgetContainer item={item} oscState={oscState} />
                  </div>
                </ErrorBoundary>
              ))}
            </div>
          )
        })}
      </div>

      {debugOpen && <DebugOverlay lastSeen={lastSeen} oscState={oscState} />}
    </div>
  )
}

const styles = {
  root: {
    position: 'relative',
    width: '1920px',
    height: '480px',
    overflow: 'hidden',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1920px',
    height: '480px',
    color: 'var(--gp-fg)',
    fontSize: '1.2rem',
    opacity: 0.5,
  },
  display: {
    display: 'flex',
    flexDirection: 'row',
    width: '1920px',
    height: '480px',
    overflow: 'hidden',
  },
  column: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
    flexShrink: 0,
  },
  itemWrapper: {
    minWidth: 0,
    overflow: 'hidden',
  },
}
