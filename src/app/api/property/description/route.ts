import { NextRequest, NextResponse } from 'next/server'
import { generateText, isGoogleAIConfigured } from '@/lib/google-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyType, location, size, rent, features, availability } = body

    if (!isGoogleAIConfigured()) {
      return NextResponse.json({
        description: generateFallbackDescription(propertyType, location, size, rent, features, availability),
      })
    }

    const systemPrompt = `You are a professional property listing writer for Loka, India's commercial real estate platform.
Generate compelling, accurate property descriptions for commercial real estate listings in India.

Your descriptions should:
- Be professional yet engaging
- Highlight key features and benefits
- Mention location advantages (Bangalore areas, connectivity, footfall potential)
- Include size, rent (₹), and amenities
- Be 150-200 words
- Use Indian English conventions
- Focus on what makes the property attractive to businesses

Write in a clear, professional tone that would appeal to business owners looking for commercial space.`

    const propertyTypeWithSpace = propertyType
      ? propertyType.toLowerCase().endsWith('space')
        ? propertyType
        : `${propertyType} space`
      : 'Commercial space'

    const userPrompt = `Generate a property description for:
- Property Type: ${propertyTypeWithSpace}
- Location: ${location || 'Bangalore'}
- Size: ${size || 'N/A'}
- Monthly Rent: ${rent || 'N/A'}
- Features: ${features ? (Array.isArray(features) ? features.join(', ') : features) : 'Standard amenities'}
- Availability: ${availability || 'Immediate'}

Create an engaging property listing description that highlights the key selling points. Always refer to the property as "${propertyTypeWithSpace}".`

    try {
      const description = await generateText(userPrompt, {
        systemInstruction: systemPrompt,
        maxTokens: 400,
        temperature: 0.7,
      })

      if (description) {
        return NextResponse.json({ description: description.trim() })
      }
    } catch (aiError: unknown) {
      console.error('AI description generation error:', aiError)
    }

    return NextResponse.json({
      description: generateFallbackDescription(propertyType, location, size, rent, features, availability),
    })
  } catch (error: any) {
    console.error('Property description generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate description' },
      { status: 500 }
    )
  }
}

function generateFallbackDescription(
  propertyType: string,
  location: string,
  size: string | number,
  rent: string | number,
  features: string | string[],
  availability: string
): string {
  // Ensure property type has "space" suffix
  const propertyTypeWithSpace = propertyType 
    ? (propertyType.toLowerCase().endsWith('space') ? propertyType : `${propertyType} space`)
    : 'commercial space'
  
  const sizeStr = typeof size === 'number' ? `${size.toLocaleString()} sq ft` : size
  const rentStr = typeof rent === 'number' ? `₹${rent.toLocaleString()}` : rent
  const featuresStr = Array.isArray(features) ? features.join(', ') : features

  return `Prime ${propertyTypeWithSpace} available in ${location || 'Bangalore'}. 

This ${sizeStr || 'spacious'} property offers excellent visibility and accessibility, making it ideal for ${propertyType?.toLowerCase().includes('retail') ? 'retail businesses' : propertyType?.toLowerCase().includes('restaurant') ? 'restaurants and cafes' : 'various commercial ventures'}.

Key highlights:
- Prime location in ${location || 'a well-connected area'}
- ${sizeStr || 'Spacious'} of space
- Monthly rent: ${rentStr || 'Competitive pricing'}
- ${featuresStr ? `Features include: ${featuresStr}` : 'Well-equipped with modern amenities'}
- ${availability === 'Immediate' ? 'Available immediately' : `Available from ${availability}`}

Perfect for businesses looking for a strategic location with high footfall and excellent connectivity. Contact us for more details and to schedule a viewing.`
}

