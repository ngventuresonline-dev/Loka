# Domain DNS Configuration Guide for ngventures.space

## Current Status
- ❌ `ngventures.space` - Invalid Configuration (redirects to www)
- ❌ `www.ngventures.space` - Invalid Configuration
- ✅ `ng-ventures.vercel.app` - Valid (working)
- ✅ `loka-chi.vercel.app` - Valid (working)

## Steps to Fix DNS Configuration

### Step 1: Get DNS Records from Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click on `ngventures.space` → Click "Learn more" or "Edit"
3. Vercel will show you the exact DNS records needed. Typically:
   - **For root domain (`ngventures.space`)**: 
     - Option A: A records pointing to Vercel IPs (usually 76.76.21.21)
     - Option B: CNAME to `cname.vercel-dns.com`
   - **For www subdomain (`www.ngventures.space`)**:
     - CNAME record pointing to `cname.vercel-dns.com`

### Step 2: Configure DNS at Your Domain Registrar

Go to your domain registrar (where you bought `ngventures.space`) and add these DNS records:

#### For Root Domain (ngventures.space):
```
Type: A
Name: @ (or leave blank)
Value: 76.76.21.21
TTL: 3600 (or Auto)
```

OR (if CNAME is supported for root):
```
Type: CNAME
Name: @ (or leave blank)
Value: cname.vercel-dns.com
TTL: 3600
```

#### For WWW Subdomain (www.ngventures.space):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### Step 3: Verify in Vercel

1. After adding DNS records, go back to Vercel → Settings → Domains
2. Click "Refresh" next to each domain
3. Wait 5-10 minutes for DNS propagation
4. The status should change from "Invalid Configuration" to "Valid Configuration"

### Step 4: Assign Domains to Production

1. In Vercel → Deployments
2. Find your latest successful deployment
3. Click the three dots (⋯) → "Assign Domain"
4. Select both `ngventures.space` and `www.ngventures.space`
5. Ensure they're assigned to "Production"

## Common Issues

### Issue: "Invalid Configuration" persists
- **Solution**: Double-check DNS records match exactly what Vercel shows
- **Solution**: Wait longer (DNS can take up to 48 hours to propagate)
- **Solution**: Use a DNS checker tool to verify records are live

### Issue: Domain works but shows old content
- **Solution**: Clear browser cache (Ctrl+Shift+R)
- **Solution**: Check that domain is assigned to the latest deployment
- **Solution**: Wait for CDN cache to clear (5-10 minutes)

### Issue: www redirects but root doesn't work
- **Solution**: Ensure both A/CNAME records are set correctly
- **Solution**: Some registrars don't support CNAME on root - use A records instead

## Quick DNS Check Commands

After configuring DNS, verify with these commands:

```bash
# Check A record for root domain
nslookup ngventures.space

# Check CNAME for www
nslookup www.ngventures.space

# Check DNS propagation (online)
# Visit: https://dnschecker.org
```

## Next Steps After DNS is Fixed

1. ✅ Verify domains show "Valid Configuration" in Vercel
2. ✅ Assign domains to latest production deployment
3. ✅ Test `https://ngventures.space` in browser
4. ✅ Test `https://www.ngventures.space` in browser
5. ✅ Clear browser cache if you see old content

## Important Notes

- DNS changes can take 5 minutes to 48 hours to propagate globally
- The Vercel `.vercel.app` domains work immediately (no DNS needed)
- Always use HTTPS (Vercel provides SSL automatically)
- Keep both root and www configured for best user experience

