# PhonePe Payment Gateway Integration

Lokazen uses PhonePe Standard Checkout API for payments. This document covers setup, testing in Sandbox, and going live.

## Flows

1. **Brand plans** — Starter (₹4,999), Professional (₹9,999), Premium (₹19,999)
2. **Location reports** — Gated reports at ₹299 per report
3. **Visit scheduling** — Visit fee at ₹499

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PHONEPE_CLIENT_ID` | Yes | From PhonePe Business Dashboard |
| `PHONEPE_CLIENT_VERSION` | Yes | e.g. `1.0` |
| `PHONEPE_CLIENT_SECRET` | Yes | Never expose to client |
| `PHONEPE_SANDBOX` | Yes | `true` for dev, `false` for production |
| `PHONEPE_REDIRECT_BASE_URL` | No | Defaults to `VERCEL_URL` or `NEXTAUTH_URL` |
| `PHONEPE_WEBHOOK_USERNAME` | Yes (for webhook) | 5–20 chars, letters/digits/underscores |
| `PHONEPE_WEBHOOK_PASSWORD` | Yes (for webhook) | 8–20 chars, letters + numbers |
| `PHONEPE_GUEST_USER_ID` | For reports | UUID for guest/unanonymous report purchases |
| `NEXT_PUBLIC_PHONEPE_SANDBOX` | Yes | Same as `PHONEPE_SANDBOX` (client-side checkout script) |

## Sandbox Testing

1. Set `PHONEPE_SANDBOX=true` and `NEXT_PUBLIC_PHONEPE_SANDBOX=true`
2. Use Sandbox credentials from PhonePe dashboard (Developer Settings → Sandbox)
3. Auth: `https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token`
4. Create Payment: `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay`
5. Webhook URL: `https://your-domain.com/api/webhooks/phonepe`

### Webhook Setup (Sandbox)

- In PhonePe Sandbox dashboard: configure webhook with URL and credentials
- Events: `checkout.order.completed`, `checkout.order.failed`
- Auth: SHA256(username:password) in `Authorization` header

## Going Live

1. Switch to Production credentials
2. Set `PHONEPE_SANDBOX=false` and `NEXT_PUBLIC_PHONEPE_SANDBOX=false`
3. Set `PHONEPE_REDIRECT_BASE_URL=https://lokazen.in`
4. Update webhook URL in PhonePe Production dashboard
5. Run DB migration: `npx prisma migrate dev` (if not done)

## API Endpoints

- `POST /api/payments/phonepe/create` — Create payment, returns `redirectUrl` for iframe
- `GET /api/payments/phonepe/status?merchantOrderId=X` — Poll order status
- `POST /api/webhooks/phonepe` — Webhook handler (verifies SHA256 auth)

## Frontend

- `PhonePeCheckout` — Modal that invokes `PhonePeCheckout.transact({ tokenUrl, callback, type: 'IFRAME' })`
- `/payment/result` — Success/failure page; supports `state`, `merchantOrderId` query params

## References

- [PhonePe PG Integration Steps](https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/integration-steps)
- [Postman Workspace](https://www.postman.com/phonepe-pg-integrations-online/phonepe-pg-phonepe-standard-checkout-online/overview)
