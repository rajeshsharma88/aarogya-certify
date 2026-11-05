/**
 * Original Aarogya India mark: a lotus resting on a heartbeat pulse inside a
 * shield. Hand-authored SVG (no third-party artwork).
 */
export function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Aarogya India">
      <defs>
        <linearGradient id="aic-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#134e4a" />
        </linearGradient>
      </defs>
      <path
        d="M24 3 8 9v12c0 9.4 6.4 17.4 16 21 9.6-3.6 16-11.6 16-21V9L24 3Z"
        fill="url(#aic-shield)"
      />
      <path
        d="M12 25h6l2.5-6 3.5 11 3-8 2.5 3H36"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="#fde68a">
        <ellipse cx="24" cy="16.3" rx="2.2" ry="5" />
        <ellipse cx="18.2" cy="18.2" rx="2.2" ry="4.6" transform="rotate(-34 18.2 18.2)" />
        <ellipse cx="29.8" cy="18.2" rx="2.2" ry="4.6" transform="rotate(34 29.8 18.2)" />
      </g>
    </svg>
  );
}

export function LogoWordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Logo />
      <span className="leading-tight">
        <span className="block font-display text-lg font-semibold tracking-tight text-ink">Aarogya India</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700">
          Certifications
        </span>
      </span>
    </span>
  );
}
