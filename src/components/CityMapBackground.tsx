'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

// Prime locations for each city
const cities = [
  {
    name: 'Bangalore',
    displayName: 'Bengaluru',
    coordinates: { x: 50, y: 50 },
    primeLocations: [
      { name: 'MG Road', x: 48, y: 52, tier: 'premium' },
      { name: 'Indiranagar', x: 55, y: 50, tier: 'premium' },
      { name: 'Koramangala', x: 52, y: 55, tier: 'premium' },
      { name: 'Brigade Road', x: 47, y: 51, tier: 'premium' },
      { name: 'Whitefield', x: 65, y: 48, tier: 'high' },
      { name: 'HSR Layout', x: 53, y: 58, tier: 'high' },
      { name: 'Malleshwaram', x: 45, y: 45, tier: 'high' },
      { name: 'Jayanagar', x: 48, y: 58, tier: 'high' },
      { name: 'Electronic City', x: 50, y: 68, tier: 'medium' },
      { name: 'Bellandur', x: 58, y: 52, tier: 'medium' },
    ],
    path: 'M45,40 L55,40 L60,45 L62,52 L60,60 L55,65 L45,65 L40,60 L38,52 L40,45 Z'
  },
  {
    name: 'Mumbai',
    displayName: 'Mumbai',
    coordinates: { x: 50, y: 50 },
    primeLocations: [
      { name: 'Bandra', x: 48, y: 48, tier: 'premium' },
      { name: 'Andheri', x: 45, y: 45, tier: 'premium' },
      { name: 'Lower Parel', x: 50, y: 52, tier: 'premium' },
      { name: 'BKC', x: 52, y: 50, tier: 'premium' },
      { name: 'Powai', x: 55, y: 46, tier: 'high' },
      { name: 'Worli', x: 49, y: 54, tier: 'high' },
      { name: 'Juhu', x: 46, y: 46, tier: 'high' },
      { name: 'Navi Mumbai', x: 58, y: 55, tier: 'medium' },
    ],
    path: 'M48,35 L52,35 L56,40 L58,50 L56,58 L52,62 L48,60 L44,55 L42,45 L44,38 Z'
  },
  {
    name: 'Delhi',
    displayName: 'Delhi NCR',
    coordinates: { x: 50, y: 50 },
    primeLocations: [
      { name: 'Connaught Place', x: 50, y: 50, tier: 'premium' },
      { name: 'Cyber City', x: 48, y: 58, tier: 'premium' },
      { name: 'Saket', x: 52, y: 55, tier: 'premium' },
      { name: 'Rajouri Garden', x: 45, y: 48, tier: 'high' },
      { name: 'Noida', x: 58, y: 52, tier: 'high' },
      { name: 'Gurgaon', x: 46, y: 60, tier: 'high' },
      { name: 'Dwarka', x: 42, y: 52, tier: 'medium' },
    ],
    path: 'M42,42 L58,42 L62,48 L62,56 L58,62 L42,62 L38,56 L38,48 Z'
  },
  {
    name: 'Hyderabad',
    displayName: 'Hyderabad',
    coordinates: { x: 50, y: 50 },
    primeLocations: [
      { name: 'Banjara Hills', x: 48, y: 50, tier: 'premium' },
      { name: 'Jubilee Hills', x: 46, y: 48, tier: 'premium' },
      { name: 'Hitech City', x: 45, y: 52, tier: 'premium' },
      { name: 'Gachibowli', x: 43, y: 54, tier: 'high' },
      { name: 'Madhapur', x: 46, y: 52, tier: 'high' },
      { name: 'Kondapur', x: 44, y: 50, tier: 'medium' },
    ],
    path: 'M44,42 L56,42 L60,48 L60,56 L56,62 L44,62 L40,56 L40,48 Z'
  },
  {
    name: 'Pune',
    displayName: 'Pune',
    coordinates: { x: 50, y: 50 },
    primeLocations: [
      { name: 'Koregaon Park', x: 52, y: 48, tier: 'premium' },
      { name: 'Viman Nagar', x: 55, y: 50, tier: 'premium' },
      { name: 'Baner', x: 45, y: 48, tier: 'high' },
      { name: 'Hinjewadi', x: 42, y: 50, tier: 'high' },
      { name: 'Kharadi', x: 58, y: 52, tier: 'medium' },
    ],
    path: 'M45,44 L55,44 L58,50 L58,56 L55,60 L45,60 L42,54 L42,50 Z'
  },
  {
    name: 'Chennai',
    displayName: 'Chennai',
    coordinates: { x: 50, y: 50 },
    primeLocations: [
      { name: 'T Nagar', x: 48, y: 52, tier: 'premium' },
      { name: 'Anna Nagar', x: 46, y: 48, tier: 'premium' },
      { name: 'Velachery', x: 50, y: 56, tier: 'high' },
      { name: 'OMR', x: 55, y: 54, tier: 'high' },
      { name: 'Nungambakkam', x: 48, y: 50, tier: 'high' },
    ],
    path: 'M46,40 L54,40 L58,46 L58,58 L54,64 L46,64 L42,58 L42,46 Z'
  }
];

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'premium':
      return 'from-purple-500 to-pink-500';
    case 'high':
      return 'from-blue-500 to-cyan-500';
    case 'medium':
      return 'from-emerald-500 to-teal-500';
    default:
      return 'from-gray-400 to-gray-500';
  }
};

const getTierSize = (tier: string) => {
  switch (tier) {
    case 'premium':
      return 'w-3 h-3 sm:w-4 sm:h-4';
    case 'high':
      return 'w-2.5 h-2.5 sm:w-3 sm:h-3';
    case 'medium':
      return 'w-2 h-2 sm:w-2.5 sm:h-2.5';
    default:
      return 'w-2 h-2';
  }
};

