'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const PREFETCH_ROUTES = ['/photos', '/recently', '/connect'] as const

/** Warm the next routes + shared APIs while the visitor is still on About. */
export default function SiteWarmup() {
  const router = useRouter()

  useEffect(() => {
    const idle = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? window.requestIdleCallback.bind(window)
      : (cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 12 } as IdleDeadline), 280)

    const cancel = typeof window !== 'undefined' && 'cancelIdleCallback' in window
      ? window.cancelIdleCallback.bind(window)
      : window.clearTimeout.bind(window)

    const handle = idle(() => {
      PREFETCH_ROUTES.forEach((href) => {
        try {
          router.prefetch(href)
        } catch {
          // ignore
        }
      })

      void fetch('/api/guestbook', { cache: 'no-store' }).catch(() => undefined)

      // Warm the Recently 3D chunk so first open is snappier.
      void import('@/app/components/RecentlyIsometricDesk').catch(() => undefined)
      void import('@/app/components/GuestbookBook').catch(() => undefined)
    })

    return () => cancel(handle as number)
  }, [router])

  return null
}
