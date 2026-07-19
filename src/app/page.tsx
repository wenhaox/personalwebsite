'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import SiteWarmup from '@/app/components/SiteWarmup'

const getGreetingByHour = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
}

export default function Home() {
  const [greeting, setGreeting] = useState<string | null>(null)
  const [align, setAlign] = useState<'center' | 'start'>('center')
  const shellRef = useRef<HTMLDivElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreetingByHour(new Date().getHours()))
    }

    updateGreeting()
    const timer = window.setInterval(updateGreeting, 60_000)

    return () => window.clearInterval(timer)
  }, [])

  useLayoutEffect(() => {
    const shell = shellRef.current
    const stack = stackRef.current
    if (!shell || !stack) return

    const updateAlign = () => {
      // Desktop About stays top-aligned; only mobile uses fit-based centering.
      if (!window.matchMedia('(max-width: 1024px)').matches) {
        setAlign('start')
        return
      }
      const styles = window.getComputedStyle(shell)
      const padY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0)
      const available = shell.clientHeight - padY
      const needed = stack.scrollHeight
      // Center when the copy fits; otherwise pin to top so nothing is clipped.
      setAlign(needed <= available - 4 ? 'center' : 'start')
    }

    updateAlign()
    const observer = new ResizeObserver(updateAlign)
    observer.observe(shell)
    observer.observe(stack)
    window.addEventListener('resize', updateAlign)
    // Animations finish and can change measured height.
    const settle = window.setTimeout(updateAlign, 900)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateAlign)
      window.clearTimeout(settle)
    }
  }, [greeting])

  return (
    <div
      ref={shellRef}
      className={`about-home-shell mobile-main-content mobile-home-content desktop-home-padding bg-background is-align-${align}`}
    >
      <SiteWarmup />
      <div ref={stackRef} className="max-w-xl space-y-4 md:space-y-5 about-home-stack">
        <h1 className="text-2xl md:text-3xl font-serif italic leading-tight text-left about-home-title">
          {greeting ? (
            <>
              <span className="about-seq-greeting">{greeting}!</span>{' '}
            </>
          ) : null}
          <span className="about-seq-name">I&apos;m Peter.</span>
        </h1>

        <div className="space-y-2.5 md:space-y-3.5 text-base leading-7 about-seq-body about-flow-prose about-mobile-centered">
          <p className="about-seq-line about-seq-line-1">
            I&apos;m interested in bring-up, integration, and testing for robotics and consumer hardware. I hope to work on things that feel intuitive and practical, and are built to last.
          </p>

          <p className="about-seq-line about-seq-line-2">
            I also spend some time observing how people move through the world, more on{' '}
            <a
              href="/photos"
              className="about-quick-link underline decoration-accent hover:text-accent transition-colors"
            >
              Photos
            </a>
            .
          </p>

          <p className="about-seq-line about-seq-line-3">
            Some other things I enjoy are getting outside around blue hour, touring spaces, finding a good drink in a new neighborhood, basketball, sci-fi mysteries, and snacking on jelly and popcorn.
          </p>

          <p className="about-seq-line about-seq-line-4">
            I&apos;m always down to meet curious people. Please{' '}
            <a
              href="/connect"
              className="about-quick-link underline decoration-accent hover:text-accent transition-colors"
            >
              reach out
            </a>
            !
          </p>
        </div>
      </div>
    </div>
  )
}
