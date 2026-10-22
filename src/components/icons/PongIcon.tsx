interface PongIconProps {
  size?: number
  strokeWidth?: number
  className?: string
}

/** Two paddles, a centre line and a ball. Matches Lucide's 24px stroke style. */
export function PongIcon({ size = 24, strokeWidth = 2, className }: PongIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6.5v6.5" />
      <path d="M20 11v6.5" />
      <path d="M12 3.5v2M12 8v2M12 14v2M12 18.5v2" strokeWidth={strokeWidth * 0.8} />
      <circle cx="14.6" cy="9.4" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
