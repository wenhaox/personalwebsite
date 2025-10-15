'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [clickCount, setClickCount] = useState(0)

  const navItems = [
    { name: 'About', href: '/' },
    { name: 'Photos', href: '/photos' },
    { name: 'Recently', href: '/recently' },
    { name: 'Connect', href: '/connect' },
  ]

  const handleLogoClick = () => {
    const newCount = clickCount + 1
    setClickCount(newCount)
    
    if (newCount === 5) {
      // Direct access to admin - no password needed
      router.push('/admin')
      setClickCount(0)
    }
    
    // Reset after 3 seconds of no clicks
    setTimeout(() => setClickCount(0), 3000)
  }

  return (
    <nav className="w-80 h-screen p-12 flex flex-col justify-start mobile-nav fixed left-0 top-0" style={{paddingTop: 'calc(20vh + 8px)'}}>
      <div className="space-y-8 ml-16 mobile-nav-content">
        {/* Logo diamonds - click 5x for admin */}
        <div className="flex gap-2 cursor-pointer" onClick={handleLogoClick}>
          <div 
            className="w-6 h-6 bg-accent shadow-inner rotate-45 transition-transform hover:scale-110"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}
          ></div>
          <div 
            className="w-6 h-6 bg-accent shadow-inner rotate-45 transition-transform hover:scale-110"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}
          ></div>
        </div>


        {/* Navigation Links */}
        <div className="space-y-2 mobile-nav-links mobile-override-space">
          {navItems.map((item, index) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block text-sm transition-colors hover:text-accent ${
                pathname === item.href ? 'text-accent font-medium' : ''
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>


        {/* Photo - hidden on mobile, shown on desktop home page only */}
        {pathname === '/' && (
          <div className="w-48 h-64 bg-muted/10 rounded-2xl flex items-center justify-center mobile-hide-photo">
            <span className="text-muted text-sm">photo</span>
          </div>
        )}
      </div>
    </nav>
  )
}

