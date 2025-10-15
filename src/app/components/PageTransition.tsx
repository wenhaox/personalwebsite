'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setIsTransitioning(false)
    }, 75)
    
    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div className={`page-transition ${isTransitioning ? 'page-transition-out' : ''}`}>
      {displayChildren}
    </div>
  )
}

