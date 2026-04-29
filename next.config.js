const path = require('path')
const fs = require('fs')

// Only override the file-tracing root when running from a git worktree
// (where node_modules lives three levels up at C:\Loka). On Vercel and any
// standalone clone, node_modules is installed locally — the default
// auto-detection works correctly there. Always overriding caused Vercel to
// resolve the tracing root to '/' and produce paths like
// '/vercel/path0/vercel/path0/.next/routes-manifest.json'.
const isLocalWorktree = !fs.existsSync(path.join(__dirname, 'node_modules'))
const worktreeRoot = path.join(__dirname, '..', '..', '..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isLocalWorktree ? { outputFileTracingRoot: worktreeRoot } : {}),
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Environment variables that should be available on client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
    TZ: 'Asia/Kolkata',
  },
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'framer-motion', 'recharts', '@react-google-maps/api',
      'lucide-react', 'date-fns', '@anthropic-ai/sdk'
    ],
  },
  // Turbopack configuration (Next.js 16+) — must match outputFileTracingRoot.
  // Same conditional: only override in the local worktree.
  ...(isLocalWorktree ? { turbopack: { root: worktreeRoot } } : {}),
  // Webpack optimizations for bundle splitting (when using --webpack flag)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module) {
                return module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.identifier())
              },
              name(module) {
                const hash = require('crypto').createHash('sha1')
                hash.update(module.identifier())
                return hash.digest('hex').substring(0, 8)
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name(module, chunks) {
                return require('crypto')
                  .createHash('sha1')
                  .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                  .digest('hex')
                  .substring(0, 8)
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
          maxInitialRequests: 25,
          minSize: 20000,
        },
      }
    }
    return config
  },
  // Clean URL rewrites for static landing pages
  async rewrites() {
    return [
      {
             source: '/natura-walk',
             destination: '/natura-walk.html',
           },
           {
             source: '/palace-road',
             destination: '/palace-road.html',
           },
    ]
  },

  // Security headers (additional ones in middleware)
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: [
              '</api/properties?limit=20>; rel=prefetch',
              '</api/brands>; rel=prefetch',
            ].join(', ')
          }
        ]
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Download-Options',
            value: 'noopen'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig