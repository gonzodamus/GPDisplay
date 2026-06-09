import { useState, useEffect, useRef } from 'react'

export default function useOSC() {
  const [oscState, setOscState] = useState({})
  const [lastSeen, setLastSeen] = useState({})
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const pendingClearRef = useRef(false)
  const pendingUpdatesRef = useRef({})
  const flushTimerRef = useRef(null)

  useEffect(() => {
    function flushPending() {
      pendingClearRef.current = false
      const updates = pendingUpdatesRef.current
      pendingUpdatesRef.current = {}
      setOscState((prev) => {
        const preserved = {}
        for (const [addr, val] of Object.entries(prev)) {
          if (addr.startsWith('/GlobalRackspace/')) preserved[addr] = val
        }
        return { ...preserved, ...updates }
      })
    }

    function connect() {
      const ws = new WebSocket(`ws://${window.location.host}/ws`)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        clearTimeout(reconnectTimerRef.current)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)

          const { address, args } = msg

          if (address === '/ClearAll') {
            pendingClearRef.current = true
            pendingUpdatesRef.current = {}
            return
          }

          // Buffer updates after ClearAll; flush once the burst settles
          if (pendingClearRef.current) {
            pendingUpdatesRef.current[address] = args[0]
            clearTimeout(flushTimerRef.current)
            flushTimerRef.current = setTimeout(flushPending, 50)
            return
          }

          const now = Date.now()
          setLastSeen((prev) => ({ ...prev, [address]: now }))
          setOscState((prev) => ({ ...prev, [address]: args[0] }))
        } catch (err) {
          console.error('useOSC: failed to parse message', err)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        reconnectTimerRef.current = setTimeout(connect, 2500)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimerRef.current)
      clearTimeout(flushTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [])

  return { oscState, lastSeen, connected }
}
