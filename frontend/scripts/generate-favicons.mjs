import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const publicDir = join(__dirname, '..', 'public')
const svgPath = join(publicDir, 'favicon.svg')

// Read the SVG file
const svgBuffer = readFileSync(svgPath)

// Sizes to generate
const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
]

// Generate PNG files
console.log('Generating favicon PNG files...\n')

for (const { size, name } of sizes) {
  const outputPath = join(publicDir, name)

  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath)

  console.log(`✓ Generated ${name} (${size}x${size})`)
}

// Generate favicon.ico (multi-size ICO file)
// ICO format supports multiple sizes in one file
const icoSizes = [16, 32, 48]
const icoBuffers = []

for (const size of icoSizes) {
  const buffer = await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toBuffer()
  icoBuffers.push(buffer)
}

// Create a simple ICO file (just use 32x32 for now as sharp doesn't support ICO natively)
// For production, you might want to use a dedicated ICO library
const ico32 = await sharp(svgBuffer)
  .resize(32, 32)
  .png()
  .toFile(join(publicDir, 'favicon.png'))

console.log(`✓ Generated favicon.png (32x32 - for ICO fallback)`)

console.log('\n✅ All favicons generated successfully!')
console.log('\nGenerated files:')
console.log('  - favicon.svg (vector, used by modern browsers)')
console.log('  - favicon.png (32x32 PNG fallback)')
console.log('  - favicon-16x16.png')
console.log('  - favicon-32x32.png')
console.log('  - favicon-48x48.png')
console.log('  - android-chrome-192x192.png')
console.log('  - android-chrome-512x512.png')
console.log('  - apple-touch-icon.png (180x180)')
