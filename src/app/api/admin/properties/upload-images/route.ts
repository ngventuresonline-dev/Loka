import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { getAdminClient } from '@/lib/supabase/server'

const BUCKET = 'property-images'

function buildFilePath(propertyId: string, index: number, filename: string): string {
  const ext = filename.includes('.') ? filename.split('.').pop() : 'jpg'
  return `${propertyId}/${Date.now()}-${index}.${ext}`
}

export async function POST(request: NextRequest) {
  try {
    await requireUserType(request, ['admin'])

    const formData = await request.formData()
    const propertyId = String(formData.get('propertyId') || '').trim()
    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 })
    }

    const fileEntries = formData
      .getAll('files')
      .filter((entry): entry is File => entry instanceof File)

    if (fileEntries.length === 0) {
      return NextResponse.json({ error: 'No files found in request' }, { status: 400 })
    }

    const supabase = getAdminClient()
    const urls: string[] = []

    for (let i = 0; i < fileEntries.length; i++) {
      const file = fileEntries[i]
      const path = buildFilePath(propertyId, i, file.name || `image-${i}.jpg`)

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg',
        })

      if (uploadError) {
        return NextResponse.json(
          { error: `Upload failed: ${uploadError.message}` },
          { status: 500 }
        )
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      urls.push(pub.publicUrl)
    }

    return NextResponse.json({ success: true, urls })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to upload images' },
      { status: 500 }
    )
  }
}

