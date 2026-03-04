/**
 * GET /api/payments/phonepe/status?merchantOrderId=...
 * Returns order status from PhonePe
 */
import { NextRequest, NextResponse } from 'next/server'
import { getOrderStatus } from '@/lib/phonepe'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantOrderId = searchParams.get('merchantOrderId')

    if (!merchantOrderId) {
      return NextResponse.json(
        { success: false, error: 'merchantOrderId is required' },
        { status: 400 }
      )
    }

    const status = await getOrderStatus(merchantOrderId)

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: status.orderId,
      merchantOrderId: status.merchantOrderId,
      state: status.state,
      amount: status.amount,
      paymentDetails: status.paymentDetails,
      metaInfo: status.metaInfo,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('[PhonePe status]', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
