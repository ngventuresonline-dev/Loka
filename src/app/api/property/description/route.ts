import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyType, location, size, rent, features, availability } = body

    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback to template-based description if AI is not available
      return NextResponse.json({
        description: generateFallbackDescription(propertyType, location, size, rent, features, availability)
      })
    }

    const systemPrompt = `You are a professional property listing writer. Generate compelling, accurate property descriptions for commercial real estate listings in India. 
    
Your descriptions should:
- Be professional yet engaging
- Highlight key features and benefits
- Mention location advantages
- Include size, rent, and amenities
- Be 150-200 words
- Use Indian English conventions
- Focus on what makes the property attractive to businesses

Write in a clear, professional tone that would appeal to business owners looking for commercial space.`

    // Ensure property type has "space" suffix
    const propertyTypeWithSpace = propertyType 
      ? (propertyType.toLowerCase().endsWith('space') ? propertyType : `${propertyType} space`)
      : 'Commercial space'
    
    const userPrompt = `Generate a property description for:
- Property Type: ${propertyTypeWithSpace}
- Location: ${location || 'Bangalore'}
- Size: ${size || 'N/A'}
- Monthly Rent: ${rent || 'N/A'}
- Features: ${features ? (Array.isArray(features) ? features.join(', ') : features) : 'Standard amenities'}
- Availability: ${availability || 'Immediate'}

Create an engaging property listing description that highlights the key selling points. Always refer to the property as "${propertyTypeWithSpace}" (with "space" after the property type).`

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.7,
      })

      const response = message.content?.[0]
      if (response && response.type === 'text') {
        return NextResponse.json({
          description: response.text.trim()
        })
      }
    } catch (aiError: any) {
      console.error('AI description generation error:', aiError)
      // Fallback to template
    }

    // Fallback to template-based description
    return NextResponse.json({
      description: generateFallbackDescription(propertyType, location, size, rent, features, availability)
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

