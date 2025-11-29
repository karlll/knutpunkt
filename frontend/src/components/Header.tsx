import { ThemeToggle } from './ThemeToggle'
import { Logo } from './Logo'
import { cn } from '@/lib/utils'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  showLogo?: boolean
}

export function Header({ title = 'Knutpunkt', showLogo = true, className, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
      {...props}
    >
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {showLogo && <Logo size="small" />}
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
