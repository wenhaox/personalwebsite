'use client'

import { useEffect, useState } from 'react'
import SiteWarmup from '@/app/components/SiteWarmup'

const getGreetingByHour = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
}

export default function Home() {
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreetingByHour(new Date().getHours()))
    }

    updateGreeting()
    const timer = window.setInterval(updateGreeting, 60_000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="flex items-start justify-start min-h-screen mobile-main-content mobile-home-content desktop-home-padding bg-background">
      <SiteWarmup />
      <div className="max-w-xl space-y-4 md:space-y-5 about-home-stack">
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
            A lot of my time also goes into observing how people move through the world, more on{' '}
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

        {/* Photo section - only visible on mobile */}
        <div className="hidden mobile-show-photo pt-4 pb-4">
          <div className="w-48 h-64 bg-muted/10 rounded-md flex items-center justify-center mx-auto">
            <span className="text-muted text-sm">photo</span>
          </div>
        </div>

      </div>
    </div>
  )
}
