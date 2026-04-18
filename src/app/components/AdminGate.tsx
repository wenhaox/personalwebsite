'use client'

import Link from 'next/link'
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'

import { ADMIN_USERS, AUTH_CONFIG } from '@/app/config/auth'

interface AdminGateProps {
  children: ReactNode
}

const SESSION_KEY = 'adminSession'
const ATTEMPTS_KEY = 'adminAuthAttempts'
const LOCKOUT_UNTIL_KEY = 'adminLockoutUntil'

const getSessionTimestamp = (): number => {
  const raw = localStorage.getItem(SESSION_KEY)
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

const hasActiveSession = (): boolean => {
  const timestamp = getSessionTimestamp()
  if (timestamp <= 0) return false
  return Date.now() - timestamp < AUTH_CONFIG.SESSION_DURATION
}

const getLockoutUntil = (): number => {
  const raw = localStorage.getItem(LOCKOUT_UNTIL_KEY)
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function AdminGate({ children }: AdminGateProps) {
  const [isReady, setIsReady] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [lockoutUntil, setLockoutUntil] = useState(0)

  useEffect(() => {
    const lockoutTime = getLockoutUntil()
    if (lockoutTime > Date.now()) {
      setLockoutUntil(lockoutTime)
    } else {
      localStorage.removeItem(LOCKOUT_UNTIL_KEY)
    }

    if (hasActiveSession()) {
      setIsAuthorized(true)
    }

    setIsReady(true)
  }, [])

  useEffect(() => {
    if (lockoutUntil <= Date.now()) return

    const intervalId = window.setInterval(() => {
      if (Date.now() >= lockoutUntil) {
        setLockoutUntil(0)
        localStorage.removeItem(LOCKOUT_UNTIL_KEY)
        localStorage.removeItem(ATTEMPTS_KEY)
      }
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [lockoutUntil])

  const lockoutSecondsRemaining = useMemo(() => {
    if (lockoutUntil <= Date.now()) return 0
    return Math.ceil((lockoutUntil - Date.now()) / 1000)
  }, [lockoutUntil])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (lockoutUntil > Date.now()) {
      setErrorMessage(`Too many attempts. Try again in ${lockoutSecondsRemaining}s.`)
      return
    }

    const isPasswordValid = ADMIN_USERS.some((user) => user.password === password)

    if (isPasswordValid) {
      localStorage.setItem(SESSION_KEY, String(Date.now()))
      localStorage.removeItem(ATTEMPTS_KEY)
      localStorage.removeItem(LOCKOUT_UNTIL_KEY)
      setErrorMessage('')
      setPassword('')
      setIsAuthorized(true)
      return
    }

    const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || '0') + 1

    if (attempts >= AUTH_CONFIG.MAX_ATTEMPTS) {
      const nextLockoutUntil = Date.now() + AUTH_CONFIG.LOCKOUT_DURATION
      localStorage.setItem(LOCKOUT_UNTIL_KEY, String(nextLockoutUntil))
      localStorage.removeItem(ATTEMPTS_KEY)
      setLockoutUntil(nextLockoutUntil)
      setErrorMessage(`Too many attempts. Try again in ${Math.ceil(AUTH_CONFIG.LOCKOUT_DURATION / 1000)}s.`)
      return
    }

    localStorage.setItem(ATTEMPTS_KEY, String(attempts))
    const attemptsRemaining = AUTH_CONFIG.MAX_ATTEMPTS - attempts
    setErrorMessage(`Incorrect password. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} left.`)
  }

  if (!isReady) {
    return (
      <div className="flex items-start justify-center min-h-screen px-32 py-16 mobile-main-content">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-sm text-muted">
          Checking admin session...
        </div>
      </div>
    )
  }

  if (isAuthorized) {
    return <>{children}</>
  }

  return (
    <div className="flex items-start justify-center min-h-screen px-32 py-16 mobile-main-content">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <h1 className="text-3xl font-serif italic">Admin Access</h1>
        <p className="mt-2 text-sm text-muted">Enter your admin password to continue.</p>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              if (errorMessage) setErrorMessage('')
            }}
            placeholder="Admin password"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            autoComplete="current-password"
            required
          />

          {errorMessage && (
            <p className="text-xs text-red-500">{errorMessage}</p>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2 bg-accent text-stone-100 hover:bg-accent-light rounded-lg transition-colors notion-button"
          >
            Unlock Admin
          </button>
        </form>

        <div className="mt-4 flex justify-center">
          <Link
            href="/"
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            Back to Site
          </Link>
        </div>
      </div>
    </div>
  )
}
