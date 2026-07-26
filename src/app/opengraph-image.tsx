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
        {/* Full-bleed photo */}
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
            objectPosition: 'center 42%',
          }}
        />

        {/* Soft vignette so type stays readable */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(90deg, rgba(12,10,16,0.72) 0%, rgba(12,10,16,0.28) 48%, rgba(12,10,16,0.12) 100%), linear-gradient(0deg, rgba(12,10,16,0.55) 0%, rgba(12,10,16,0.08) 42%, rgba(12,10,16,0.18) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '52px 56px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                width: 28,
                height: 28,
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
                  top: 6,
                  right: 6,
                  bottom: 6,
                  left: 6,
                  background: '#a855f7',
                  opacity: 0.9,
                  transform: 'rotate(45deg)',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(244,245,239,0.88)',
                fontWeight: 500,
              }}
            >
              peterxu.space
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 92,
                lineHeight: 0.95,
                letterSpacing: '-0.035em',
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
                fontSize: 30,
                lineHeight: 1.25,
                color: 'rgba(244,245,239,0.82)',
                fontWeight: 400,
                maxWidth: 560,
              }}
            >
              Photos, notes, and what I’m into lately
            </div>
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
