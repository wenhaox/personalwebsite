import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 96,
            height: 96,
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
              top: 18,
              right: 18,
              bottom: 18,
              left: 18,
              background: '#a855f7',
              opacity: 0.86,
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
