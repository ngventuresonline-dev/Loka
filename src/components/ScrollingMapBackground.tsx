'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

// Metro cities with positions on India map
const metroData = [
  {
    city: 'Bengaluru',
    x: 48, y: 70,
    areas: ['MG Road', 'Indiranagar', 'Koramangala', 'Whitefield', 'HSR'],
    color: '#a855f7'
  },
  {
    city: 'Mumbai',
    x: 38, y: 55,
    areas: ['Bandra', 'Andheri', 'Lower Parel', 'BKC', 'Powai'],
    color: '#ec4899'
  },
  {
    city: 'Delhi NCR',
    x: 48, y: 28,
    areas: ['CP', 'Cyber City', 'Saket', 'Noida', 'Gurgaon'],
    color: '#3b82f6'
  },
  {
    city: 'Hyderabad',
    x: 52, y: 60,
    areas: ['Banjara Hills', 'Jubilee Hills', 'Hitech City', 'Gachibowli'],
    color: '#8b5cf6'
  },
  {
    city: 'Pune',
    x: 42, y: 58,
    areas: ['Koregaon Park', 'Viman Nagar', 'Baner', 'Hinjewadi'],
    color: '#f97316'
  },
  {
    city: 'Chennai',
    x: 54, y: 72,
    areas: ['T Nagar', 'Anna Nagar', 'Velachery', 'OMR'],
    color: '#06b6d4'
  },
  {
    city: 'Kolkata',
    x: 64, y: 45,
    areas: ['Park Street', 'Salt Lake', 'New Town', 'Ballygunge'],
    color: '#10b981'
  }
];

// Simplified India outline
const indiaOutline = `
  M48,10 L52,8 L58,10 L62,15 L65,22 L68,30 L70,38 L68,45 L66,50 
  L64,56 L61,63 L58,68 L55,73 L52,76 L48,78 L45,76 L42,73 L40,68 
  L38,63 L36,56 L35,50 L34,45 L33,38 L35,30 L38,22 L42,16 L45,12 Z
`;

export default function ScrollingMapBackground() {
  const { scrollYProgress } = useScroll();
  const [highlightedCity, setHighlightedCity] = useState(0);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      const cityIndex = Math.min(
        Math.floor(latest * metroData.length * 1.5),
        metroData.length - 1
      );
      setHighlightedCity(cityIndex);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const mapOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 0.4, 0.4, 0]);

  return (
    <motion.div 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: mapOpacity }}
    >
      {/* City Indicator */}
      <motion.div
        key={metroData[highlightedCity].city}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-24 right-8 text-right hidden md:block"
      >
        <div className="text-xs font-medium text-purple-600/40 mb-1">Exploring</div>
        <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600/30 to-pink-600/30">
          {metroData[highlightedCity].city}
        </div>
      </motion.div>

      {/* Left Side Areas */}
      <div className="absolute left-4 top-1/4 w-48 space-y-6 hidden lg:block">
        {metroData.slice(0, 4).map((metro, idx) => (
          <motion.div
            key={metro.city}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: highlightedCity === idx ? 0.8 : 0.4,
              x: 0,
              scale: highlightedCity === idx ? 1.05 : 1
            }}
            transition={{ duration: 0.5 }}
            className="space-y-1"
          >
            <div className="text-sm font-bold" style={{ color: metro.color }}>
              {metro.city}
            </div>
            {metro.areas.slice(0, 3).map((area, i) => (
              <div key={i} className="text-[10px] text-gray-500 pl-2">
                • {area}
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Right Side Areas */}
      <div className="absolute right-4 top-1/4 w-48 space-y-6 hidden lg:block">
        {metroData.slice(4, 7).map((metro, idx) => (
          <motion.div
            key={metro.city}
            initial={{ opacity: 0, x: 20 }}
            animate={{ 
              opacity: highlightedCity === idx + 4 ? 0.8 : 0.4,
              x: 0,
              scale: highlightedCity === idx + 4 ? 1.05 : 1
            }}
            transition={{ duration: 0.5 }}
            className="space-y-1 text-right"
          >
            <div className="text-sm font-bold" style={{ color: metro.color }}>
              {metro.city}
            </div>
            {metro.areas.slice(0, 3).map((area, i) => (
              <div key={i} className="text-[10px] text-gray-500 pr-2">
                {area} •
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      {/* India Map */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full max-w-3xl max-h-[80vh]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d={indiaOutline}
            fill="none"
            stroke="url(#india-gradient)"
            strokeWidth="0.4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />

          <defs>
            <linearGradient id="india-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
            </linearGradient>
            <radialGradient id="city-glow">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {metroData.map((metro, idx) => (
            <g key={metro.city}>
              {highlightedCity === idx && (
                <motion.circle
                  cx={metro.x}
                  cy={metro.y}
                  r="5"
                  fill="url(#city-glow)"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}

              <motion.circle
                cx={metro.x}
                cy={metro.y}
                r={highlightedCity === idx ? "2" : "1.5"}
                fill={metro.color}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: highlightedCity === idx ? 1 : 0.6
                }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              />

              <motion.text
                x={metro.x}
                y={metro.y - 3}
                className="text-[2.5px] font-bold"
                fill={metro.color}
                textAnchor="middle"
                initial={{ opacity: 0 }}
                animate={{ opacity: highlightedCity === idx ? 0.9 : 0.5 }}
                transition={{ duration: 0.5 }}
              >
                {metro.city}
              </motion.text>

              {highlightedCity === idx && (
                <g>
                  {metro.areas.slice(0, 3).map((area, areaIdx) => {
                    const angle = (areaIdx * 120 - 60) * (Math.PI / 180);
                    const radius = 8;
                    const ax = metro.x + Math.cos(angle) * radius;
                    const ay = metro.y + Math.sin(angle) * radius;

                    return (
                      <g key={area}>
                        <motion.line
                          x1={metro.x}
                          y1={metro.y}
                          x2={ax}
                          y2={ay}
                          stroke={metro.color}
                          strokeWidth="0.2"
                          opacity="0.3"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: areaIdx * 0.1 }}
                        />
                        <motion.circle
                          cx={ax}
                          cy={ay}
                          r="0.6"
                          fill={metro.color}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: areaIdx * 0.1 }}
                        />
                        <motion.text
                          x={ax}
                          y={ay - 1.5}
                          className="text-[1.5px] font-medium"
                          fill={metro.color}
                          textAnchor="middle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.7 }}
                          transition={{ duration: 0.3, delay: areaIdx * 0.1 + 0.2 }}
                        >
                          {area}
                        </motion.text>
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `
          linear-gradient(to right, rgba(139, 92, 246, 0.3) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}></div>
    </motion.div>
  );
}
