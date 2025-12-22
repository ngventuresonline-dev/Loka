/**
 * Script to convert animated SVG favicon to PNG for WhatsApp sharing
 * WhatsApp link previews require static images (PNG/JPG), not animated SVGs
 * 
 * Usage: npx tsx scripts/convert-favicon-to-png.ts
 */

import fs from 'fs'
import path from 'path'

async function convertSvgToPng() {
  try {
    // Check if puppeteer is available, if not, provide manual instructions
    let puppeteer
    try {
      puppeteer = await import('puppeteer')
    } catch (error) {
      console.error('❌ Puppeteer not found. Installing...')
      console.log('Please run: npm install --save-dev puppeteer')
      console.log('\nAlternatively, you can manually convert the SVG to PNG:')
      console.log('1. Open public/lokazen-favicon.svg in a browser')
      console.log('2. Take a screenshot or use an online SVG to PNG converter')
      console.log('3. Save as public/lokazen-favicon.png (1200x1200px recommended)')
      process.exit(1)
    }

    const svgPath = path.join(process.cwd(), 'public', 'lokazen-favicon.svg')
    const pngPath = path.join(process.cwd(), 'public', 'lokazen-favicon.png')

    if (!fs.existsSync(svgPath)) {
      console.error(`❌ SVG file not found at: ${svgPath}`)
      process.exit(1)
    }

    const svgContent = fs.readFileSync(svgPath, 'utf-8')

    console.log('🚀 Starting browser...')
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    
    // Set viewport to 1200x1200 for optimal WhatsApp sharing
    await page.setViewport({ width: 1200, height: 1200 })

    // Create HTML with the SVG embedded
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              width: 1200px;
              height: 1200px;
              background-color: #FAFAFA;
            }
            svg {
              width: 1200px;
              height: 1200px;
            }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `

    await page.setContent(html)
    
    // Wait for any animations to render (though PNG will be static)
    await page.waitForTimeout(1000)

    console.log('📸 Capturing screenshot...')
    await page.screenshot({
      path: pngPath,
      width: 1200,
      height: 1200,
      type: 'png',
    })

    await browser.close()

    console.log(`✅ Successfully created PNG at: ${pngPath}`)
    console.log('📱 The PNG is now optimized for WhatsApp link previews!')
  } catch (error: any) {
    console.error('❌ Error converting SVG to PNG:', error.message)
    console.log('\n💡 Manual conversion option:')
    console.log('1. Open public/lokazen-favicon.svg in Chrome/Firefox')
    console.log('2. Right-click and inspect, then use browser DevTools to export as PNG')
    console.log('3. Or use an online tool like: https://convertio.co/svg-png/')
    console.log('4. Save as public/lokazen-favicon.png (1200x1200px)')
    process.exit(1)
  }
}

convertSvgToPng()

