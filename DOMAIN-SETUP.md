# Domain Setup Guide: newsroomaios.com → Firebase Hosting

## ✅ Current Status

**Deployed!** Your homepage is live at: **https://newsroomasios.web.app**

Now let's connect your custom domain **newsroomaios.com** from GoDaddy.

---

## Step 1: Add Custom Domain in Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com/project/newsroomasios/hosting/sites
2. Click **"Add custom domain"**
3. Enter your domain: **newsroomaios.com**
4. Click **"Continue"**

Firebase will provide you with DNS records to configure. **Keep this page open** - you'll need these values for GoDaddy.

---

## Step 2: Configure DNS Records in GoDaddy

### A. Verification TXT Record (Required First)

Firebase will show you a TXT record like:
```
Name: @
Type: TXT
Value: google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXX
```

**In GoDaddy**:
1. Log in to GoDaddy: https://dcc.godaddy.com/domains
2. Find **newsroomaios.com** → Click **DNS**
3. Scroll to **Records** section
4. Click **"Add New Record"**
5. Select **Type**: TXT
6. Set **Name**: @
7. Set **Value**: (paste the verification code from Firebase)
8. Set **TTL**: 600 seconds (default)
9. Click **"Save"**

### B. A Records (After Verification)

Once Firebase verifies your domain (usually takes 10-30 minutes), you'll get two A records:

```
Type: A
Name: @
Value: 151.101.1.195

Type: A
Name: @
Value: 151.101.65.195
```

**In GoDaddy**:
1. Click **"Add New Record"** twice (you need two separate A records)
2. For each record:
   - **Type**: A
   - **Name**: @ (for root domain newsroomaios.com)
   - **Value**: (one of the IP addresses above)
   - **TTL**: 600 seconds
3. Click **"Save"** after each

### C. CNAME Record for WWW (Optional but Recommended)

This makes **www.newsroomaios.com** redirect to **newsroomaios.com**:

```
Type: CNAME
Name: www
Value: newsroomasios.web.app
```

**In GoDaddy**:
1. Click **"Add New Record"**
2. **Type**: CNAME
3. **Name**: www
4. **Value**: newsroomasios.web.app
5. **TTL**: 600 seconds (or 1 Hour)
6. Click **"Save"**

---

## Step 3: Wait for DNS Propagation

- **Verification TXT record**: 10-30 minutes
- **A records**: 24-48 hours (but usually works in 1-2 hours)
- **SSL certificate**: Automatically issued by Firebase once DNS propagates

---

## Step 4: Verify Everything Works

### Check DNS Propagation
Use these tools to verify your DNS records are live:
- https://dnschecker.org (enter newsroomaios.com)
- https://www.whatsmydns.net (check A records globally)

### Test Your Domain
Once propagated, visit:
- **http://newsroomaios.com** (should redirect to HTTPS)
- **https://newsroomaios.com** (should show your homepage)
- **https://www.newsroomaios.com** (should redirect to main domain)

---

## Troubleshooting

### Issue: "TXT record not found"
- Wait 10-30 minutes after adding TXT record in GoDaddy
- Clear your browser cache
- Try incognito mode
- Use `nslookup -type=txt newsroomaios.com` in terminal to verify

### Issue: "A records not resolving"
- Make sure you added BOTH A records (two separate entries)
- Check TTL is set correctly (600 seconds or default)
- DNS can take up to 48 hours globally (but usually 1-2 hours)

### Issue: "SSL certificate not issued"
- Firebase automatically issues SSL after DNS propagates
- Can take 24 hours after A records are verified
- Certificate is free and auto-renewing

### Issue: "Old GoDaddy parking page still shows"
- Clear browser cache (Ctrl+Shift+Delete)
- Try different browser or incognito mode
- Wait for full DNS propagation (up to 48 hours)

---

## Expected DNS Configuration (Final State)

Once complete, your GoDaddy DNS should have:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | @ | google-site-verification=XXXXXX | 600 |
| A | @ | 151.101.1.195 | 600 |
| A | @ | 151.101.65.195 | 600 |
| CNAME | www | newsroomasios.web.app | 3600 |

---

## Dev vs Production URLs

You now have two URLs:

**Development/Preview**:
- https://newsroomasios.web.app (Firebase default)
- Use this for testing before DNS propagates
- Always accessible regardless of DNS

**Production (Custom Domain)**:
- https://newsroomaios.com (main domain)
- https://www.newsroomaios.com (www redirect)
- Uses your custom domain
- Requires DNS configuration complete

---

## Next Steps After Domain is Live

1. **Update .env.local** with production domain (if needed for future features)
2. **Set up email forwarding** in GoDaddy (e.g., support@newsroomaios.com)
3. **Add domain to Google Search Console** for SEO tracking
4. **Configure Google Analytics** (add tracking ID to homepage)
5. **Test mobile responsiveness** on real devices
6. **Share with first beta users** to validate marketing message

---

## Quick Reference: Firebase Console Links

- **Hosting Dashboard**: https://console.firebase.google.com/project/newsroomasios/hosting/sites
- **Custom Domains**: https://console.firebase.google.com/project/newsroomasios/hosting/sites/newsroomasios/domains
- **Project Overview**: https://console.firebase.google.com/project/newsroomasios/overview

---

## Support

If you encounter issues:
1. Check Firebase Console for domain verification status
2. Verify DNS records in GoDaddy match exactly
3. Wait full 48 hours before troubleshooting further
4. Firebase Hosting automatically handles SSL and redirects (no action needed)
