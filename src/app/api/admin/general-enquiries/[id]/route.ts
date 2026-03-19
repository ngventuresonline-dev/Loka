import { NextRequest, NextResponse } from 'next/server'
import { requireUserType } from '@/lib/api-auth'
import { updateGeneralEnquiryStatus } from '@/lib/general-enquiry-db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserType(request, ['admin'])

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const ok = await updateGeneralEnquiryStatus(id, status)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    console.error('[admin/general-enquiries PATCH]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
