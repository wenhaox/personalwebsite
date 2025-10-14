'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [greeting, setGreeting] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const today = new Date()
    const hour = today.getHours()
    
    // Time-based greeting
    if (hour < 12) {
      setGreeting('Good morning')
    } else if (hour < 17) {
      setGreeting('Good afternoon')
    } else {
      setGreeting('Good evening')
    }
    
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex items-start justify-start min-h-screen mobile-main-content mobile-home-content desktop-home-padding">
      <div className="max-w-xl space-y-5">
        <h1 className="text-2xl md:text-3xl font-serif italic leading-tight text-left">
          {greeting}! I&apos;m Your Name.
        </h1>

        <div className="space-y-3 text-sm leading-relaxed mobile-left-text">
          <p>
            I&apos;m currently building something meaningful, focusing on creating
            spaces and experiences that bring people together.
          </p>

          <p>
            I spend a lot of time <em className="italic underline decoration-accent">writing</em> - mostly about my building journey,
            human agency, and ways to live better.
          </p>

          <p>
            I also spend a lot of time moving - whether it&apos;s lifting, taking long
            walks in nature, playing sports, or dancing.
          </p>

          <p>
            I live for beautiful spaces, walkable cities, good writing,
            nourishing food, reggaeton, coffee, potlucks, electric
            conversations, the sun, and dancing!
          </p>

          <p>
            I&apos;d describe most of my friends as social technologists. They&apos;re
            thoughtful, curious, benevolent, charming, have a bias for action,
            and they care about people. If that sounds like you, or if you
            resonate with anything on my website, please{' '}
            <a 
              href="/connect"
              className="underline decoration-accent hover:text-accent transition-colors"
            >
              reach out
            </a> :)
          </p>
        </div>

        {/* Photo section - only visible on mobile */}
        <div className="hidden mobile-show-photo pt-4 pb-16">
          <div className="w-48 h-64 bg-muted/10 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-muted text-sm">photo</span>
          </div>
        </div>

      </div>
    </div>
  );
}
