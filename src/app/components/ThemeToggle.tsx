'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 p-3 md:p-4 bg-card border border-border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50"
      aria-label="Toggle dark mode"
    >
      <span className="text-lg md:text-xl">
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  )
}
