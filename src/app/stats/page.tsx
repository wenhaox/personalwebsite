'use client'

import { useState, useEffect } from 'react'

export default function Stats() {
  const [stats, setStats] = useState({
    photos: 0,
    recentlyItems: 0,
    coffees: 127,
    miles: 342,
    lastUpdated: new Date().toLocaleDateString()
  })
  
  useEffect(() => {
    // Load stats from localStorage
    const photos = JSON.parse(localStorage.getItem('customPhotos') || '[]')
    const recently = JSON.parse(localStorage.getItem('recentlyItems') || '[]')
    
    setStats(prev => ({
      ...prev,
      photos: photos.length + 6, // 6 default photos
      recentlyItems: recently.length > 0 ? recently.length : 5 // 5 default items
    }))
  }, [])
  
  const statCards = [
    { label: 'Photos Captured', value: stats.photos, emoji: '📸', color: 'from-purple-500/10 to-purple-600/10' },
    { label: 'Recently Items', value: stats.recentlyItems, emoji: '✨', color: 'from-blue-500/10 to-blue-600/10' },
    { label: 'Miles Walked', value: stats.miles, emoji: '🚶', color: 'from-green-500/10 to-green-600/10' },
    { label: 'Coffees This Month', value: stats.coffees, emoji: '☕', color: 'from-orange-500/10 to-orange-600/10' },
  ]
  
  return (
    <div className="flex items-start justify-start min-h-screen px-32 py-16 mobile-main-content">
      <div className="max-w-4xl mx-auto">
        <section>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif italic leading-tight mb-4 mobile-hide-title">Stats</h1>
              <p className="text-sm text-muted leading-relaxed mb-2">
                A quantified look at my life, updated in real-time.
              </p>
              <p className="text-xs text-muted italic">Last updated: {stats.lastUpdated}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 gap-4 pt-4">
              {statCards.map((stat, index) => (
                <div 
                  key={index}
                  className={`p-6 bg-gradient-to-br ${stat.color} border border-border rounded-lg notion-card`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{stat.emoji}</span>
                    <span className="text-3xl font-serif font-bold text-accent">{stat.value}</span>
                  </div>
                  <h3 className="text-sm font-medium text-muted">{stat.label}</h3>
                </div>
              ))}
            </div>

            {/* Activity Chart Placeholder */}
            <div className="pt-6">
              <h2 className="text-2xl font-serif mb-4">This Month</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-card border border-border rounded-lg">
                  <div className="text-xs text-muted mb-1">Photos</div>
                  <div className="text-2xl font-serif text-accent">+12</div>
                  <div className="text-xs text-muted mt-1">↑ 20% from last month</div>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg">
                  <div className="text-xs text-muted mb-1">Miles</div>
                  <div className="text-2xl font-serif text-accent">+89</div>
                  <div className="text-xs text-muted mt-1">↑ 15% from last month</div>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg">
                  <div className="text-xs text-muted mb-1">Coffees</div>
                  <div className="text-2xl font-serif text-accent">+42</div>
                  <div className="text-xs text-muted mt-1">↑ 5% from last month</div>
                </div>
              </div>
            </div>

            {/* Fun Facts */}
            <div className="pt-6 border-t border-border">
              <h2 className="text-2xl font-serif mb-4">Fun Facts</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-accent">•</span>
                  <p className="text-sm text-muted">
                    Average of <span className="text-foreground font-medium">2.3 photos</span> per day
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent">•</span>
                  <p className="text-sm text-muted">
                    Most active time: <span className="text-foreground font-medium">Golden hour (6-7 PM)</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent">•</span>
                  <p className="text-sm text-muted">
                    Favorite location: <span className="text-foreground font-medium">San Francisco, CA</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent">•</span>
                  <p className="text-sm text-muted">
                    Coffee to photo ratio: <span className="text-foreground font-medium">1:0.5</span> (one coffee per two photos!)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

