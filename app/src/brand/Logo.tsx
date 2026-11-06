import logoFull from './logo-gurukul.jpg';
import logoSmall from './logo-gurukul-sm.jpg';

/**
 * The Aarogya India Gurukul badge.
 *
 * Two sizes are shipped because the artwork is a detailed photographic badge,
 * not a flat mark: the 320px file keeps the header under 32KB, and the 1024px
 * one is for the certificate and landing hero where it is printed large.
 *
 * The badge is drawn on white. Every current placement sits on a white surface,
 * so it blends; on a dark background it would show as a white rectangle. Use
 * `LogoMark` there instead.
 */
export function Logo({
  className = 'h-10 w-auto',
  large = false,
  alt = 'Aarogya India Gurukul',
}: {
  className?: string;
  large?: boolean;
  alt?: string;
}) {
  return (
    <img
      src={large ? logoFull : logoSmall}
      alt={alt}
      className={className}
      // Intrinsic size prevents the header reflowing as the badge loads.
      width={large ? 1024 : 320}
      height={large ? 682 : 213}
      decoding="async"
    />
  );
}

/**
 * Flat shield mark, hand-authored SVG. Kept for dark backgrounds and for any
 * place too small for the badge to be legible.
 */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Aarogya India Gurukul">
      <defs>
        <linearGradient id="aic-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#134e4a" />
        </linearGradient>
      </defs>
      <path d="M24 3 8 9v12c0 9.4 6.4 17.4 16 21 9.6-3.6 16-11.6 16-21V9L24 3Z" fill="url(#aic-shield)" />
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

/**
 * Horizontal lockup for the header and footer.
 *
 * The badge is a tall, detailed illustration: scaled down to a 44px header it
 * becomes an unreadable smudge. So the bar shows only the badge's wordmark band
 * — the Devanagari name and its plaque — cropped with object-position, which
 * stays legible at that height. The full badge is used where there is room.
 */
export function LogoWordmark({ centered = false }: { centered?: boolean }) {
  return (
    <span className={`flex items-center gap-3 ${centered ? 'justify-center' : ''}`}>
      <span className="block h-11 overflow-hidden rounded" style={{ aspectRatio: '1536 / 340' }}>
        {/* alt is empty: the name is repeated as text alongside, and a screen
            reader should not announce it twice. */}
        <img
          src={logoSmall}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: 'center 74%' }}
        />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-semibold tracking-tight text-ink">
          Aarogya India Gurukul
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700">
          Certifications
        </span>
      </span>
    </span>
  );
}
