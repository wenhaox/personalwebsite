'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [key, setKey] = useState(0)

  useEffect(() => {
    // Force re-render with new key to trigger animation
    setKey(prev => prev + 1)
  }, [pathname])

  return (
    <div key={key} className="page-transition">
      {children}
    </div>
  )
}

