import { useState, useEffect } from 'react'
import { loadConfig } from './config.js'
import useOSC from './hooks/useOSC.js'
import WidgetContainer from './components/WidgetContainer.jsx'

export default function App() {
  const [config, setConfig] = useState(null)
  const { oscState, connected } = useOSC()

  useEffect(() => {
    loadConfig().then(setConfig)
  }, [])

  if (!config) {
    return (
      <div style={styles.loading}>
        Could not load config — is the bridge server running?
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
          const hasFader = col.items.some(item => item.type === 'fader')
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
              {col.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  style={{
                    ...styles.itemWrapper,
                    flex: direction === 'row' ? '1 1 0' : '0 0 auto',
                  }}
                >
                  <WidgetContainer item={item} oscState={oscState} />
                </div>
              ))}
            </div>
          )
        })}
      </div>
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
