# Pabbly Webhook Troubleshooting Guide

If form submissions are not appearing in Pabbly, follow these steps to diagnose and fix the issue.

## Quick Test

1. **Test the webhook endpoint directly:**
   ```bash
   # Using curl
   curl -X GET http://localhost:3000/api/webhook/test-pabbly
   
   # Or visit in browser
   http://localhost:3000/api/webhook/test-pabbly
   ```

2. **Check server logs** for webhook activity:
   - Look for `[Pabbly Webhook]` prefixed logs
   - Check for errors or warnings

## Common Issues & Solutions

### Issue 1: Webhook URL Not Configured

**Symptoms:**
- No webhook logs in server console
- Error: "Webhook URL not configured"

**Solution:**
1. Verify the webhook URL in `.env` file:
   ```env
   PABBLY_WEBHOOK_URL=https://connect.pabbly.com/workflow/sendwebhookdata/YOUR_WEBHOOK_ID
   ```
2. Or check the default URL in `src/lib/pabbly-webhook.ts`

### Issue 2: Webhook URL Expired or Invalid

**Symptoms:**
- HTTP 404 or 400 errors in logs
- "Failed to send webhook" errors

**Solution:**
1. Log into Pabbly Connect
2. Go to your workflow
3. Click on the Webhook trigger step
4. Copy the **current** webhook URL
5. Update `PABBLY_WEBHOOK_URL` in `.env` or `src/lib/pabbly-webhook.ts`

### Issue 3: Webhook Not Triggering in Pabbly

**Symptoms:**
- Webhook sends successfully (200 OK)
- But no data appears in Pabbly

**Solution:**
1. **Check Pabbly Workflow Status:**
   - Ensure workflow is **Active** (not paused)
   - Check if workflow has any errors

2. **Verify Webhook Trigger Configuration:**
   - In Pabbly, go to your workflow
   - Click on the Webhook trigger
   - Ensure it's set to receive POST requests
   - Check if there are any filters or conditions blocking data

3. **Test with Sample Data:**
   - Use the test endpoint: `GET /api/webhook/test-pabbly`
   - Check Pabbly execution logs to see if data was received

### Issue 4: Data Format Mismatch

**Symptoms:**
- Webhook sends successfully
- Data appears in Pabbly but fields are empty or incorrect

**Solution:**
1. **Check Payload Structure:**
   - All webhooks include: `formType`, `timestamp`, `source`
   - Additional fields vary by form type
   - See `PABBLY_FORM_TYPES.md` for field details

2. **Map Fields in Pabbly:**
   - In Pabbly workflow, after the webhook trigger
   - Use the "Data Mapper" to map incoming fields
   - Fields are available as: `{{webhook.formType}}`, `{{webhook.name}}`, etc.

### Issue 5: Network/Timeout Issues

**Symptoms:**
- Timeout errors in logs
- "Request timeout" messages

**Solution:**
1. Check network connectivity
2. Verify firewall settings
3. Increase timeout if needed (currently 10 seconds)

### Issue 6: Webhook Called But Not Logged

**Symptoms:**
- Forms submit successfully
- But no webhook logs appear

**Solution:**
1. **Verify webhook is being called:**
   - Check API route files for webhook function calls
   - Ensure `.catch()` handlers are present (they prevent errors but still log)

2. **Check if webhook is awaited:**
   ```typescript
   // ✅ Correct - logs errors
   sendWebhook(data).catch(err => console.warn('Failed:', err))
   
   // ❌ Wrong - might fail silently
   sendWebhook(data)
   ```

## Debugging Steps

### Step 1: Enable Detailed Logging

The webhook implementation already includes detailed logging. Check your server console for:

```
[Pabbly Webhook] 📤 Attempting to send webhook: {...}
[Pabbly Webhook] 📥 Response received: {...}
[Pabbly Webhook] ✅ Successfully sent webhook: {...}
```

### Step 2: Test Individual Form Types

Use the test endpoint with POST request:

```bash
curl -X POST http://localhost:3000/api/webhook/test-pabbly \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "brand_lead_creation",
    "data": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+91-9876543210"
    }
  }'
```

### Step 3: Check Pabbly Execution Logs

1. Log into Pabbly Connect
2. Go to **Executions** tab
3. Look for recent executions
4. Check if data was received
5. Review any error messages

### Step 4: Verify Webhook URL Format

The webhook URL should look like:
```
https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjcwNTZjMDYzNjA0MzI1MjZlNTUzMDUxMzAi_pc
```

**Important:** 
- URL must be from Pabbly Connect (not Pabbly Flow)
- URL should be the **Send Webhook Data** URL, not the trigger URL
- Each workflow has a unique webhook URL

### Step 5: Test Webhook URL Directly

Test the webhook URL with curl:

```bash
curl -X POST "https://connect.pabbly.com/workflow/sendwebhookdata/YOUR_WEBHOOK_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "test",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "source": "lokazen_platform",
    "name": "Test User",
    "email": "test@example.com"
  }'
```

If this works, check Pabbly to see if the data appears.

## Verification Checklist

- [ ] Webhook URL is correct and active in Pabbly
- [ ] Workflow is active (not paused) in Pabbly
- [ ] Server logs show webhook attempts
- [ ] No errors in server console
- [ ] Webhook returns 200 OK status
- [ ] Data appears in Pabbly execution logs
- [ ] Fields are mapped correctly in Pabbly workflow

## Getting Help

If issues persist:

1. **Check Server Logs:**
   - Look for `[Pabbly Webhook]` prefixed messages
   - Check for error stack traces

2. **Check Pabbly Logs:**
   - Review execution history
   - Check for error messages

3. **Test Webhook URL:**
   - Use the test endpoint
   - Verify URL is accessible

4. **Verify Environment:**
   - Check `.env` file for `PABBLY_WEBHOOK_URL`
   - Ensure environment variables are loaded

## Test Endpoints

- **GET** `/api/webhook/test-pabbly` - Send test webhook
- **POST** `/api/webhook/test-pabbly` - Send custom test webhook
  ```json
  {
    "formType": "brand_lead_creation",
    "data": { ... }
  }
  ```

## Expected Log Output

When working correctly, you should see:

```
[Pabbly Webhook] 📤 Attempting to send webhook: { formType: 'brand_lead_creation', ... }
[Pabbly Webhook] 📥 Response received: { status: 200, ... }
[Pabbly Webhook] ✅ Successfully sent webhook: { formType: 'brand_lead_creation', status: 200 }
```

If you see errors, they will be prefixed with `❌` and include detailed error information.
