import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </Button>
  )
}
