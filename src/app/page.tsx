'use client'

import { useEffect, useState } from 'react'

const getGreetingByHour = (hour: number): string => {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
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
            I&apos;m currently building something meaningful, focusing on creating
            spaces and experiences that bring people together.
          </p>

          <p className="about-seq-line about-seq-line-2">
            I spend a lot of time <em className="italic underline decoration-accent">writing</em> - mostly about my building journey,
            human agency, and ways to live better. I share shorter updates on{' '}
            <a 
              href="/recently"
              className="about-quick-link underline decoration-accent hover:text-accent transition-colors"
            >
              Recently
            </a>
            .
          </p>

          <p className="about-seq-line about-seq-line-3">
            I also spend a lot of time moving - whether it&apos;s lifting, taking long
            walks in nature, playing sports, or dancing. I post visual snapshots on{' '}
            <a 
              href="/photos"
              className="about-quick-link underline decoration-accent hover:text-accent transition-colors"
            >
              Photos
            </a>
            .
          </p>

          <p className="about-seq-line about-seq-line-4">
            I live for beautiful spaces, walkable cities, good writing,
            nourishing food, reggaeton, coffee, potlucks, electric
            conversations, the sun, and dancing!
          </p>

          <p className="about-seq-line about-seq-line-5">
            I&apos;d describe most of my friends as social technologists. They&apos;re
            thoughtful, curious, benevolent, charming, have a bias for action,
            and they care about people. If that sounds like you, or if you
            resonate with anything on my website, please{' '}
            <a 
              href="/connect"
              className="about-quick-link underline decoration-accent hover:text-accent transition-colors"
            >
              reach out
            </a> :)
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
