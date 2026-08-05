/** Outbound-link glyph. Shifts on hover via the `.icon-arrow` rule. */
export default function ArrowUpRight({ size = 14 }: { size?: number }) {
  return (
    <svg
      className="icon-arrow"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4.5 11.5 11.5 4.5M5.6 4.5h5.9v5.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
