import { cn } from '@/lib/utils'

interface FaviconIconProps extends React.SVGAttributes<SVGElement> {
  size?: number
  color?: string
}

/**
 * Simplified "K" monogram icon optimized for small sizes (favicon, app icons).
 * Features bold, geometric letterform with high contrast for legibility at 16x16px and above.
 */
export function FaviconIcon({ size = 512, color, className, ...props }: FaviconIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-label="Knutpunkt Icon"
      role="img"
      {...props}
    >
      {/* Background circle for maskable icon support */}
      <circle cx="256" cy="256" r="256" fill={color || 'currentColor'} opacity="0.1" />

      {/* Bold "K" letterform */}
      <g fill={color || 'currentColor'}>
        {/* Vertical stem of K */}
        <rect x="140" y="140" width="80" height="232" rx="10" />

        {/* Upper diagonal of K */}
        <path d="M 220 190 L 372 140 L 372 220 L 260 260 Z" />

        {/* Lower diagonal of K */}
        <path d="M 260 252 L 372 292 L 372 372 L 220 322 Z" />
      </g>
    </svg>
  )
}
