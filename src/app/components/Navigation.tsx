'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { name: 'About', href: '/' },
    { name: 'Photos', href: '/photography' },
    { name: 'Recently', href: '/recently' },
    { name: 'Resume', href: '/resume' },
    { name: 'Connect', href: '/connect' },
  ]

  return (
    <nav className="w-full lg:w-80 lg:min-h-screen p-4 lg:p-12 flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start bg-background/95 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none sticky top-0 lg:static z-40" style={{paddingTop: 'calc(0px + 8px)', '--lg-padding-top': 'calc(20vh + 8px)'} as any}>
      <div className="flex flex-row lg:flex-col items-center lg:items-start space-x-4 lg:space-x-0 lg:space-y-8 lg:ml-16" style={{paddingTop: '0', '--lg-padding-top': 'calc(20vh + 8px)'} as any}>
        {/* Logo diamonds */}
        <div className="flex gap-2">
          <div 
            className="w-6 h-6 bg-accent shadow-inner rotate-45"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}
          ></div>
          <div 
            className="w-6 h-6 bg-accent shadow-inner rotate-45"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}
          ></div>
        </div>


        {/* Navigation Links */}
        <div className="flex flex-row lg:flex-col space-x-4 lg:space-x-0 lg:space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block text-sm transition-colors hover:underline ${
                pathname === item.href ? 'underline font-medium' : ''
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop only - Photo section */}
      <div className="hidden lg:flex lg:flex-col lg:space-y-8">
        {/* Divider line before photo - same width and centered with photo */}
        <div className="w-48 h-px bg-accent"></div>

        {/* Photo - made bigger and rounded */}
        <div className="w-48 h-64 bg-muted/10 rounded-2xl flex items-center justify-center">
          <span className="text-muted text-sm">photo</span>
        </div>
      </div>
    </nav>
  )
}
