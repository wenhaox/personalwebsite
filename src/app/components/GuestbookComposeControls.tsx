'use client'

import { GUESTBOOK_NOTE_COLORS, useGuestbookCompose } from './GuestbookComposeContext'

type GuestbookComposeControlsProps = {
  className?: string
  layout?: 'sidebar' | 'bar'
}

export default function GuestbookComposeControls({
  className = '',
  layout = 'sidebar',
}: GuestbookComposeControlsProps) {
  const { noteColor, setNoteColor, requestPin } = useGuestbookCompose()

  return (
    <div className={`guestbook-compose-controls guestbook-compose-controls-${layout} ${className}`.trim()}>
      <div className="guestbook-compose-palette-block">
        {layout === 'sidebar' ? (
          <p className="guestbook-compose-desktop-label">Pick a color</p>
        ) : null}
        <div
          className={`guestbook-note-color-picker ${layout === 'sidebar' ? 'guestbook-sidebar-palette' : ''}`.trim()}
          role="group"
          aria-label="Post-it note color"
        >
          <div className="guestbook-note-color-swatches">
            {GUESTBOOK_NOTE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`guestbook-note-color-swatch ${noteColor === color ? 'is-selected' : ''}`}
                style={{ backgroundColor: color, background: color }}
                aria-label={`Choose ${color} note`}
                aria-pressed={noteColor === color}
                onClick={() => setNoteColor(color)}
              />
            ))}
          </div>
          <button
            type="button"
            className={`guestbook-pin-button guestbook-pin-button-inline ${layout === 'sidebar' ? 'guestbook-pin-button-sidebar' : 'guestbook-pin-button-bar'}`.trim()}
            aria-label="Pin note"
            title="Pin note"
            onClick={requestPin}
          >
            📌
          </button>
        </div>
      </div>
    </div>
  )
}
