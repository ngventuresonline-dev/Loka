/**
 * POST /api/webhooks/phonepe
 * PhonePe webhook for payment status updates.
 * Events: checkout.order.completed, checkout.order.failed, pg.refund.completed, pg.refund.failed
 * Authorization: SHA256(username:password) - verify before processing
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { verifyWebhookAuth } from '@/lib/phonepe'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!verifyWebhookAuth(authHeader)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const event = body.event as string
    const payload = body.payload as Record<string, unknown> | undefined

    if (!payload) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      console.error('[PhonePe webhook] Prisma not available')
      return NextResponse.json({ received: true }, { status: 200 })
    }

    if (event === 'checkout.order.completed' || event === 'checkout.order.failed') {
      const merchantOrderId = payload.merchantOrderId as string
      const state = payload.state as string
      const amount = (payload.amount as number) || 0
      const paymentDetails = payload.paymentDetails as Array<{ transactionId?: string; state?: string }> | undefined
      const transactionId = paymentDetails?.[0]?.transactionId

      // Idempotency: update only if current status is pending
      const existing = await prisma.payment.findUnique({
        where: { merchant_order_id: merchantOrderId },
      })

      if (existing && existing.status === 'pending') {
        await prisma.payment.update({
          where: { merchant_order_id: merchantOrderId },
          data: {
            status: state === 'COMPLETED' ? 'completed' : 'failed',
            phonepe_order_id: payload.orderId as string,
            phonepe_transaction_id: transactionId || null,
            meta_json: (payload.metaInfo as object) || existing.meta_json,
          },
        })
      }

      const metaInfo = payload.metaInfo as Record<string, string> | undefined
      const flow = metaInfo?.udf1
      const referenceId = metaInfo?.udf2
      const userId = metaInfo?.udf3

      if (state === 'COMPLETED' && flow === 'report' && referenceId) {
        const reportId = referenceId
        const report = await prisma.location_reports.findUnique({
          where: { id: reportId },
        })
        if (report && report.status === 'pending') {
          await prisma.location_reports.update({
            where: { id: reportId },
            data: {
              payment_id: merchantOrderId,
              amount: amount / 100,
              status: 'completed',
              is_free: false,
            },
          })
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: unknown) {
    const err = error as Error
    console.error('[PhonePe webhook]', err)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
