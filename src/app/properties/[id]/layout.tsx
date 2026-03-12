import type { Metadata } from 'next'
import { getPrisma } from '@/lib/get-prisma'
import { decodePropertySlug } from '@/lib/property-slug'

const SITE_URL = 'https://lokazen.in'

function getValidOgImage(images: unknown, baseUrl: string): string {
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0]
    if (typeof first === 'string' && first.trim()) {
      const src = first.trim()
      // Skip placeholders and invalid URLs
      if (
        !src.startsWith('/images/') &&
        !src.includes('localhost') &&
        !src.includes('unsplash')
      ) {
        return src.startsWith('http') ? src : `${baseUrl}${src.startsWith('/') ? '' : '/'}${src}`
      }
    }
  }
  return `${baseUrl}/lokazen-social.png`
}

function formatPrice(price: number, priceType: string, size: number): string {
  if (priceType === 'sqft') {
    const monthly = size * price
    return `₹${(monthly / 100000).toFixed(1)}L/month (₹${price}/sqft)`
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(1)}L/month`
  }
  return `₹${price.toLocaleString('en-IN')}/month`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id: slug } = await params
  const propertyId = decodePropertySlug(slug)

  const prisma = await getPrisma()
  if (!prisma) {
    return {
      title: 'Property | Lokazen',
      openGraph: {
        title: 'Property | Lokazen',
        images: [`${SITE_URL}/lokazen-social.png`],
      },
    }
  }

  let property: {
    title: string
    description: string | null
    address: string
    city: string
    size: number
    price: unknown
    priceType: string
    images: unknown
    amenities: unknown
  } | null = null

  try {
    property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        title: true,
        description: true,
        address: true,
        city: true,
        size: true,
        price: true,
        priceType: true,
        images: true,
        amenities: true,
      },
    })
  } catch {
    // Fallback on DB error
  }

  if (!property) {
    return {
      title: 'Property | Lokazen',
      openGraph: {
        title: 'Property | Lokazen',
        images: [`${SITE_URL}/lokazen-social.png`],
      },
    }
  }

  const price = typeof property.price === 'object' && property.price !== null && 'toNumber' in property.price
    ? (property.price as { toNumber: () => number }).toNumber()
    : Number(property.price) || 0
  const priceStr = formatPrice(price, property.priceType, property.size)
  const location = `${property.address}, ${property.city}`
  const shortDesc = `${property.size} sqft • ${priceStr} • ${location}`

  const ogImage = getValidOgImage(property.images, SITE_URL)
  const ogTitle = `${property.title} | Lokazen`
  const ogDescription = property.description
    ? `${property.description.slice(0, 150)}${property.description.length > 150 ? '…' : ''}`
    : shortDesc

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: property.title,
          type: 'image/png',
        },
      ],
      siteName: 'Lokazen',
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  }
}

export default function PropertyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