export default function CityMapBackground() {
  const { scrollYProgress } = useScroll();
  const [currentCityIndex, setCurrentCityIndex] = useState(0);

  // Change city based on scroll position
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      const cityIndex = Math.min(
        Math.floor(latest * cities.length * 1.5),
        cities.length - 1
      );
      setCurrentCityIndex(cityIndex);
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  const currentCity = cities[currentCityIndex];
  const mapOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 0.15, 0.15, 0]);

  return (
    <motion.div 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: mapOpacity }}
    >
      {/* City name indicator */}
      <motion.div
        key={currentCity.name}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-24 right-8 text-right"
      >
        <div className="text-xs sm:text-sm font-medium text-purple-600/40 mb-1">Now Viewing</div>
        <div className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600/30 to-pink-600/30">
          {currentCity.displayName}
        </div>
      </motion.div>

      {/* SVG Map */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500">
              Prime Locations
            </span>
            <br />
            <span className="text-gray-900">Across India</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Strategically positioned in the most sought-after commercial hubs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
          {cities.map((city, cityIndex) => {
            // Each city appears at different scroll positions
            const cityScrollProgress = useTransform(
              scrollYProgress,
              [cityIndex * 0.1, cityIndex * 0.1 + 0.3],
              [0, 1]
            );

            return (
              <motion.div
                key={city.name}
                style={{ opacity: cityScrollProgress }}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ 
                  duration: 0.8, 
                  delay: cityIndex * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                className="relative group"
              >
                {/* Card container */}
                <div className="relative bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/40 hover:border-purple-300/50 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.3)] overflow-hidden">
                  {/* Ambient glow */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="relative z-10">
                    {/* City name */}
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
                      {city.displayName}
                    </h3>

                    {/* Map SVG container */}
                    <div className="relative w-full aspect-square mb-6">
                      <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* City outline */}
                        <motion.path
                          d={city.path}
                          fill="none"
                          stroke="url(#gradient-stroke)"
                          strokeWidth="0.5"
                          className="opacity-30"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 2, delay: cityIndex * 0.2 }}
                        />

                        {/* Gradient definition */}
                        <defs>
                          <linearGradient id="gradient-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="50%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>

                        {/* Prime locations */}
                        {city.primeLocations.map((location, locIndex) => (
                          <g key={location.name}>
                            {/* Pulsing circle */}
                            <motion.circle
                              cx={location.x}
                              cy={location.y}
                              r="2"
                              className={`fill-purple-500 opacity-20`}
                              initial={{ scale: 0 }}
                              whileInView={{ scale: [0, 2, 2.5] }}
                              viewport={{ once: true }}
                              transition={{
                                duration: 1.5,
                                delay: cityIndex * 0.2 + locIndex * 0.1,
                                repeat: Infinity,
                                repeatDelay: 2
                              }}
                            />

                            {/* Location dot */}
                            <motion.circle
                              cx={location.x}
                              cy={location.y}
                              r="1"
                              className={location.tier === 'premium' ? 'fill-purple-500' : location.tier === 'high' ? 'fill-blue-500' : 'fill-emerald-500'}
                              initial={{ scale: 0, opacity: 0 }}
                              whileInView={{ scale: 1, opacity: 1 }}
                              viewport={{ once: true }}
                              transition={{
                                duration: 0.5,
                                delay: cityIndex * 0.2 + locIndex * 0.1,
                                type: "spring",
                                stiffness: 200
                              }}
                            />

                            {/* Connecting lines to center */}
                            <motion.line
                              x1={city.coordinates.x}
                              y1={city.coordinates.y}
                              x2={location.x}
                              y2={location.y}
                              stroke={location.tier === 'premium' ? '#a855f7' : location.tier === 'high' ? '#3b82f6' : '#10b981'}
                              strokeWidth="0.2"
                              className="opacity-20"
                              initial={{ pathLength: 0 }}
                              whileInView={{ pathLength: 1 }}
                              viewport={{ once: true }}
                              transition={{
                                duration: 0.8,
                                delay: cityIndex * 0.2 + locIndex * 0.1
                              }}
                            />
                          </g>
                        ))}

                        {/* Center hub */}
                        <motion.circle
                          cx={city.coordinates.x}
                          cy={city.coordinates.y}
                          r="1.5"
                          className="fill-pink-500"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.5,
                            delay: cityIndex * 0.2,
                            type: "spring",
                            stiffness: 300
                          }}
                        />
                      </svg>
                    </div>

                    {/* Location list */}
                    <div className="space-y-2">
                      {city.primeLocations.slice(0, 4).map((location, idx) => (
                        <motion.div
                          key={location.name}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: cityIndex * 0.2 + idx * 0.1 }}
                          className="flex items-center gap-2 text-xs sm:text-sm text-gray-600"
                        >
                          <div className={`${getTierSize(location.tier)} rounded-full bg-gradient-to-br ${getTierColor(location.tier)} flex-shrink-0`}></div>
                          <span>{location.name}</span>
                          {idx === 0 && <span className="ml-auto text-[10px] px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Premium</span>}
                        </motion.div>
                      ))}
                      {city.primeLocations.length > 4 && (
                        <p className="text-xs text-gray-500 pl-5">
                          +{city.primeLocations.length - 4} more locations
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-4 sm:gap-6"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
            <span className="text-xs sm:text-sm text-gray-600">Premium Locations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"></div>
            <span className="text-xs sm:text-sm text-gray-600">High-Demand Areas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500"></div>
            <span className="text-xs sm:text-sm text-gray-600">Emerging Hubs</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
