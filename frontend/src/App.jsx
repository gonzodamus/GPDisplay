import { useState, useEffect } from 'react'
import useOSC from './hooks/useOSC.js'
import MixerLayout from './components/MixerLayout.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import DebugOverlay from './components/DebugOverlay.jsx'

export default function App() {
  const [debugOpen, setDebugOpen] = useState(false)
  const { oscState, lastSeen, connected } = useOSC()

  useEffect(() => {
    document.documentElement.style.setProperty('--gp-bg', '#1a1718')
    document.documentElement.style.setProperty('--gp-fg', '#e8ebf0')
    document.documentElement.style.setProperty('--gp-accent', '#c01525')
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Backquote') setDebugOpen(open => !open)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <ErrorBoundary name="app">
      <MixerLayout oscState={oscState} connected={connected} />
      {debugOpen && <DebugOverlay lastSeen={lastSeen} oscState={oscState} />}
    </ErrorBoundary>
  )
}
