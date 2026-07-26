import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Peter Xu'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const photoBytes = await readFile(
    join(process.cwd(), 'public/photos/076-DSCF1105.jpg'),
  )
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
            left: 52,
            bottom: 48,
            display: 'flex',
            width: 44,
            height: 44,
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
      </div>
    ),
    {
      ...size,
    },
  )
}
