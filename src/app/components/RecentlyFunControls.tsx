'use client'

const RECENTLY_SHUFFLE_EVENT = 'recently:shuffle-shelf'
const RECENTLY_LAMP_EVENT = 'recently:toggle-lamp'
const RECENTLY_WATER_EVENT = 'recently:water-plant'

const pulse = (button: HTMLButtonElement, classDurationMs: number) => {
  button.classList.remove('is-acting')
  void button.offsetWidth
  button.classList.add('is-acting')
  window.setTimeout(() => button.classList.remove('is-acting'), classDurationMs)
}

interface RecentlyFunControlsProps {
  className?: string
  layout?: 'stack' | 'row'
}

export default function RecentlyFunControls({
  className = '',
  layout = 'stack',
}: RecentlyFunControlsProps) {
  return (
    <div className={`sidebar-recently-dice-panel recently-fun-controls recently-fun-controls-${layout} ${className}`.trim()}>
      <button
        type="button"
        className="sidebar-recently-dice-btn sidebar-recently-control is-dice"
        onClick={(event) => {
          pulse(event.currentTarget, 750)
          window.dispatchEvent(new Event(RECENTLY_SHUFFLE_EVENT))
        }}
        aria-label="Shuffle shelf"
        title="Shuffle shelf"
      >
        <img src="/pixel-objects/dice-cube.svg" alt="" aria-hidden="true" className="sidebar-recently-dice-art" />
      </button>

      <div className="sidebar-recently-fun-stack">
        <button
          type="button"
          className="sidebar-recently-dice-btn sidebar-recently-control is-lamp"
          onClick={(event) => {
            pulse(event.currentTarget, 520)
            window.dispatchEvent(new Event(RECENTLY_LAMP_EVENT))
          }}
          aria-label="Toggle desk lamp"
          title="Toggle lamp"
        >
          <img src="/pixel-objects/desk-lamp.svg" alt="" aria-hidden="true" className="sidebar-recently-dice-art" />
        </button>
        <button
          type="button"
          className="sidebar-recently-dice-btn sidebar-recently-control is-water"
          onClick={(event) => {
            pulse(event.currentTarget, 700)
            window.dispatchEvent(new Event(RECENTLY_WATER_EVENT))
          }}
          aria-label="Water the plant"
          title="Water plant"
        >
          <img src="/pixel-objects/watering-can.svg" alt="" aria-hidden="true" className="sidebar-recently-dice-art" />
        </button>
      </div>
    </div>
  )
}
