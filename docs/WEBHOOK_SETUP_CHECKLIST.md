# Webhook Setup Checklist

Use this checklist to verify your Pabbly webhook integration is working correctly.

## ✅ Pre-Deployment Checklist

### 1. Webhook URL Configuration
- [ ] Webhook URL is set in `.env` file as `PABBLY_WEBHOOK_URL`
- [ ] Or default URL is correct in `src/lib/pabbly-webhook.ts`
- [ ] URL format: `https://connect.pabbly.com/workflow/sendwebhookdata/YOUR_ID`

### 2. Pabbly Workflow Setup
- [ ] Workflow is created in Pabbly Connect
- [ ] Webhook trigger is added and configured
- [ ] Workflow is **Active** (not paused)
- [ ] Webhook URL matches the one in your code

### 3. Code Integration
- [ ] Webhook functions are imported in API routes
- [ ] Webhook calls are made after successful form submissions
- [ ] Error handling is in place (`.catch()` handlers)

### 4. Testing
- [ ] Test endpoint works: `GET /api/webhook/test-pabbly`
- [ ] Server logs show webhook attempts
- [ ] No errors in console logs
- [ ] Data appears in Pabbly execution logs

## 🔍 Verification Steps

### Step 1: Check Webhook URL
```bash
# In your .env file, verify:
PABBLY_WEBHOOK_URL=https://connect.pabbly.com/workflow/sendwebhookdata/YOUR_ID
```

### Step 2: Test Webhook Endpoint
Visit: `http://localhost:3000/api/webhook/test-pabbly`

Expected: JSON response with `success: true`

### Step 3: Check Server Logs
Look for:
```
[Pabbly Webhook] 📤 Attempting to send webhook
[Pabbly Webhook] ✅ Successfully sent webhook
```

### Step 4: Check Pabbly
1. Log into Pabbly Connect
2. Go to **Executions** tab
3. Look for recent webhook executions
4. Verify data is received

## 🐛 Common Issues

### Issue: No webhook logs
**Solution:** Check if webhook functions are being called in API routes

### Issue: Webhook sends but no data in Pabbly
**Solution:** 
1. Verify workflow is active
2. Check webhook trigger configuration
3. Verify field mapping in Pabbly

### Issue: 404 or 400 errors
**Solution:** 
1. Verify webhook URL is correct
2. Check if URL has expired
3. Get fresh URL from Pabbly

### Issue: Timeout errors
**Solution:**
1. Check network connectivity
2. Verify firewall settings
3. Increase timeout if needed

## 📝 Next Steps After Setup

1. **Map Fields in Pabbly:**
   - After webhook trigger, add a Data Mapper step
   - Map incoming fields to your workflow variables
   - Use format: `{{webhook.fieldName}}`

2. **Set Up Actions:**
   - Add actions after webhook (Google Sheets, Email, CRM, etc.)
   - Configure based on `formType` field

3. **Test Each Form Type:**
   - Test all 9 form types
   - Verify data flows correctly
   - Check field mappings

4. **Monitor:**
   - Check server logs regularly
   - Monitor Pabbly execution logs
   - Set up alerts for failures

## 🆘 Need Help?

1. Check `PABBLY_TROUBLESHOOTING.md` for detailed debugging
2. Review server logs for error messages
3. Test webhook URL directly with curl
4. Verify Pabbly workflow configuration
