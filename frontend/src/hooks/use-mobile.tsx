import { useEffect, useState } from 'react'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handleChange = () => setIsMobile(window.innerWidth < 768)
    setIsMobile(window.innerWidth < 768)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  return !!isMobile
}
