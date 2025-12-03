"use client"

import dynamic from 'next/dynamic'
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Suspense } from 'react'

const ParticleSphere = dynamic(
  () => import('@/components/ui/3d-orbit-gallery').then((mod) => ({ default: mod.ParticleSphere })),
  { ssr: false }
)

export default function IndustriesGallery() {
  return (
    <div className="w-full h-[600px] relative rounded-3xl overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-lg">Loading 3D Experience...</div>
        </div>
      }>
        <Canvas camera={{ position: [-12, 2, 12], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <ParticleSphere />
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minDistance={8}
            maxDistance={25}
          />
        </Canvas>
      </Suspense>
      
      {/* Overlay Instructions */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
        <p className="text-white text-sm font-medium">🖱️ Drag to rotate · Scroll to zoom · Click & drag to pan</p>
      </div>
    </div>
  )
}
