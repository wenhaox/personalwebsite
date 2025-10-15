'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
// import Image from 'next/image'

export default function Photography() {
  const [sortBy, setSortBy] = useState<'theme' | 'color' | 'location' | null>('theme');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [customPhotos, setCustomPhotos] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [hoveredPhoto, setHoveredPhoto] = useState<any>(null);
  const [filterTag, setFilterTag] = useState<string>('');

  useEffect(() => {
    // Load custom photos from localStorage
    const stored = localStorage.getItem('customPhotos')
    if (stored) {
      setCustomPhotos(JSON.parse(stored))
    }
    
    // Load custom categories
    const storedCategories = localStorage.getItem('photoCategories')
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories))
    }
  }, [])
  
  const deletePhoto = (photoId: number) => {
    if (!confirm('Delete this photo?')) return
    
    const updated = customPhotos.filter(p => p.id !== photoId)
    setCustomPhotos(updated)
    localStorage.setItem('customPhotos', JSON.stringify(updated))
  }

  const defaultPhotos = [
    {
      id: 1,
      title: 'City Lights',
      location: 'San Francisco, CA',
      aspectRatio: 'aspect-[3/4]',
      color: 'blue',
      theme: 'street',
      description: 'The quiet moments between the chaos'
    },
    {
      id: 2,
      title: 'Golden Hour',
      location: 'Marin County, CA',
      aspectRatio: 'aspect-[4/3]',
      color: 'golden',
      theme: 'scenery',
      description: 'When the world glows softly'
    },
    {
      id: 3,
      title: 'Natural Light',
      location: 'Studio',
      aspectRatio: 'aspect-[2/3]',
      color: 'warm',
      theme: 'person',
      description: 'Capturing the essence of being'
    },
    {
      id: 4,
      title: 'Modern Lines',
      location: 'Downtown',
      aspectRatio: 'aspect-[16/9]',
      color: 'monochrome',
      theme: 'details',
      description: 'Where geometry meets emotion'
    },
    {
      id: 5,
      title: 'Forest Path',
      location: 'Muir Woods, CA',
      aspectRatio: 'aspect-[3/5]',
      color: 'green',
      theme: 'scenery',
      description: 'Finding peace in nature\'s cathedral'
    },
    {
      id: 6,
      title: 'Reflections',
      location: 'Urban',
      aspectRatio: 'aspect-square',
      color: 'blue',
      theme: 'street',
      description: 'Reality bent through glass and light'
    }
  ]

  // Combine default and custom photos
  const photos = [...defaultPhotos, ...customPhotos]

  // Filter photos by tag if filterTag is set
  const filteredPhotos = filterTag
    ? photos.filter(photo => {
        const searchTerm = filterTag.toLowerCase()
        return (
          photo.theme?.toLowerCase().includes(searchTerm) ||
          photo.color?.toLowerCase().includes(searchTerm) ||
          photo.location?.toLowerCase().includes(searchTerm) ||
          photo.title?.toLowerCase().includes(searchTerm)
        )
      })
    : photos

  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    if (!sortBy) return 0;

    const aValue = a[sortBy]?.toString().toLowerCase() || '';
    const bValue = b[sortBy]?.toString().toLowerCase() || '';

    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
    return 0;
  });
  
  // Get unique tags for quick filters based on selected sort category
  const quickTags: string[] = []
  if (sortBy) {
    const allTags = new Set<string>()
    photos.forEach(photo => {
      const value = photo[sortBy]
      if (value) {
        if (sortBy === 'location') {
          allTags.add(value.split(',')[0].trim()) // Just city
        } else {
          allTags.add(value)
        }
      }
    })
    quickTags.push(...Array.from(allTags))
  }

  const openLightbox = (photo: any) => {
    setSelectedPhoto(photo);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  return (
    <div className="flex items-start justify-start min-h-screen px-32 py-16 mobile-main-content bg-background">
      <div className="max-w-5xl mx-auto"> {/* Wider container */}
        {/* Header */}
        <section className="mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif italic leading-tight mb-6 mobile-hide-title">Photos</h1>
            <p className="text-sm text-muted leading-relaxed"> {/* Smaller text */}
              A collection of moments captured through my lens. Each image tells a story
              of the people, places, and experiences that have moved me. Photography is my
              way of preserving the fleeting beauty I encounter in everyday life.
            </p>
          </div>
        </section>

        {/* Sort Controls */}
        <div className="pt-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-center mb-4">
            <p className="text-sm text-muted">Sort by:</p>
            <button
              onClick={() => setSortBy('theme')}
              className={`text-sm font-medium transition-colors cursor-pointer notion-button ${
                sortBy === 'theme' ? 'text-accent font-medium' : 'hover:text-accent'
              }`}
            >
              Theme
            </button>
            <button
              onClick={() => setSortBy('color')}
              className={`text-sm font-medium transition-colors cursor-pointer notion-button ${
                sortBy === 'color' ? 'text-accent font-medium' : 'hover:text-accent'
              }`}
            >
              Color
            </button>
            <button
              onClick={() => setSortBy('location')}
              className={`text-sm font-medium transition-colors cursor-pointer notion-button ${
                sortBy === 'location' ? 'text-accent font-medium' : 'hover:text-accent'
              }`}
            >
              Location
            </button>
          </div>
          
          {/* Quick Filters - only show when a sort category is selected */}
          {sortBy && quickTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center justify-center">
              <p className="text-xs text-muted">Filter by {sortBy}:</p>
              <button
                onClick={() => setFilterTag('')}
                className={`text-xs px-3 py-1 rounded-full transition-colors notion-button ${
                  !filterTag 
                    ? 'bg-accent text-stone-100' 
                    : 'bg-muted/20 hover:bg-muted/30'
                }`}
              >
                All
              </button>
              {quickTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors notion-button ${
                    filterTag === tag 
                      ? 'bg-accent text-stone-100' 
                      : 'bg-muted/20 hover:bg-muted/30'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Masonry Photo Grid */}
        <div className="columns-2 sm:columns-2 lg:columns-3 gap-4 mb-12 photo-grid-container"> {/* 2 columns on mobile, tighter gap */}
          {sortedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="break-inside-avoid mb-4 group cursor-pointer"
              onClick={() => openLightbox(photo)}
              onMouseEnter={() => setHoveredPhoto(photo)}
              onMouseLeave={() => setHoveredPhoto(null)}
            >
              <div className="relative overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg w-full">
                {/* Photo Container with Dynamic Aspect Ratio */}
                <div className={`relative ${photo.aspectRatio} bg-gradient-to-br from-muted/10 to-muted/30 w-full max-w-full`}>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center p-4">
                    <div className="text-center w-full">
                      <div className="text-3xl mb-2">📸</div>
                      <p className="text-sm font-medium break-words">{photo.title}</p>
                      <p className="text-xs text-muted break-words">{photo.location}</p>
                      <p className="text-xs text-accent mt-1 break-words">{photo.theme}</p>
                    </div>
                  </div>
                  {/* <Image
                    src={photo.imageUrl}
                    alt={photo.title}
                    fill
                    className="object-cover"
                  /> */}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 md:p-8"
            onClick={closeLightbox}
          >
            <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute -top-2 right-2 md:-top-10 md:right-0 w-7 h-7 md:w-6 md:h-6 bg-accent/50 hover:bg-accent/80 text-stone-50 rounded-lg md:rounded-full flex items-center justify-center transition-all z-10 text-xs font-light"
              >
                ✕
              </button>

              {/* Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 bg-card rounded-lg overflow-hidden shadow-2xl">
                {/* Image side */}
                <div className="relative bg-gradient-to-br from-muted/10 to-muted/30 min-h-[300px] md:min-h-[400px] flex items-center justify-center p-8">
                  <div className="text-center text-muted">
                    <div className="text-6xl mb-4">📸</div>
                    <p className="text-lg">{selectedPhoto.title}</p>
                  </div>
                </div>

                {/* Details side */}
                <div className="flex items-center justify-center p-6 md:p-8">
                  <div className="text-center space-y-3 w-full">
                    <h2 className="text-lg md:text-xl font-serif italic">{selectedPhoto.title}</h2>
                    <div className="text-xs md:text-sm text-muted flex flex-wrap items-center justify-center gap-2">
                      <span>{selectedPhoto.location}</span>
                      <span>|</span>
                      <span>{selectedPhoto.color}</span>
                      <span>|</span>
                      <span>{selectedPhoto.theme}</span>
                    </div>
                    <p className="text-xs md:text-sm text-muted leading-relaxed">{selectedPhoto.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
