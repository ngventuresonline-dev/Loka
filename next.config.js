/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true // Set to false in production when using image optimization
  },
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  // Environment variables that should be available on client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
  },
}

module.exports = nextConfig