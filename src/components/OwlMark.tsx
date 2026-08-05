/**
 * The owl of Athena: two ringed eyes with gold irises and a feathered brow.
 * Ported verbatim from the Glaux Markets product so the mark is identical
 * across properties. Strokes use `currentColor`; the irises stay gleam-gold.
 * The 3D hero owl is this same geometry given depth.
 */
export default function OwlMark({
  size = 28,
  className,
}: {
  size?: number | string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
    >
      <circle cx="10.5" cy="15.5" r="4.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="21.5" cy="15.5" r="4.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10.5" cy="15.5" r="1.7" fill="#E9B45C" />
      <circle cx="21.5" cy="15.5" r="1.7" fill="#E9B45C" />
      <path
        d="M5.5 11.5 Q10.5 7 16 11.5 Q21.5 7 26.5 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
