'use client'

import { useEffect, useState } from 'react'

export default function CursorTrail() {
  const [dots, setDots] = useState<Array<{ x: number; y: number; id: number }>>([])

  useEffect(() => {
    let dotId = 0
    
    const handleMouseMove = (e: MouseEvent) => {
      const newDot = {
        x: e.clientX,
        y: e.clientY,
        id: dotId++
      }
      
      setDots(prev => [...prev, newDot].slice(-15)) // Keep last 15 dots
      
      // Remove dot after animation
      setTimeout(() => {
        setDots(prev => prev.filter(dot => dot.id !== newDot.id))
      }, 800)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {dots.map((dot) => (
        <div
          key={dot.id}
          className="absolute w-2 h-2 bg-accent/30 rounded-full animate-fade-in"
          style={{
            left: dot.x - 4,
            top: dot.y - 4,
            animation: 'fadeOut 0.8s ease-out forwards'
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fadeOut {
          0% {
            opacity: 0.5;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.5);
          }
        }
      `}</style>
    </div>
  )
}

