'use client'

import { Moon, Sun } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

const THEME_KEY = 'theme-preference'

const readThemePreference = (): 'dark' | 'light' | null => {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') {
    return stored
  }

  return null
}

const getSystemTheme = (): 'dark' | 'light' => (
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
)

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [isThemeReady, setIsThemeReady] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const storedTheme = readThemePreference()
    const initialTheme = storedTheme || getSystemTheme()
    setIsDark(initialTheme === 'dark')
    setIsThemeReady(true)
    
    const handleChange = () => {
      const persistedTheme = readThemePreference()
      if (persistedTheme) {
        return
      }

      setIsDark(mediaQuery.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isThemeReady) return

    const root = document.documentElement
    const body = document.body

    if (isDark) {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
      root.style.backgroundColor = '#1a1a1a'
      body.style.backgroundColor = '#1a1a1a'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
      root.style.backgroundColor = '#faf9f7'
      body.style.backgroundColor = '#faf9f7'
    }

    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  }, [isDark, isThemeReady])

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="fixed bottom-8 left-8 md:bottom-8 md:left-8 p-3 rounded-full transition-all duration-300 z-50 mobile-theme-toggle theme-toggle-icon-only"
      aria-label="Toggle dark mode"
      style={{maxWidth: 'calc(100vw - 4rem)'}}
    >
      {isDark ? (
        <Sun size={24} weight="duotone" aria-hidden="true" />
      ) : (
        <Moon size={24} weight="duotone" aria-hidden="true" />
      )}
    </button>
  )
}
