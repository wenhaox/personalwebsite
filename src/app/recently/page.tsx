export default function Recently() {
  const recentlyItems = [
    { 
      category: 'Music', 
      item: 'Rosalía - MOTOMAMI', 
      emoji: '🎵',
      description: 'This album is pure art - the way she blends flamenco with experimental pop is incredible. Every track feels like a different world.',
      date: 'This week'
    },
    { 
      category: 'Podcast', 
      item: 'The Tim Ferriss Show', 
      emoji: '🎧',
      description: 'Been diving deep into his conversations with creatives and entrepreneurs. The episode with Derek Sivers changed how I think about decision-making.',
      date: 'Last few days'
    },
    { 
      category: 'Realization', 
      item: 'Small daily rituals > big changes', 
      emoji: '💡',
      description: 'I used to think I needed massive shifts to create change. But my morning coffee ritual, evening walks, and 5-minute journal entries have been more transformative than any big life overhaul.',
      date: 'Yesterday'
    },
    { 
      category: 'Movie', 
      item: 'Everything Everywhere All at Once', 
      emoji: '🎬',
      description: 'Watched this for the third time and I\'m still discovering new layers. It\'s chaos and beauty and humanity all wrapped into one perfect film.',
      date: 'Last weekend'
    },
    { 
      category: 'Cooked', 
      item: 'Homemade sourdough pizza', 
      emoji: '🍕',
      description: 'Finally nailed the dough after weeks of experimenting. There\'s something magical about creating something delicious from just flour, water, and time.',
      date: 'Two days ago'
    },
    { 
      category: 'Book', 
      item: 'The Creative Act by Rick Rubin', 
      emoji: '📚',
      description: 'This book is rewiring how I think about creativity. It\'s not about forcing ideas - it\'s about creating space for them to emerge.',
      date: 'Currently reading'
    },
    { 
      category: 'Place', 
      item: 'Golden Gate Park at sunrise', 
      emoji: '🌅',
      description: 'Discovered this quiet spot near the Japanese Tea Garden. The way the morning light filters through the trees is pure magic.',
      date: 'This morning'
    },
    { 
      category: 'Learning', 
      item: 'Spanish conversation practice', 
      emoji: '🗣️',
      description: 'Started having weekly conversations with a language partner. My confidence is slowly building, and I love how language opens up new ways of thinking.',
      date: 'Ongoing'
    }
  ]

  return (
    <div className="flex items-start justify-start min-h-screen px-32 py-16">
      <div className="w-full">
        <section>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif italic leading-tight mb-6">Recently</h1>
            <p className="text-sm text-muted leading-relaxed max-w-3xl">
              A glimpse into what's been capturing my attention, inspiring me, and shaping my days. 
              These are the small moments and discoveries that make life rich.
            </p>
          </div>

          {/* Recently Items */}
          <div className="space-y-8 pt-8 border-t border-border">
            {recentlyItems.map((recent, index) => (
              <div key={index} className="group">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{recent.emoji}</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-accent uppercase tracking-wide">
                          {recent.category}
                        </span>
                        <span className="text-xs text-muted">
                          {recent.date}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-serif leading-tight">
                      {recent.item}
                    </h3>
                    <p className="text-muted leading-relaxed">
                      {recent.description}
                    </p>
                  </div>
                </div>
                {index < recentlyItems.length - 1 && (
                  <div className="mt-8 border-b border-border/30"></div>
                )}
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted italic">
              This page is a living document - I update it regularly with whatever's 
              currently inspiring me or occupying my thoughts. Check back often!
            </p>
          </div>
        </div>
        </section>
      </div>
    </div>
  )
}
