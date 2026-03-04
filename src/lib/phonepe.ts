/**
 * PhonePe Payment Gateway - Standard Checkout API
 * Sandbox: https://api-preprod.phonepe.com/apis/pg-sandbox/
 * Production: Auth at https://api.phonepe.com/apis/identity-manager/, APIs at https://api.phonepe.com/apis/pg/
 */

const isSandbox = process.env.PHONEPE_SANDBOX === 'true' // false = production (live)

const BASE_URL_SANDBOX = 'https://api-preprod.phonepe.com/apis/pg-sandbox'
const BASE_URL_PROD = 'https://api.phonepe.com/apis/pg'
const AUTH_URL_SANDBOX = 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token'
const AUTH_URL_PROD = 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'

const getBaseUrl = () => (isSandbox ? BASE_URL_SANDBOX : BASE_URL_PROD)
const getAuthUrl = () => (isSandbox ? AUTH_URL_SANDBOX : AUTH_URL_PROD)

export type PaymentFlow = 'brand' | 'report' | 'visit'

export interface CreatePaymentParams {
  flow: PaymentFlow
  referenceId: string
  userId?: string
  amountInr: number
  meta?: Record<string, string>
}

export interface CreatePaymentResult {
  merchantOrderId: string
  redirectUrl: string
  orderId?: string
  state?: string
  expireAt?: number
}

export interface OrderStatusResult {
  orderId: string
  merchantOrderId: string
  state: 'PENDING' | 'COMPLETED' | 'FAILED'
  amount?: number
  paymentDetails?: Array<{
    transactionId: string
    paymentMode: string
    amount: number
    state: string
  }>
  metaInfo?: Record<string, string>
}

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PHONEPE_CLIENT_ID
  const clientVersionRaw = process.env.PHONEPE_CLIENT_VERSION
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET

  if (!clientId || !clientVersionRaw || !clientSecret) {
    throw new Error('PhonePe credentials not configured (PHONEPE_CLIENT_ID, PHONEPE_CLIENT_VERSION, PHONEPE_CLIENT_SECRET)')
  }

  // PhonePe requires client_version as integer (e.g. "1" not "1.0")
  const clientVersion = String(parseInt(clientVersionRaw, 10) || 1)

  if (cachedToken && Date.now() / 1000 < tokenExpiresAt - 60) {
    return cachedToken
  }

  const authUrl = getAuthUrl()
  const params = new URLSearchParams({
    client_id: clientId,
    client_version: clientVersion,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  })

  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    const masked = clientId ? `${clientId.slice(0, 6)}...${clientId.slice(-4)}` : 'MISSING'
    const secretMasked = clientSecret ? `${clientSecret.slice(0, 4)}...${clientSecret.slice(-4)}` : 'MISSING'
    throw new Error(`PhonePe auth failed: ${res.status} ${text} [id=${masked}, ver=${clientVersion}, secret=${secretMasked}, sandbox=${isSandbox}, url=${authUrl}]`)
  }

  const json = await res.json()
  cachedToken = json.access_token
  tokenExpiresAt = json.expires_at || (Date.now() / 1000 + 3600)
  return cachedToken!
}

export function generateMerchantOrderId(flow: PaymentFlow, referenceId: string): string {
  const ts = Date.now().toString(36)
  const safeRef = referenceId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 36)
  return `${flow}_${safeRef}_${ts}`
}

export async function createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  const token = await getAccessToken()
  const baseUrl = getBaseUrl()

  const redirectBase =
    process.env.PHONEPE_REDIRECT_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL || 'http://localhost:3000')
  const redirectUrl = `${redirectBase}/payment/result`

  const merchantOrderId = generateMerchantOrderId(params.flow, params.referenceId)
  const amountPaisa = Math.round(params.amountInr * 100)

  if (amountPaisa < 100) {
    throw new Error('Minimum amount is ₹1')
  }

  const body: Record<string, unknown> = {
    merchantOrderId,
    amount: amountPaisa,
    expireAfter: 1200,
    paymentFlow: {
      type: 'PG_CHECKOUT',
      message: `Payment for ${params.flow}`,
      merchantUrls: { redirectUrl },
    },
  }

  const metaInfo: Record<string, string> = {
    udf1: params.flow,
    udf2: params.referenceId,
  }
  if (params.userId) metaInfo.udf3 = params.userId
  if (params.meta) {
    Object.entries(params.meta).forEach(([k, v], i) => {
      const key = `udf${Math.min(i + 4, 15)}`
      metaInfo[key] = String(v).slice(0, 256)
    })
  }
  body.metaInfo = metaInfo

  const res = await fetch(`${baseUrl}/checkout/v2/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `O-Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(json.message || `PhonePe create payment failed: ${res.status}`)
  }

  if (!json.redirectUrl) {
    throw new Error('PhonePe did not return redirectUrl')
  }

  return {
    merchantOrderId,
    redirectUrl: json.redirectUrl,
    orderId: json.orderId,
    state: json.state,
    expireAt: json.expireAt,
  }
}

export async function getOrderStatus(merchantOrderId: string): Promise<OrderStatusResult | null> {
  const token = await getAccessToken()
  const baseUrl = getBaseUrl()

  const res = await fetch(
    `${baseUrl}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false&errorContext=true`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `O-Bearer ${token}`,
      },
    }
  )

  const json = await res.json().catch(() => ({}))

  if (res.status === 404 || json.code === 'INVALID_MERCHANT_ORDER_ID') {
    return null
  }

  if (!res.ok) {
    throw new Error(json.message || `PhonePe status failed: ${res.status}`)
  }

  return {
    orderId: json.orderId,
    merchantOrderId: json.merchantOrderId || merchantOrderId,
    state: json.state || 'PENDING',
    amount: json.amount,
    paymentDetails: json.paymentDetails,
    metaInfo: json.metaInfo,
  }
}

/**
 * Verify webhook Authorization header: SHA256(username:password)
 * PhonePe sends: Authorization: SHA256 <hex-hash-of-username:password>
 */
export function verifyWebhookAuth(authHeader: string | null): boolean {
  const user = process.env.PHONEPE_WEBHOOK_USERNAME
  const pass = process.env.PHONEPE_WEBHOOK_PASSWORD

  if (!user || !pass) return false
  if (!authHeader || !authHeader.toLowerCase().startsWith('sha256 ')) return false

  const { createHash, timingSafeEqual } = require('crypto')
  const expected = createHash('sha256').update(`${user}:${pass}`).digest('hex')
  const provided = authHeader.slice(7).trim().toLowerCase()

  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'))
  } catch {
    return false
  }
}
