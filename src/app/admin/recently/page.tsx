'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RecentlyAdmin() {
  const router = useRouter()
  const [recentlyItems, setRecentlyItems] = useState<any[]>([])
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // Check admin session
    const session = localStorage.getItem('adminSession')
    if (!session || Date.now() - parseInt(session) > 24 * 60 * 60 * 1000) {
      router.push('/')
      return
    }

    // Load recently items from localStorage
    const stored = localStorage.getItem('recentlyItems')
    if (stored) {
      setRecentlyItems(JSON.parse(stored))
    }
  }, [router])

  const saveItem = () => {
    if (!editingItem) return

    const updated = editingItem.id 
      ? recentlyItems.map(item => item.id === editingItem.id ? editingItem : item)
      : [...recentlyItems, { ...editingItem, id: Date.now() }]
    
    setRecentlyItems(updated)
    localStorage.setItem('recentlyItems', JSON.stringify(updated))
    setIsEditing(false)
    setEditingItem(null)
  }

  const deleteItem = (id: number) => {
    if (!confirm('Delete this item?')) return
    
    const updated = recentlyItems.filter(item => item.id !== id)
    setRecentlyItems(updated)
    localStorage.setItem('recentlyItems', JSON.stringify(updated))
  }

  const startEdit = (item?: any) => {
    setEditingItem(item || {
      category: '',
      item: '',
      emoji: '',
      description: '',
      date: '',
      image: '',
      images: [],
      link: '',
      linkText: '',
      links: [],
      spotifyEmbed: '',
      podcastEmbed: ''
    })
    setIsEditing(true)
  }

  return (
    <div className="flex items-start justify-center min-h-screen px-32 py-16 mobile-main-content">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-serif italic mb-2">Recently Admin</h1>
            <p className="text-muted">Manage your Recently section</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors notion-button"
            >
              ← Back to Admin
            </Link>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors notion-button"
            >
              Back to Site
            </button>
          </div>
        </div>

        {!isEditing ? (
          <>
            <button
              onClick={() => startEdit()}
              className="w-full px-6 py-3 bg-accent text-stone-100 hover:bg-accent-light transition-colors rounded-lg shadow-sm font-medium mb-6 notion-button"
            >
              + Add New Item
            </button>

            <div className="space-y-4">
              {recentlyItems.length === 0 ? (
                <div className="text-center py-12 border border-border rounded-lg bg-card">
                  <p className="text-muted">No items yet. Add your first one!</p>
                </div>
              ) : (
                recentlyItems.map((item) => (
                  <div key={item.id} className="border border-border rounded-lg p-6 bg-card notion-card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="text-sm font-medium text-accent uppercase tracking-wide">
                            {item.category}
                          </span>
                          <span className="text-xs text-muted">{item.date}</span>
                        </div>
                        <h3 className="text-xl font-serif mb-2">{item.item}</h3>
                        <p className="text-muted text-sm line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="px-3 py-1 text-sm bg-accent/10 hover:bg-accent/20 text-accent rounded transition-colors notion-button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded transition-colors notion-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-serif mb-6">{editingItem?.id ? 'Edit Item' : 'Add New Item'}</h2>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    value={editingItem?.category || ''}
                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                    placeholder="Music, Listening, Movie, etc."
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Emoji</label>
                  <input
                    type="text"
                    value={editingItem?.emoji || ''}
                    onChange={(e) => setEditingItem({...editingItem, emoji: e.target.value})}
                    placeholder="🎵 🎧 🎬 etc."
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={editingItem?.item || ''}
                  onChange={(e) => setEditingItem({...editingItem, item: e.target.value})}
                  placeholder="Rosalía - MOTOMAMI"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingItem?.description || ''}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="text"
                  value={editingItem?.date || ''}
                  onChange={(e) => setEditingItem({...editingItem, date: e.target.value})}
                  placeholder="This week, Last weekend, etc."
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-serif mb-4">Media & Links</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Spotify Embed URL</label>
                    <input
                      type="url"
                      value={editingItem?.spotifyEmbed || ''}
                      onChange={(e) => setEditingItem({...editingItem, spotifyEmbed: e.target.value})}
                      placeholder="https://open.spotify.com/embed/album/..."
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <p className="text-xs text-muted mt-1">Get from Spotify → Share → Embed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Podcast Embed URL</label>
                    <input
                      type="url"
                      value={editingItem?.podcastEmbed || ''}
                      onChange={(e) => setEditingItem({...editingItem, podcastEmbed: e.target.value})}
                      placeholder="https://open.spotify.com/embed/show/..."
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Image URL</label>
                    <input
                      type="url"
                      value={editingItem?.image || ''}
                      onChange={(e) => setEditingItem({...editingItem, image: e.target.value})}
                      placeholder="https://..."
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Multiple Images (comma-separated URLs)</label>
                    <textarea
                      value={editingItem?.images?.join(', ') || ''}
                      onChange={(e) => setEditingItem({...editingItem, images: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)})}
                      placeholder="url1, url2, url3"
                      rows={2}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Link URL</label>
                      <input
                        type="url"
                        value={editingItem?.link || ''}
                        onChange={(e) => setEditingItem({...editingItem, link: e.target.value})}
                        placeholder="https://..."
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Link Text</label>
                      <input
                        type="text"
                        value={editingItem?.linkText || ''}
                        onChange={(e) => setEditingItem({...editingItem, linkText: e.target.value})}
                        placeholder="▶ Play on Spotify"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={saveItem}
                  className="flex-1 px-6 py-3 bg-accent text-stone-100 hover:bg-accent-light transition-colors rounded-lg shadow-sm font-medium notion-button"
                >
                  Save Item
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditingItem(null)
                  }}
                  className="px-6 py-3 bg-muted/20 hover:bg-muted/30 transition-colors rounded-lg notion-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

