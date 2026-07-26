import { ImageResponse } from 'next/og'

export const alt = 'Peter Xu'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f5ef',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 36,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 88,
              height: 88,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#7c2d92',
                transform: 'rotate(45deg)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                bottom: 16,
                left: 16,
                background: '#a855f7',
                opacity: 0.86,
                transform: 'rotate(45deg)',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 600,
                letterSpacing: '-0.03em',
                color: '#1a1a1a',
                lineHeight: 1,
              }}
            >
              Peter Xu
            </div>
            <div
              style={{
                fontSize: 28,
                color: '#5b5b5b',
                letterSpacing: '0.01em',
              }}
            >
              peterxu.space
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
