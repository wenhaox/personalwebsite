'use client'

import { useEffect, useState } from 'react'

const getGreetingByHour = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
}

export default function Home() {
  const [greeting, setGreeting] = useState(() => getGreetingByHour(new Date().getHours()))

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
      <div className="max-w-xl space-y-4 md:space-y-5">
        <h1 className="text-2xl md:text-3xl font-serif italic leading-tight text-left">
          <span className="about-seq-greeting" suppressHydrationWarning>{greeting}!</span>{' '}
          <span className="about-seq-name">I&apos;m Your Name.</span>
        </h1>

        <div className="space-y-2 md:space-y-3 text-base leading-relaxed mobile-left-text about-seq-body">
          <p className="about-seq-line about-seq-line-1">
            I&apos;m interested in the bring-up and integration of hardware systems - where robotics and consumer products meet intentional design.
          </p>

          <p className="about-seq-line about-seq-line-2">
            I spend a lot of time observing - capturing how people move through the world and the spaces they&apos;re in. I share these on{' '}
            <a
              href="/photos"
              className="about-quick-link underline decoration-accent hover:text-accent transition-colors"
            >
              Photos
            </a>
            .
          </p>

          <p className="about-seq-line about-seq-line-3">
            I live for blue hour strolls, touring old architectural spaces, finding a local cafe in an unfamiliar neighborhood, triptychs, and crepe cakes. I have a deep appreciation for functional minimalism - a quiet, industrial ethos where objects are honest, purposeful, and built to last.
          </p>

          <p className="about-seq-line about-seq-line-4">
            I&apos;m always down to meet people who are curious and like to just do things. Please{' '}
            <a 
              href="/connect"
              className="about-quick-link underline decoration-accent hover:text-accent transition-colors"
            >
              reach out
            </a>
            :)
          </p>
        </div>

        {/* Photo section - only visible on mobile */}
        <div className="hidden mobile-show-photo pt-4 pb-4">
          <div className="w-48 h-64 bg-muted/10 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-muted text-sm">photo</span>
          </div>
        </div>

      </div>
    </div>
  )
}
