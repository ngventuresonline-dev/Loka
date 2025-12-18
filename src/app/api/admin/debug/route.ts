/**
 * DIAGNOSTIC ENDPOINT: Test database connection and property count
 * Access: GET /api/admin/debug
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  }

  // Check 1: Prisma client availability
  try {
    const prisma = await getPrisma()
    if (!prisma) {
      diagnostics.checks.prisma = {
        status: 'FAILED',
        error: 'Prisma client is null'
      }
      return NextResponse.json(diagnostics, { status: 500 })
    }
    diagnostics.checks.prisma = { status: 'OK' }
  } catch (error: any) {
    diagnostics.checks.prisma = {
      status: 'FAILED',
      error: error.message
    }
    return NextResponse.json(diagnostics, { status: 500 })
  }

  const prisma = await getPrisma()
  if (!prisma) {
    diagnostics.checks.databaseConnection = {
      status: 'FAILED',
      error: 'Prisma client is null'
    }
    return NextResponse.json(diagnostics, { status: 500 })
  }

  // Check 2: Database connection (test with a simple query instead of explicit $connect)
  try {
    // Don't call $connect() - test connection with a simple query instead
    await prisma.$queryRaw`SELECT 1`
    diagnostics.checks.databaseConnection = { status: 'OK' }
  } catch (error: any) {
    diagnostics.checks.databaseConnection = {
      status: 'FAILED',
      error: error.message
    }
    return NextResponse.json(diagnostics, { status: 500 })
  }

  // Check 3: Property count
  try {
    const count = await prisma.property.count()
    diagnostics.checks.propertyCount = {
      status: 'OK',
      count
    }
  } catch (error: any) {
    diagnostics.checks.propertyCount = {
      status: 'FAILED',
      error: error.message
    }
  }

  // Check 4: Fetch first 5 properties
  try {
    const properties = await prisma.property.findMany({
      take: 5,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })
    diagnostics.checks.sampleProperties = {
      status: 'OK',
      count: properties.length,
      properties: properties.map(p => ({
        id: p.id,
        title: p.title,
        city: p.city,
        availability: p.availability,
        owner: p.owner ? {
          name: p.owner.name,
          email: p.owner.email
        } : null
      }))
    }
  } catch (error: any) {
    diagnostics.checks.sampleProperties = {
      status: 'FAILED',
      error: error.message
    }
  }

  // Check 5: Test the exact query used by admin API
  try {
    const allProperties = await prisma.property.findMany({
      where: {},
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })
    diagnostics.checks.adminQuery = {
      status: 'OK',
      count: allProperties.length,
      firstProperty: allProperties[0] ? {
        id: allProperties[0].id,
        title: allProperties[0].title,
        hasOwner: !!allProperties[0].owner
      } : null
    }
  } catch (error: any) {
    diagnostics.checks.adminQuery = {
      status: 'FAILED',
      error: error.message
    }
  }

  // Summary
  const allChecksPassed = Object.values(diagnostics.checks).every((check: any) => check.status === 'OK')
  diagnostics.summary = {
    allChecksPassed,
    totalChecks: Object.keys(diagnostics.checks).length,
    passedChecks: Object.values(diagnostics.checks).filter((check: any) => check.status === 'OK').length
  }

  return NextResponse.json(diagnostics, { 
    status: allChecksPassed ? 200 : 500 
  })
}

