'use client'

import { useState, useEffect } from 'react'

export default function Recently() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [stats, setStats] = useState({
    photos: 0,
    recentlyItems: 0,
    coffees: 127,
    miles: 342
  })

  useEffect(() => {
    // Load custom recently items from localStorage
    const stored = localStorage.getItem('recentlyItems')
    if (stored) {
      setItems(JSON.parse(stored))
    }
    
    // Load stats
    const photos = JSON.parse(localStorage.getItem('customPhotos') || '[]')
    const recently = JSON.parse(localStorage.getItem('recentlyItems') || '[]')
    const customStats = JSON.parse(localStorage.getItem('customStats') || '{}')
    
    setStats({
      photos: photos.length + 6,
      recentlyItems: recently.length > 0 ? recently.length : 5,
      miles: customStats.miles || 342,
      coffees: customStats.coffees || 127
    })
  }, [])
  
  const defaultRecentlyItems = [
    { 
      category: 'Music', 
      item: 'Rosalía - MOTOMAMI', 
      emoji: '🎵',
      description: 'This album is pure art - the way she blends flamenco with experimental pop is incredible. Every track feels like a different world.',
      date: 'This week',
      spotifyEmbed: 'https://open.spotify.com/embed/album/5G2f63n7IPVPPjfNIGih7Q',
      link: 'https://open.spotify.com/album/5G2f63n7IPVPPjfNIGih7Q',
      linkText: '▶ Open in Spotify'
    },
    { 
      category: 'Listening', 
      item: 'The Tim Ferriss Show & The Creative Act', 
      emoji: '🎧',
      description: 'Been diving deep into Tim\'s conversations with creatives. Also reading Rick Rubin\'s book on creativity - it\'s rewiring how I think about the creative process.',
      date: 'Last few days',
      image: 'https://via.placeholder.com/300x450/7c2d92/ffffff?text=The+Creative+Act',
      podcastEmbed: 'https://open.spotify.com/embed/show/5qSUyCrk9KR69lEiXbjwXM',
      links: [
        { url: 'https://tim.blog/podcast/', text: '🎧 Tim Ferriss Show' },
        { url: 'https://www.goodreads.com/book/show/60965426-the-creative-act', text: '📚 The Creative Act' }
      ]
    },
    { 
      category: 'Movie', 
      item: 'Everything Everywhere All at Once', 
      emoji: '🎬',
      description: 'Watched this for the third time and I\'m still discovering new layers. It\'s chaos and beauty and humanity all wrapped into one perfect film.',
      date: 'Last weekend',
      image: 'https://via.placeholder.com/400x600/8b5cf6/ffffff?text=EEAAO+Poster',
      link: 'https://www.imdb.com/title/tt6710474/',
      linkText: '🎬 View on IMDB'
    },
    { 
      category: 'Cooked', 
      item: 'Homemade sourdough pizza', 
      emoji: '🍕',
      description: 'Finally nailed the dough after weeks of experimenting. There\'s something magical about creating something delicious from just flour, water, and time.',
      date: 'Two days ago',
      image: 'https://via.placeholder.com/500x400/f97316/ffffff?text=Sourdough+Pizza'
    },
    { 
      category: 'Place', 
      item: 'Golden Gate Park at sunrise', 
      emoji: '🌅',
      description: 'Discovered this quiet spot near the Japanese Tea Garden. The way the morning light filters through the trees is pure magic.',
      date: 'This morning',
      images: [
        'https://via.placeholder.com/400x300/4ade80/ffffff?text=GG+Park+View+1',
        'https://via.placeholder.com/400x300/10b981/ffffff?text=GG+Park+View+2',
        'https://via.placeholder.com/400x300/059669/ffffff?text=GG+Park+View+3'
      ]
    }
  ]

  // Use custom items if available, otherwise use defaults
  const recentlyItems = items.length > 0 ? items : defaultRecentlyItems

  return (
    <div className="flex items-start justify-start min-h-screen px-32 py-16 mobile-main-content bg-background">
      <div className="max-w-4xl mx-auto">
        <section>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif italic leading-tight mb-4 mobile-hide-title">Recently</h1>
            <p className="text-sm text-muted leading-relaxed mb-2">
              A glimpse into what&apos;s been capturing my attention, inspiring me, and shaping my days.
            </p>
            <p className="text-xs text-muted italic">Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg notion-card">
              <div className="text-2xl font-serif font-bold text-accent mb-1">{stats.photos}</div>
              <div className="text-xs text-muted">Photos</div>
            </div>
            <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg notion-card">
              <div className="text-2xl font-serif font-bold text-accent mb-1">{stats.recentlyItems}</div>
              <div className="text-xs text-muted">Updates</div>
            </div>
            <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg notion-card">
              <div className="text-2xl font-serif font-bold text-accent mb-1">{stats.miles}</div>
              <div className="text-xs text-muted">Miles</div>
            </div>
            <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg notion-card">
              <div className="text-2xl font-serif font-bold text-accent mb-1">{stats.coffees}</div>
              <div className="text-xs text-muted">Coffees</div>
            </div>
          </div>

          {/* Recently Items - Single Column */}
          <div className="space-y-6 pt-4">
            {recentlyItems.map((recent, index) => (
              <div 
                key={index} 
                className="group p-4 bg-card border border-border rounded-lg notion-card"
              >
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{recent.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-accent uppercase tracking-wide">
                        {recent.category}
                      </span>
                      <span className="text-xs text-muted">• {recent.date}</span>
                    </div>
                    <h3 className="text-base font-serif leading-tight mb-2">
                      {recent.item}
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      {recent.description}
                    </p>
                    
                    {/* Spotify Embed */}
                    {recent.spotifyEmbed && (
                      <div className="mt-2 notion-card">
                        <iframe 
                          src={recent.spotifyEmbed}
                          width="100%" 
                          height="152" 
                          frameBorder="0" 
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                          loading="lazy"
                          className="rounded-lg"
                        ></iframe>
                      </div>
                    )}
                    
                    {/* Podcast Embed */}
                    {recent.podcastEmbed && (
                      <div className="mt-2 notion-card">
                        <iframe 
                          src={recent.podcastEmbed}
                          width="100%" 
                          height="152" 
                          frameBorder="0" 
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                          loading="lazy"
                          className="rounded-lg"
                        ></iframe>
                      </div>
                    )}
                    
                    {/* Single clickable image */}
                    {recent.image && (
                      <div className="mt-2">
                        <div 
                          className="bg-gradient-to-br from-muted/10 to-muted/30 rounded-lg overflow-hidden w-full max-w-xs cursor-pointer notion-card"
                          onClick={() => setSelectedImage(recent.image!)}
                        >
                          <img 
                            src={recent.image} 
                            alt={recent.item}
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Multiple clickable images for Place */}
                    {recent.images && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {recent.images.map((img, imgIndex) => (
                          <div 
                            key={imgIndex} 
                            className="bg-gradient-to-br from-muted/10 to-muted/30 rounded-lg overflow-hidden aspect-[4/3] cursor-pointer notion-card"
                            onClick={() => setSelectedImage(img)}
                          >
                            <img 
                              src={img} 
                              alt={`${recent.item} ${imgIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Multiple Links */}
                    {recent.links && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {recent.links.map((linkItem, linkIndex) => (
                          <a 
                            key={linkIndex}
                            href={linkItem.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="notion-link inline-flex items-center space-x-2 text-sm text-accent hover:text-accent-light"
                          >
                            <span>{linkItem.text}</span>
                            <span>→</span>
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {/* Single Link */}
                    {recent.link && !recent.links && (
                      <div className="mt-3">
                        <a 
                          href={recent.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="notion-link inline-flex items-center space-x-2 text-sm text-accent hover:text-accent-light"
                        >
                          <span>{recent.linkText}</span>
                          <span>→</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted italic">
              This page is a living document - I update it regularly with whatever&apos;s 
              currently inspiring me or occupying my thoughts. Check back often!
            </p>
          </div>
        </div>
        </section>
      </div>
      
      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-accent/80 text-white rounded-full flex items-center justify-center transition-all z-10"
          >
            ✕
          </button>
          <img 
            src={selectedImage} 
            alt="Full size"
            className="max-w-[90%] max-h-[90%] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
