# DNS Troubleshooting for ngventures.space

## Current Required Configuration

Based on Vercel's instructions, you need:

### ✅ ADD this A record:
- **Type:** `A`
- **Name:** `@` (or leave blank for root domain)
- **Value:** `216.198.79.1`
- **TTL:** 3600 (or Auto)

### ❌ REMOVE this AAAA record:
- **Type:** `AAAA`
- **Name:** `@`
- **Value:** `2a02:4780:3:1140:0:31ed:63c3:d`

## Troubleshooting Steps

### Step 1: Verify DNS Records at Your Registrar

1. Log into your domain registrar (where you bought ngventures.space)
2. Go to DNS Management / DNS Settings
3. Check for these records:

**Check for AAAA record to remove:**
- Look for any AAAA record with Name `@` or blank
- If you see `2a02:4780:3:1140:0:31ed:63c3:d`, DELETE it
- If you see any other AAAA record for root domain, remove it too

**Check for A record:**
- Look for A record with Name `@` or blank
- Value should be exactly `216.198.79.1`
- If it's different, update it
- If it doesn't exist, add it

### Step 2: Verify DNS Propagation

Use these online tools to check if your DNS records are live:

1. **DNS Checker:** https://dnschecker.org
   - Enter: `ngventures.space`
   - Select record type: `A`
   - Check if `216.198.79.1` appears globally

2. **What's My DNS:** https://www.whatsmydns.net
   - Enter: `ngventures.space`
   - Check A record

3. **Command Line (if available):**
   ```bash
   nslookup ngventures.space
   # Should show: 216.198.79.1
   
   dig ngventures.space A
   # Should show: 216.198.79.1
   ```

### Step 3: Common Issues

#### Issue: AAAA record still exists
- **Symptom:** Vercel shows "Invalid Configuration"
- **Solution:** Go to your DNS provider and explicitly delete the AAAA record
- **Note:** Some registrars hide IPv6 records - check all record types

#### Issue: Multiple A records
- **Symptom:** Multiple A records pointing to different IPs
- **Solution:** Keep ONLY the A record with value `216.198.79.1`, delete others

#### Issue: DNS not propagated yet
- **Symptom:** Records look correct but Vercel still shows invalid
- **Solution:** Wait 10-30 minutes, then click "Refresh" in Vercel
- **Note:** DNS can take up to 48 hours globally, but usually 5-30 minutes

#### Issue: Wrong record name
- **Symptom:** Record exists but Vercel doesn't see it
- **Solution:** Ensure Name is exactly `@` (or blank/empty for root domain)
- **Note:** Some registrars use different notation - check their documentation

#### Issue: TTL too high
- **Symptom:** Changes not reflecting
- **Solution:** Set TTL to 3600 (1 hour) or lower temporarily

### Step 4: Force DNS Refresh

1. **In Vercel:**
   - Go to Settings → Domains
   - Click "Refresh" next to `ngventures.space`
   - Wait 1-2 minutes and check again

2. **Clear Local DNS Cache:**
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac/Linux
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```

3. **Use Different DNS Servers:**
   - Try accessing from different network
   - Use mobile data instead of WiFi
   - Use VPN to different location

### Step 5: Verify No Conflicting Records

Check for these conflicting records and remove them:

- ❌ Any AAAA record for root domain (`@`)
- ❌ Any A record pointing to different IPs (keep only `216.198.79.1`)
- ❌ Old CNAME records (if you had them before)
- ❌ Any other record types for root domain except the A record

### Step 6: Double-Check Registrar Settings

Some registrars have special settings:

1. **Nameservers:** Should be your registrar's default (not Vercel's)
2. **DNS Management:** Must be enabled
3. **Record Format:** Some use `@`, some use blank, some use domain name
4. **Save Changes:** Make sure you clicked "Save" after making changes

## Expected Result

After fixing DNS:
- ✅ Vercel shows "Valid Configuration" (green checkmark)
- ✅ `ngventures.space` loads your site
- ✅ DNS checker shows `216.198.79.1` globally
- ✅ No AAAA record exists for root domain

## Still Not Working?

If after 30 minutes it's still invalid:

1. **Screenshot your DNS records** at your registrar
2. **Check DNS propagation** using dnschecker.org
3. **Contact your domain registrar** support
4. **Try removing and re-adding** the domain in Vercel
5. **Check Vercel status page** for any issues

## Quick Checklist

- [ ] Removed AAAA record (`2a02:4780:3:1140:0:31ed:63c3:d`)
- [ ] Added A record (`216.198.79.1`) with Name `@`
- [ ] Saved changes at DNS provider
- [ ] Waited 10-30 minutes
- [ ] Clicked "Refresh" in Vercel
- [ ] Verified with dnschecker.org
- [ ] No conflicting records exist

