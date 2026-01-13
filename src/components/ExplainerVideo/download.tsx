'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

interface DownloadVideoProps {
  variant: string
  variantName: string
}

export function DownloadVideoButton({ variant, variantName }: DownloadVideoProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    
    try {
      // Create instructions modal
      const instructions = `
# Download Instructions for ${variantName}

## Option 1: Screen Recording (Recommended)
1. Play the video on the page
2. Use your browser's built-in screen recording:
   - **Windows**: Press Win + G to open Game Bar, then record
   - **Mac**: Press Cmd + Shift + 5 for screen recording
   - **Chrome/Edge**: Use extensions like "Screen Recorder"
3. Record the video area (30 seconds)
4. Save the recording

## Option 2: Browser Extension
1. Install a screen recording extension:
   - Loom (loom.com)
   - Screencastify (screencastify.com)
   - Nimbus Screenshot
2. Record the video
3. Export as MP4

## Option 3: Developer Tools (Advanced)
1. Open browser DevTools (F12)
2. Use the Performance tab to record
3. Export the recording

## Video Settings:
- Duration: 30 seconds
- Resolution: 1920x1080 recommended
- Format: MP4 (H.264)
- Frame rate: 30fps
`

      // Create and download instructions file
      const blob = new Blob([instructions], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${variant}-download-instructions.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Also show alert with quick instructions
      alert(
        `Download instructions saved!\n\n` +
        `Quick method:\n` +
        `1. Play the video\n` +
        `2. Use screen recording (Win+G on Windows, Cmd+Shift+5 on Mac)\n` +
        `3. Record for 30 seconds\n` +
        `4. Save as MP4\n\n` +
        `Detailed instructions saved to: ${variant}-download-instructions.md`
      )
    } catch (error) {
      console.error('Download error:', error)
      alert('Error generating download instructions. Please use screen recording manually.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
    >
      <Download className="w-4 h-4" />
      {isDownloading ? 'Preparing...' : 'Download Instructions'}
    </button>
  )
}

