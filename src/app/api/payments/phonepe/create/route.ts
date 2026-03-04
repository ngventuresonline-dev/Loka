/**
 * POST /api/payments/phonepe/create
 * Creates a PhonePe checkout session. Returns redirectUrl for iframe PayPage.
 * Body: { flow, referenceId, userId?, amountInr, meta? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/get-prisma'
import { createPayment, type PaymentFlow } from '@/lib/phonepe'

const VALID_FLOWS: PaymentFlow[] = ['brand', 'report', 'visit']

const FLOW_AMOUNTS: Record<string, number> = {
  starter: 4999,
  professional: 9999,
  premium: 19999,
  report: 4999,   // Location intelligence detailed reports start at ₹4,999
  visit: 499,     // Visit scheduling fee
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flow, referenceId, userId, amountInr: rawAmount, meta } = body

    if (!flow || !referenceId) {
      return NextResponse.json(
        { success: false, error: 'flow and referenceId are required' },
        { status: 400 }
      )
    }

    if (!VALID_FLOWS.includes(flow)) {
      return NextResponse.json(
        { success: false, error: 'Invalid flow. Use: brand, report, visit' },
        { status: 400 }
      )
    }

    let amountInr: number

    if (flow === 'brand') {
      const plan = (referenceId as string).toLowerCase()
      amountInr = FLOW_AMOUNTS[plan] ?? FLOW_AMOUNTS.starter
    } else if (typeof rawAmount === 'number' && rawAmount >= 1) {
      amountInr = rawAmount
    } else if (flow === 'report') {
      amountInr = FLOW_AMOUNTS.report
    } else if (flow === 'visit') {
      amountInr = FLOW_AMOUNTS.visit
    } else {
      return NextResponse.json(
        { success: false, error: 'amountInr is required for report/visit flows' },
        { status: 400 }
      )
    }

    const result = await createPayment({
      flow,
      referenceId: String(referenceId),
      userId: userId ? String(userId) : undefined,
      amountInr,
      meta: meta && typeof meta === 'object' ? meta : undefined,
    })

    const prisma = await getPrisma()
    if (prisma) {
      try {
        const amountPaisa = Math.round(amountInr * 100)
        await prisma.payment.upsert({
          where: { merchant_order_id: result.merchantOrderId },
          create: {
            merchant_order_id: result.merchantOrderId,
            flow,
            reference_id: referenceId,
            user_id: userId || null,
            amount_paise: amountPaisa,
            amount_inr: amountInr,
            status: 'pending',
            phonepe_order_id: result.orderId || null,
            meta_json: meta || {},
          },
          update: {},
        })
      } catch (dbErr) {
        console.warn('[PhonePe create] DB upsert failed (payment still created):', dbErr)
      }
    }

    return NextResponse.json({
      success: true,
      merchantOrderId: result.merchantOrderId,
      redirectUrl: result.redirectUrl,
      orderId: result.orderId,
      state: result.state,
      expireAt: result.expireAt,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('[PhonePe create]', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}
