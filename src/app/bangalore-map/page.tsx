'use client';

import React from 'react';
import BangaloreMapIllustration from '@/components/BangaloreMapIllustration';

/**
 * Test/Preview page for Bangalore Map Illustration Component
 * Visit: http://localhost:3000/bangalore-map
 */
export default function BangaloreMapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Bangalore Map Illustration
          </h1>
          <p className="text-gray-300">
            Animated network map with quantum nodes - Platform Performance style
          </p>
        </div>

        {/* Map Container */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-[#FF5200]/20 p-6 mb-8 shadow-2xl">
          <div className="w-full" style={{ height: '600px' }}>
            <BangaloreMapIllustration 
              width="100%"
              height="100%"
              backgroundColor="transparent"
              showOutline={false}
            />
          </div>
        </div>

        {/* Usage Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Example 1: Without Labels */}
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-[#FF5200]/20 shadow-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Without Labels</h2>
            <div className="w-full" style={{ height: '300px' }}>
              <BangaloreMapIllustration 
                width="100%"
                height="100%"
                backgroundColor="transparent"
                showLabels={false}
              />
            </div>
          </div>

          {/* Example 2: Faster Animation */}
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-[#E4002B]/20 shadow-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Faster Animation</h2>
            <div className="w-full" style={{ height: '300px' }}>
              <BangaloreMapIllustration 
                width="100%"
                height="100%"
                backgroundColor="transparent"
                animationSpeed={2}
              />
            </div>
          </div>

          {/* Example 3: No Outline */}
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-[#FF6B35]/20 shadow-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">No City Outline</h2>
            <div className="w-full" style={{ height: '300px' }}>
              <BangaloreMapIllustration 
                width="100%"
                height="100%"
                backgroundColor="transparent"
                showOutline={false}
              />
            </div>
          </div>

          {/* Example 4: Slower Animation */}
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-[#FF5200]/20 shadow-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Slower Animation</h2>
            <div className="w-full" style={{ height: '300px' }}>
              <BangaloreMapIllustration 
                width="100%"
                height="100%"
                backgroundColor="transparent"
                animationSpeed={0.5}
              />
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mt-8 bg-gray-900/80 backdrop-blur-xl rounded-lg border border-[#FF5200]/30 shadow-2xl p-6 text-white">
          <h2 className="text-xl font-semibold mb-4 text-white">Usage Example</h2>
          <pre className="text-sm overflow-x-auto text-gray-200">
            <code>{`import BangaloreMapIllustration from '@/components/BangaloreMapIllustration';

// Basic usage on dark background (homepage)
<BangaloreMapIllustration 
  width="100%" 
  height="600px" 
  backgroundColor="transparent"
/>

// With custom animation speed
<BangaloreMapIllustration 
  width="100%" 
  height="600px"
  animationSpeed={1.5}
/>

// Get coordinates for an area
import { getAreaCoordinates } from '@/components/BangaloreMapIllustration';
const coords = getAreaCoordinates('MG Road');
// Returns: { x: 420, y: 300 }`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

