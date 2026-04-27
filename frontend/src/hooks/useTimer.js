import { useRef, useEffect, useState } from 'react'
 
export default function useTimer(active = true) {
  const startRef = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)
 
  useEffect(() => {
    if (!active) return
    startRef.current = Date.now()
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [active])
 
  const getElapsed = () => Math.round((Date.now() - startRef.current) / 1000)
  const reset = () => { startRef.current = Date.now(); setElapsed(0) }
 
  return { elapsed, getElapsed, reset }
}
 