import type { Config } from 'tailwindcss'
import catppuccin from '@catppuccin/tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [
    catppuccin({
      prefix: 'ctp',
      defaultFlavour: 'latte',
    }),
  ],
} satisfies Config
