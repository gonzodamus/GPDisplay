import { useState, useEffect, useRef } from 'react'

export default function useOSC() {
  const [oscState, setOscState] = useState({})
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(`ws://${window.location.host}/ws`)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        clearTimeout(reconnectTimerRef.current)
      }

      ws.onmessage = (event) => {
        try {
          const { address, args } = JSON.parse(event.data)
          if (address === '/ClearAll') {
            setOscState((prev) => {
              const preserved = {}
              for (const [addr, val] of Object.entries(prev)) {
                if (addr.startsWith('/GlobalRackspace/')) preserved[addr] = val
              }
              return preserved
            })
            return
          }
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
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [])

  return { oscState, connected }
}
