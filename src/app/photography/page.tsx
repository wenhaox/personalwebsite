'use client'

import { useState } from 'react'
import Image from 'next/image'

// Sample photography data organized by themes/moods - replace with your actual photos
const photos = [
  {
    id: 1,
    title: 'City Lights',
    location: 'San Francisco, CA',
    orientation: 'portrait',
    aspectRatio: 'aspect-[3/4]',
    color: 'blue',
    theme: 'street',
    description: 'The quiet moments between the chaos'
  },
  {
    id: 2,
    title: 'Golden Hour',
    location: 'Marin County, CA',
    orientation: 'landscape',
    aspectRatio: 'aspect-[4/3]',
    color: 'golden',
    theme: 'scenery',
    description: 'When the world glows softly'
  },
  {
    id: 3,
    title: 'Natural Light',
    location: 'Studio',
    orientation: 'portrait',
    aspectRatio: 'aspect-[2/3]',
    color: 'warm',
    theme: 'person',
    description: 'Capturing the essence of being'
  },
  {
    id: 4,
    title: 'Modern Lines',
    location: 'Downtown',
    orientation: 'landscape',
    aspectRatio: 'aspect-[16/9]',
    color: 'monochrome',
    theme: 'details',
    description: 'Where geometry meets emotion'
  },
  {
    id: 5,
    title: 'Forest Path',
    location: 'Muir Woods, CA',
    orientation: 'portrait',
    aspectRatio: 'aspect-[3/5]',
    color: 'green',
    theme: 'scenery',
    description: 'Finding peace in nature\'s cathedral'
  },
  {
    id: 6,
    title: 'Reflections',
    location: 'Urban',
    orientation: 'square',
    aspectRatio: 'aspect-square',
    color: 'blue',
    theme: 'street',
    description: 'Reality bent through glass and light'
  }
]

const colors = ['All', 'blue', 'golden', 'warm', 'monochrome', 'green', 'vibrant']
const themes = ['All', 'person', 'street', 'scenery', 'details']
const locations = ['All', 'San Francisco, CA', 'Marin County, CA', 'Studio', 'Downtown', 'Muir Woods, CA', 'Urban', 'Local Café', 'Ocean Beach', 'Mission District']

export default function Photography() {
  const [sortBy, setSortBy] = useState<'theme' | 'color' | 'location'>('theme')
  const [selectedPhoto, setSelectedPhoto] = useState<typeof photos[0] | null>(null)

  const sortedPhotos = [...photos].sort((a, b) => {
    switch (sortBy) {
      case 'theme': return a.theme.localeCompare(b.theme)
      case 'color': return a.color.localeCompare(b.color)
      case 'location': return a.location.localeCompare(b.location)
      default: return 0
    }
  })

  const openLightbox = (photo: typeof photos[0]) => {
    setSelectedPhoto(photo)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setSelectedPhoto(null)
    document.body.style.overflow = 'unset'
  }

  const getColorClasses = () => {
    return 'border-border bg-card'
  }

  return (
    <div className="flex items-start justify-start min-h-screen px-32 py-16">
      <div className="w-full">
        {/* Header */}
        <section className="mb-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif italic leading-tight mb-6">Photos</h1>
            <p className="text-sm text-muted leading-relaxed">
              A collection of moments captured through my lens. Each image tells a story 
              of the people, places, and experiences that have moved me. Photography is my 
              way of preserving the fleeting beauty I encounter in everyday life.
            </p>
          </div>
        </section>

        {/* Sort Controls */}
        <div className="border-t border-border pt-8 mb-12">
          <div className="flex flex-col gap-4 items-center">
            <p className="text-sm text-muted">Sort by:</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => setSortBy('theme')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === 'theme'
                    ? 'text-accent underline'
                    : 'hover:underline hover:text-accent'
                }`}
              >
                Theme
              </button>
              <button
                onClick={() => setSortBy('color')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === 'color'
                    ? 'text-accent underline'
                    : 'hover:underline hover:text-accent'
                }`}
              >
                Color
              </button>
              <button
                onClick={() => setSortBy('location')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === 'location'
                    ? 'text-accent underline'
                    : 'hover:underline hover:text-accent'
                }`}
              >
                Location
              </button>
            </div>
          </div>
        </div>

        {/* Masonry Photo Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 mb-12">
        {sortedPhotos.map((photo) => (
          <div
            key={photo.id}
            className="break-inside-avoid mb-4 group cursor-pointer"
            onClick={() => openLightbox(photo)}
          >
            <div className="relative overflow-hidden transition-all duration-300 group-hover:scale-[1.02]">
              {/* Photo Container with Dynamic Aspect Ratio */}
              <div className={`relative ${photo.aspectRatio} bg-gradient-to-br from-muted/10 to-muted/30 flex items-center justify-center`}>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="text-2xl mb-2">📸</div>
                    <p className="text-sm font-medium">{photo.title}</p>
                    <p className="text-xs text-muted">{photo.location}</p>
                  </div>
                </div>
                {/* Placeholder for actual image */}
                {/* <Image
                  src={`/photos/${photo.id}.jpg`}
                  alt={photo.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                /> */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white hover:text-accent text-xl z-10"
            >
              ✕ Close
            </button>
            
            <div className="grid md:grid-cols-2 gap-8 bg-card rounded-lg overflow-hidden">
              {/* Image */}
              <div className={`relative ${selectedPhoto.aspectRatio} bg-gradient-to-br from-muted/10 to-muted/30 flex items-center justify-center min-h-[400px]`}>
                <div className="text-center text-muted">
                  <div className="text-6xl mb-4">📸</div>
                  <p className="text-lg">{selectedPhoto.title}</p>
                </div>
                {/* Placeholder for actual image */}
                {/* <Image
                  src={`/photos/${selectedPhoto.id}.jpg`}
                  alt={selectedPhoto.title}
                  fill
                  className="object-cover"
                /> */}
              </div>
              
              {/* Details */}
              <div className="p-8 flex flex-col justify-center">
                <h2 className="text-3xl font-serif mb-4">{selectedPhoto.title}</h2>
                <p className="text-lg text-muted mb-4">{selectedPhoto.location}</p>
                <p className="text-muted mb-6 leading-relaxed">{selectedPhoto.description}</p>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-muted">Color:</span>
                    <span className="ml-2 px-3 py-1 text-sm bg-accent/10 text-accent rounded-full">
                      {selectedPhoto.color}
                    </span>
                  </div>
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
