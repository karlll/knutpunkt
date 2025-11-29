import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type LogoSize = 'small' | 'medium' | 'large'

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: LogoSize
}

const sizeMap: Record<LogoSize, string> = {
  small: 'h-6',   // 24px
  medium: 'h-10', // 40px
  large: 'h-16',  // 64px
}

export function Logo({ size = 'medium', className, ...props }: LogoProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark')
      setIsDark(isDarkMode)
    }

    checkTheme()

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const logoSrc = isDark ? '/logo-gray.svg' : '/logo-black.svg'

  return (
    <img
      src={logoSrc}
      alt="Knutpunkt Logo"
      className={cn('w-auto', sizeMap[size], className)}
      {...props}
    />
  )
}
