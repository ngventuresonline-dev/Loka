import { NextResponse } from 'next/server'
import { checkSystemHealth } from '@/lib/load-scaling'

/**
 * Health check endpoint for monitoring and load balancing
 * Returns system health status
 */
export async function GET() {
  try {
    const health = await checkSystemHealth()

    const statusCode = health.healthy ? 200 : 503

    return NextResponse.json(
      {
        status: health.healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: health.database ? 'ok' : 'failed',
          memory: {
            heapUsed: `${Math.round(health.memory.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(health.memory.heapTotal / 1024 / 1024)}MB`,
            external: `${Math.round(health.memory.external / 1024 / 1024)}MB`,
            rss: `${Math.round(health.memory.rss / 1024 / 1024)}MB`,
          },
          uptime: `${Math.round(health.uptime)}s`,
        },
      },
      {
        status: statusCode,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

