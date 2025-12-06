/**
 * Supabase Storage Utilities
 * For handling file uploads (property images, documents, etc.)
 */

import { supabase } from './client'

const STORAGE_BUCKETS = {
  PROPERTY_IMAGES: 'property-images',
  USER_AVATARS: 'user-avatars',
  DOCUMENTS: 'documents',
} as const

/**
 * Upload property image
 */
export async function uploadPropertyImage(
  file: File,
  propertyId: string,
  imageIndex: number = 0
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${propertyId}/${imageIndex}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.PROPERTY_IMAGES)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(STORAGE_BUCKETS.PROPERTY_IMAGES)
      .getPublicUrl(filePath)

    return { success: true, url: publicUrl }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to upload image' }
  }
}

/**
 * Upload multiple property images
 */
export async function uploadPropertyImages(
  files: File[],
  propertyId: string
): Promise<{ success: boolean; urls?: string[]; errors?: string[] }> {
  const results = await Promise.all(
    files.map((file, index) => uploadPropertyImage(file, propertyId, index))
  )

  const urls: string[] = []
  const errors: string[] = []

  results.forEach((result, index) => {
    if (result.success && result.url) {
      urls.push(result.url)
    } else {
      errors.push(`Image ${index + 1}: ${result.error || 'Upload failed'}`)
    }
  })

  return {
    success: errors.length === 0,
    urls: urls.length > 0 ? urls : undefined,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Delete property image
 */
export async function deletePropertyImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const propertyId = urlParts[urlParts.length - 2]
    const filePath = `${propertyId}/${fileName}`

    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.PROPERTY_IMAGES)
      .remove([filePath])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete image' }
  }
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.USER_AVATARS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Replace if exists
      })

    if (error) {
      return { success: false, error: error.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(STORAGE_BUCKETS.USER_AVATARS)
      .getPublicUrl(filePath)

    return { success: true, url: publicUrl }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to upload avatar' }
  }
}

/**
 * Get storage bucket URL
 */
export function getStorageBucket(bucket: keyof typeof STORAGE_BUCKETS): string {
  return STORAGE_BUCKETS[bucket]
}

/**
 * Create storage bucket (admin only - run once)
 */
export async function createStorageBuckets(): Promise<void> {
  // This should be run as a one-time setup script
  // In production, create buckets via Supabase dashboard or CLI
  console.log('Storage buckets to create:', Object.values(STORAGE_BUCKETS))
  console.log('Create these buckets in Supabase Dashboard > Storage')
}


