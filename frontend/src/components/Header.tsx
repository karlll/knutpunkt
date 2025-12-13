import { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { Logo } from './Logo'
import { SettingsDialog } from './SettingsDialog'
import { Button } from './ui/button'
import { Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  showLogo?: boolean
  onCreateTask?: () => void
}

export function Header({ title = 'Knutpunkt', showLogo = true, onCreateTask, className, ...props }: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          className
        )}
        {...props}
      >
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {showLogo && <Logo size="small" className="text-foreground" />}
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {onCreateTask && (
              <Button
                variant="outline"
                size="icon"
                onClick={onCreateTask}
                title="Create new task"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
