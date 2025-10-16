'use client'

import { useEffect, useState, useRef } from 'react'

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    const updateScrollProgress = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
        const scrolled = window.scrollY
        const progress = Math.min(100, Math.max(0, (scrolled / scrollHeight) * 100))
        setScrollProgress(progress)
      })
    }

    // Initial update
    updateScrollProgress()

    window.addEventListener('scroll', updateScrollProgress, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateScrollProgress)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div 
      className="fixed top-0 left-0 h-1 bg-accent z-50 transition-all duration-100 ease-out"
      style={{ 
        width: `${scrollProgress}%`,
        willChange: 'width'
      }}
    />
  )
}

