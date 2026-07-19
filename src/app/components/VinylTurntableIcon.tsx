'use client'

/** Turntable with a round spinning disc; inline so SMIL animation works. */
export default function VinylTurntableIcon() {
  return (
    <span className="recently-turntable" aria-hidden="true">
      <svg
        className="recently-turntable-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width="100%"
        height="100%"
        fill="none"
      >
        {/* deck */}
        <rect x="6" y="26" width="52" height="28" fill="#334155" />
        <rect x="8" y="28" width="48" height="22" fill="#475569" />
        <rect x="6" y="52" width="52" height="2" fill="#1e293b" />

        {/* platter */}
        <circle cx="27" cy="39" r="15" fill="#94a3b8" />
        <circle cx="27" cy="39" r="13" fill="#64748b" />

        {/* spinning vinyl — asymmetric marks so rotation is obvious */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 27 39"
            to="360 27 39"
            dur="2.8s"
            repeatCount="indefinite"
          />
          <circle cx="27" cy="39" r="11.5" fill="#0f172a" />
          {/* grooves */}
          <circle cx="27" cy="39" r="10.2" fill="none" stroke="#334155" strokeWidth="0.7" />
          <circle cx="27" cy="39" r="8.8" fill="none" stroke="#1e293b" strokeWidth="0.8" />
          <circle cx="27" cy="39" r="7.4" fill="none" stroke="#334155" strokeWidth="0.7" />
          <circle cx="27" cy="39" r="6.1" fill="none" stroke="#1e293b" strokeWidth="0.7" />
          {/* shiny wedge so you can see it spin */}
          <path
            d="M27 39 L27 28.2 A10.8 10.8 0 0 1 35.5 32.5 Z"
            fill="#94a3b8"
            opacity="0.35"
          />
          <path
            d="M27 39 L27 29.4 A9.6 9.6 0 0 1 33.8 32.2 Z"
            fill="#e2e8f0"
            opacity="0.45"
          />
          {/* label with off-center mark */}
          <circle cx="27" cy="39" r="4.3" fill="#f59e0b" />
          <circle cx="27" cy="39" r="3.2" fill="#fbbf24" />
          <rect x="25.2" y="36.2" width="3.6" height="1.2" fill="#b45309" />
          <rect x="28.4" y="38.4" width="1.5" height="2.4" fill="#92400e" />
          <circle cx="27" cy="39" r="1.15" fill="#0f172a" />
        </g>

        {/* tonearm */}
        <rect x="46" y="28" width="6" height="6" fill="#cbd5e1" />
        <rect x="48" y="30" width="2" height="2" fill="#64748b" />
        <rect x="36" y="36" width="14" height="2" fill="#e2e8f0" />
        <rect x="34" y="38" width="4" height="4" fill="#94a3b8" />
        <rect x="35" y="39" width="2" height="2" fill="#475569" />

        {/* knob */}
        <rect x="48" y="42" width="6" height="6" fill="#cbd5e1" />
        <rect x="50" y="44" width="2" height="2" fill="#64748b" />
        <rect x="46" y="50" width="10" height="2" fill="#94a3b8" />
      </svg>
    </span>
  )
}
