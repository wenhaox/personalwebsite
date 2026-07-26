import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Peter Xu'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

async function loadCrimsonItalic() {
  try {
    const response = await fetch(
      'https://cdn.jsdelivr.net/fontsource/fonts/crimson-text@latest/latin-600-italic.ttf',
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
    loadCrimsonItalic(),
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

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(100deg, rgba(10,8,14,0.55) 0%, rgba(10,8,14,0.18) 42%, rgba(10,8,14,0) 70%), linear-gradient(0deg, rgba(10,8,14,0.45) 0%, rgba(10,8,14,0.08) 40%, rgba(10,8,14,0) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 56,
            bottom: 52,
            display: 'flex',
            alignItems: 'center',
            gap: 22,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 42,
              height: 42,
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
                top: 8,
                right: 8,
                bottom: 8,
                left: 8,
                background: '#a855f7',
                opacity: 0.92,
                transform: 'rotate(45deg)',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: '#f4f5ef',
              fontFamily: fontData ? 'Crimson' : 'serif',
              fontStyle: 'italic',
              fontWeight: 600,
            }}
          >
            Peter Xu
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
              style: 'italic' as const,
              weight: 600 as const,
            },
          ]
        : undefined,
    },
  )
}
