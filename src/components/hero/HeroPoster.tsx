import OwlMark from "../OwlMark";

/**
 * The hero's static composition: a gold gleam, the owl mark, and a set of
 * instrument rings. Pure markup and CSS, so it paints with the document and
 * acts as the LCP element on every load. It is also the permanent fallback
 * when WebGL is unavailable, motion is reduced, or the device is a phone.
 */
export default function HeroPoster() {
  return (
    <div className="poster" aria-hidden="true">
      <div className="poster__glow" />
      <svg className="poster__rings" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth="0.4" opacity="0.55" />
        <circle
          cx="100"
          cy="100"
          r="88"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeDasharray="0.6 7"
          strokeLinecap="round"
          opacity="0.8"
        />
        <circle
          cx="100"
          cy="100"
          r="66"
          stroke="currentColor"
          strokeWidth="0.4"
          strokeDasharray="22 12"
          opacity="0.6"
        />
        <circle cx="100" cy="100" r="44" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
      </svg>
      <OwlMark className="poster__mark" size="100%" />
    </div>
  );
}
