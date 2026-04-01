'use client'

import GuestbookBook from '@/app/components/GuestbookBook'

export default function Guestbook() {
  return (
    <div className="flex items-start justify-start min-h-screen h-screen px-24 py-8 mobile-main-content bg-background">
      <div className="max-w-6xl mx-auto w-full h-full">
        <section className="h-full">
          <div className="space-y-4 h-full flex flex-col">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif italic leading-tight mb-4 mobile-hide-title">Guestbook</h1>
            </div>

            <div className="flex-1 min-h-0">
              <GuestbookBook fullHeight />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
