import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Peter Xu'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

async function loadFont() {
  try {
    const response = await fetch(
      'https://cdn.jsdelivr.net/fontsource/fonts/crimson-text@latest/latin-600-normal.ttf',
    )
    if (!response.ok) return null
    return await response.arrayBuffer()
  } catch {
    return null
  }
}

export default async function OpenGraphImage() {
  const [photoBytes, fontData] = await Promise.all([
    readFile(join(process.cwd(), 'public/photos/076-DSCF1105.jpg')),
    loadFont(),
  ])
  const photoSrc = `data:image/jpeg;base64,${photoBytes.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#1a1a1a',
        }}
      >
        <img
          src={photoSrc}
          alt=""
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 40%',
          }}
        />

        {/* Left / bottom wash so type stays readable in iMessage crops */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(100deg, rgba(10,8,14,0.78) 0%, rgba(10,8,14,0.42) 38%, rgba(10,8,14,0.08) 68%), linear-gradient(0deg, rgba(10,8,14,0.62) 0%, rgba(10,8,14,0.12) 45%, rgba(10,8,14,0.2) 100%)',
          }}
        />

        {/* Brand row — top left */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 36,
              height: 36,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#c4b5fd',
                transform: 'rotate(45deg)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 7,
                right: 7,
                bottom: 7,
                left: 7,
                background: '#a855f7',
                opacity: 0.92,
                transform: 'rotate(45deg)',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(244,245,239,0.9)',
              fontWeight: 500,
            }}
          >
            peterxu.space
          </div>
        </div>

        {/* Name block — lower left, stays in most link-preview crops */}
        <div
          style={{
            position: 'absolute',
            left: 56,
            bottom: 54,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: 700,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 96,
              lineHeight: 0.92,
              letterSpacing: '-0.04em',
              color: '#f4f5ef',
              fontWeight: 600,
              fontFamily: fontData ? 'Crimson' : 'serif',
            }}
          >
            Peter Xu
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              lineHeight: 1.3,
              color: 'rgba(244,245,239,0.84)',
              fontWeight: 400,
              maxWidth: 520,
            }}
          >
            Photos, notes, and what I’m into lately
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: 'Crimson',
              data: fontData,
              style: 'normal' as const,
              weight: 600 as const,
            },
          ]
        : undefined,
    },
  )
}
