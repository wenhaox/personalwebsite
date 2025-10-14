'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPanel() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'photos' | 'recently' | 'guestbook' | 'stats'>('photos')
  
  // Photos state
  const [photos, setPhotos] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [photoForm, setPhotoForm] = useState({
    id: null as number | null,
    title: '',
    location: '',
    color: '',
    theme: '',
    description: '',
    aspectRatio: 'aspect-[3/4]',
    imageUrl: ''
  })
  
  // Recently state
  const [recentlyItems, setRecentlyItems] = useState<any[]>([])
  const [recentlyForm, setRecentlyForm] = useState({
    id: null as number | null,
    category: '',
    item: '',
    emoji: '',
    description: '',
    date: '',
    spotifyEmbed: '',
    podcastEmbed: '',
    image: '',
    images: '',
    link: '',
    linkText: '',
    links: ''
  })
  
  // Stats state
  const [stats, setStats] = useState({
    miles: 342,
    coffees: 127
  })
  
  // Guestbook state
  const [guestbookEntries, setGuestbookEntries] = useState<any[]>([])
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = () => {
    // Load photos
    const storedPhotos = localStorage.getItem('customPhotos')
    if (storedPhotos) setPhotos(JSON.parse(storedPhotos))
    
    // Load categories
    const storedCategories = localStorage.getItem('photoCategories')
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories))
    } else {
      const defaults = ['street', 'scenery', 'person', 'details', 'nature', 'urban']
      setCategories(defaults)
      localStorage.setItem('photoCategories', JSON.stringify(defaults))
    }
    
    // Load colors
    const storedColors = localStorage.getItem('photoColors')
    if (storedColors) {
      setColors(JSON.parse(storedColors))
    } else {
      const defaultColors = ['blue', 'golden', 'warm', 'monochrome', 'green']
      setColors(defaultColors)
      localStorage.setItem('photoColors', JSON.stringify(defaultColors))
    }
    
    // Load locations
    const storedLocations = localStorage.getItem('photoLocations')
    if (storedLocations) {
      setLocations(JSON.parse(storedLocations))
    } else {
      const defaultLocations = ['San Francisco', 'Marin County', 'Downtown', 'Urban']
      setLocations(defaultLocations)
      localStorage.setItem('photoLocations', JSON.stringify(defaultLocations))
    }
    
    // Load recently items
    const storedRecently = localStorage.getItem('recentlyItems')
    if (storedRecently) setRecentlyItems(JSON.parse(storedRecently))
    
    // Load guestbook
    const storedGuestbook = localStorage.getItem('guestbookEntries')
    if (storedGuestbook) setGuestbookEntries(JSON.parse(storedGuestbook))
  }
  
  // Photo functions
  const savePhoto = () => {
    if (!photoForm.title || !photoForm.theme) {
      alert('Please fill in title and theme')
      return
    }
    
    let updated
    if (photoForm.id) {
      updated = photos.map(p => p.id === photoForm.id ? { ...photoForm } : p)
      alert('Photo updated!')
    } else {
      updated = [...photos, { ...photoForm, id: Date.now() }]
      alert('Photo added!')
    }
    
    setPhotos(updated)
    localStorage.setItem('customPhotos', JSON.stringify(updated))
    resetPhotoForm()
  }
  
  const deletePhoto = (id: number) => {
    if (!confirm('Delete this photo?')) return
    const updated = photos.filter(p => p.id !== id)
    setPhotos(updated)
    localStorage.setItem('customPhotos', JSON.stringify(updated))
  }
  
  const editPhoto = (photo: any) => {
    setPhotoForm({ ...photo })
  }
  
  const resetPhotoForm = () => {
    setPhotoForm({
      id: null,
      title: '',
      location: '',
      color: '',
      theme: '',
      description: '',
      aspectRatio: 'aspect-[3/4]',
      imageUrl: ''
    })
  }
  
  const addCategory = (category: string) => {
    if (!category.trim()) return
    const updated = [...categories, category.trim().toLowerCase()]
    setCategories(updated)
    localStorage.setItem('photoCategories', JSON.stringify(updated))
  }
  
  const deleteCategory = (category: string) => {
    if (!confirm(`Delete category "${category}"?`)) return
    const updated = categories.filter(c => c !== category)
    setCategories(updated)
    localStorage.setItem('photoCategories', JSON.stringify(updated))
  }
  
  // Recently functions
  const saveRecentlyItem = () => {
    if (!recentlyForm.category || !recentlyForm.item) {
      alert('Please fill in category and item')
      return
    }
    
    const item = {
      ...recentlyForm,
      id: recentlyForm.id || Date.now(),
      images: recentlyForm.images ? recentlyForm.images.split(',').map(s => s.trim()) : undefined,
      links: recentlyForm.links ? JSON.parse(recentlyForm.links) : undefined,
      spotifyEmbed: recentlyForm.spotifyEmbed || undefined,
      podcastEmbed: recentlyForm.podcastEmbed || undefined,
      image: recentlyForm.image || undefined,
      link: recentlyForm.link || undefined,
      linkText: recentlyForm.linkText || undefined
    }
    
    let updated
    if (recentlyForm.id) {
      updated = recentlyItems.map(i => i.id === recentlyForm.id ? item : i)
    } else {
      updated = [...recentlyItems, item]
    }
    
    setRecentlyItems(updated)
    localStorage.setItem('recentlyItems', JSON.stringify(updated))
    resetRecentlyForm()
  }
  
  const deleteRecentlyItem = (id: number) => {
    if (!confirm('Delete this item?')) return
    const updated = recentlyItems.filter(i => i.id !== id)
    setRecentlyItems(updated)
    localStorage.setItem('recentlyItems', JSON.stringify(updated))
  }
  
  const editRecentlyItem = (item: any) => {
    setRecentlyForm({
      id: item.id,
      category: item.category,
      item: item.item,
      emoji: item.emoji,
      description: item.description,
      date: item.date,
      spotifyEmbed: item.spotifyEmbed || '',
      podcastEmbed: item.podcastEmbed || '',
      image: item.image || '',
      images: item.images ? item.images.join(', ') : '',
      link: item.link || '',
      linkText: item.linkText || '',
      links: item.links ? JSON.stringify(item.links, null, 2) : ''
    })
  }
  
  const resetRecentlyForm = () => {
    setRecentlyForm({
      id: null,
      category: '',
      item: '',
      emoji: '',
      description: '',
      date: '',
      spotifyEmbed: '',
      podcastEmbed: '',
      image: '',
      images: '',
      link: '',
      linkText: '',
      links: ''
    })
  }
  
  // Stats functions
  const saveStats = () => {
    localStorage.setItem('customStats', JSON.stringify(stats))
    alert('Stats updated!')
  }
  
  // Guestbook functions
  const approveEntry = (id: number) => {
    const updated = guestbookEntries.map(e => 
      e.id === id ? { ...e, approved: true } : e
    )
    setGuestbookEntries(updated)
    localStorage.setItem('guestbookEntries', JSON.stringify(updated))
  }
  
  const deleteEntry = (id: number) => {
    if (!confirm('Delete this message?')) return
    const updated = guestbookEntries.filter(e => e.id !== id)
    setGuestbookEntries(updated)
    localStorage.setItem('guestbookEntries', JSON.stringify(updated))
  }
  
  const pendingEntries = guestbookEntries.filter(e => !e.approved)
  const approvedEntries = guestbookEntries.filter(e => e.approved)

  return (
    <div className="flex items-start justify-center min-h-screen px-32 py-16 mobile-main-content">
      <div className="max-w-6xl w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-serif italic">Admin Panel</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors notion-button"
          >
            Back to Site
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {(['photos', 'recently', 'guestbook', 'stats'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'guestbook' && pendingEntries.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-accent text-stone-100 rounded-full text-xs">
                  {pendingEntries.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            {/* Photo List */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-serif mb-4">Your Photos ({photos.length})</h2>
              {photos.length === 0 ? (
                <p className="text-muted text-center py-8">No photos yet. Add one below!</p>
              ) : (
                <div className="space-y-3">
                  {photos.map(photo => (
                    <div key={photo.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{photo.title}</h3>
                        <p className="text-sm text-muted">{photo.location} • {photo.theme} • {photo.color}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editPhoto(photo)}
                          className="px-3 py-1 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded notion-button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded notion-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Photo Form */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-serif">{photoForm.id ? 'Edit Photo' : 'Add Photo'}</h2>
                {photoForm.id && (
                  <button
                    onClick={resetPhotoForm}
                    className="px-3 py-1 text-sm bg-muted/20 hover:bg-muted/30 rounded notion-button"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm({...photoForm, title: e.target.value})}
                  className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={photoForm.location}
                  onChange={(e) => setPhotoForm({...photoForm, location: e.target.value})}
                  className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="text"
                  placeholder="Color"
                  value={photoForm.color}
                  onChange={(e) => setPhotoForm({...photoForm, color: e.target.value})}
                  className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <select
                  value={photoForm.theme}
                  onChange={(e) => setPhotoForm({...photoForm, theme: e.target.value})}
                  className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select theme...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Description"
                value={photoForm.description}
                onChange={(e) => setPhotoForm({...photoForm, description: e.target.value})}
                rows={3}
                className="w-full mt-4 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={savePhoto}
                className="w-full mt-4 px-6 py-3 bg-accent text-stone-100 hover:bg-accent-light rounded-lg notion-button"
              >
                {photoForm.id ? 'Update Photo' : 'Add Photo'}
              </button>
            </div>

            {/* Categories Manager */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-serif mb-6">Manage Tags</h2>
              
              {/* Themes */}
              <div className="mb-6">
                <h3 className="text-lg font-serif mb-3">Themes</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full">
                      <span>{cat}</span>
                      <button onClick={() => deleteCategory(cat)} className="hover:text-red-500">✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New theme"
                    id="theme-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCategory((e.target as HTMLInputElement).value)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('theme-input') as HTMLInputElement
                      addCategory(input.value)
                      input.value = ''
                    }}
                    className="px-4 py-2 bg-accent text-stone-100 rounded-lg notion-button"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {/* Colors */}
              <div className="mb-6">
                <h3 className="text-lg font-serif mb-3">Colors</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {colors.map(color => (
                    <div key={color} className="flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full">
                      <span>{color}</span>
                      <button
                        onClick={() => {
                          const updated = colors.filter(c => c !== color)
                          setColors(updated)
                          localStorage.setItem('photoColors', JSON.stringify(updated))
                        }}
                        className="hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New color"
                    id="color-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim()
                        if (value) {
                          const updated = [...colors, value.toLowerCase()]
                          setColors(updated)
                          localStorage.setItem('photoColors', JSON.stringify(updated))
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('color-input') as HTMLInputElement
                      const value = input.value.trim()
                      if (value) {
                        const updated = [...colors, value.toLowerCase()]
                        setColors(updated)
                        localStorage.setItem('photoColors', JSON.stringify(updated))
                        input.value = ''
                      }
                    }}
                    className="px-4 py-2 bg-accent text-stone-100 rounded-lg notion-button"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {/* Locations */}
              <div>
                <h3 className="text-lg font-serif mb-3">Locations</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {locations.map(location => (
                    <div key={location} className="flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full">
                      <span>{location}</span>
                      <button
                        onClick={() => {
                          const updated = locations.filter(l => l !== location)
                          setLocations(updated)
                          localStorage.setItem('photoLocations', JSON.stringify(updated))
                        }}
                        className="hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New location"
                    id="location-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim()
                        if (value) {
                          const updated = [...locations, value]
                          setLocations(updated)
                          localStorage.setItem('photoLocations', JSON.stringify(updated))
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('location-input') as HTMLInputElement
                      const value = input.value.trim()
                      if (value) {
                        const updated = [...locations, value]
                        setLocations(updated)
                        localStorage.setItem('photoLocations', JSON.stringify(updated))
                        input.value = ''
                      }
                    }}
                    className="px-4 py-2 bg-accent text-stone-100 rounded-lg notion-button"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recently Tab */}
        {activeTab === 'recently' && (
          <div className="space-y-6">
            {/* Recently List */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-serif mb-4">Recently Items ({recentlyItems.length})</h2>
              {recentlyItems.length === 0 ? (
                <p className="text-muted text-center py-8">No items yet. Add one below!</p>
              ) : (
                <div className="space-y-3">
                  {recentlyItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.emoji} {item.item}</h3>
                        <p className="text-sm text-muted">{item.category} • {item.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editRecentlyItem(item)}
                          className="px-3 py-1 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded notion-button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRecentlyItem(item.id)}
                          className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded notion-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recently Form */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-serif">{recentlyForm.id ? 'Edit Item' : 'Add Item'}</h2>
                {recentlyForm.id && (
                  <button
                    onClick={resetRecentlyForm}
                    className="px-3 py-1 text-sm bg-muted/20 hover:bg-muted/30 rounded notion-button"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Category (e.g., Music)"
                    value={recentlyForm.category}
                    onChange={(e) => setRecentlyForm({...recentlyForm, category: e.target.value})}
                    className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="text"
                    placeholder="Emoji"
                    value={recentlyForm.emoji}
                    onChange={(e) => setRecentlyForm({...recentlyForm, emoji: e.target.value})}
                    className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="text"
                    placeholder="Date (e.g., This week)"
                    value={recentlyForm.date}
                    onChange={(e) => setRecentlyForm({...recentlyForm, date: e.target.value})}
                    className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Item title"
                  value={recentlyForm.item}
                  onChange={(e) => setRecentlyForm({...recentlyForm, item: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <textarea
                  placeholder="Description"
                  value={recentlyForm.description}
                  onChange={(e) => setRecentlyForm({...recentlyForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="text"
                  placeholder="Spotify Embed URL (optional)"
                  value={recentlyForm.spotifyEmbed}
                  onChange={(e) => setRecentlyForm({...recentlyForm, spotifyEmbed: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="text"
                  placeholder="Image URL (optional)"
                  value={recentlyForm.image}
                  onChange={(e) => setRecentlyForm({...recentlyForm, image: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <button
                onClick={saveRecentlyItem}
                className="w-full mt-4 px-6 py-3 bg-accent text-stone-100 hover:bg-accent-light rounded-lg notion-button"
              >
                {recentlyForm.id ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        )}

        {/* Guestbook Tab */}
        {activeTab === 'guestbook' && (
          <div className="space-y-6">
            {pendingEntries.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-2xl font-serif mb-4">Pending Approval ({pendingEntries.length})</h2>
                <div className="space-y-3">
                  {pendingEntries.map(entry => (
                    <div key={entry.id} className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{entry.name}</h3>
                          <p className="text-xs text-muted">{entry.date}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveEntry(entry.id)}
                            className="px-3 py-1 text-sm bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded notion-button"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded notion-button"
                          >
                            ✕ Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted">{entry.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-serif mb-4">Approved Messages ({approvedEntries.length})</h2>
              {approvedEntries.length === 0 ? (
                <p className="text-muted text-center py-8">No approved messages yet.</p>
              ) : (
                <div className="space-y-3">
                  {approvedEntries.map(entry => (
                    <div key={entry.id} className="flex items-start justify-between p-3 bg-background rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{entry.name}</h3>
                        <p className="text-xs text-muted mb-1">{entry.date}</p>
                        <p className="text-sm text-muted">{entry.message}</p>
                      </div>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded notion-button"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-serif mb-4">Update Stats</h2>
            <p className="text-sm text-muted mb-6">Photos and Updates count automatically. Update the others:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Miles Walked</label>
                <input
                  type="number"
                  value={stats.miles}
                  onChange={(e) => setStats({...stats, miles: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Coffees This Month</label>
                <input
                  type="number"
                  value={stats.coffees}
                  onChange={(e) => setStats({...stats, coffees: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <button
              onClick={saveStats}
              className="w-full mt-4 px-6 py-3 bg-accent text-stone-100 hover:bg-accent-light rounded-lg notion-button"
            >
              Save Stats
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
