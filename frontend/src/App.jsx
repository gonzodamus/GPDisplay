import { useEffect } from 'react'
import useOSC from './hooks/useOSC.js'
import MixerLayout from './components/MixerLayout.jsx'

export default function App() {
  const { oscState, connected } = useOSC()

  useEffect(() => {
    // Force theme CSS vars for body background consistency
    document.documentElement.style.setProperty('--gp-bg', '#1a1718')
    document.documentElement.style.setProperty('--gp-fg', '#e8ebf0')
    document.documentElement.style.setProperty('--gp-accent', '#c01525')
  }, [])

  return <MixerLayout oscState={oscState} connected={connected} />
}
