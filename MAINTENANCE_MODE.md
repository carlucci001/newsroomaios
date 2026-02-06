# Maintenance Mode

This application includes a maintenance mode feature that allows you to take the public site offline while keeping admin access available.

## How to Enable Maintenance Mode

### Admin Panel (Recommended)

The easiest way to control maintenance mode is through the admin panel:

1. Go to `/admin/settings` in your browser
2. Click on the **Maintenance** tab
3. Toggle the maintenance mode switch **ON**
4. Click **Save Changes**
5. The site will immediately show the maintenance page to public visitors

This method stores the setting in Firestore and takes effect immediately without requiring a deployment.

### Alternative Methods

### Local Development

1. Open your `.env.local` file
2. Add or update this line:
   ```
   NEXT_PUBLIC_MAINTENANCE_MODE=true
   ```
3. Restart your dev server

### Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `NEXT_PUBLIC_MAINTENANCE_MODE`
   - **Value**: `true`
   - **Environment**: Production (or select specific environments)
4. Click **Save**
5. Redeploy your application (or it will automatically redeploy)

## How to Disable Maintenance Mode

### Admin Panel (Recommended)

1. Go to `/admin/settings`
2. Click on the **Maintenance** tab
3. Toggle the maintenance mode switch **OFF**
4. Click **Save Changes**
5. The site will immediately be accessible to the public

### Alternative Methods

### Local Development

1. Open your `.env.local` file
2. Change the value to:
   ```
   NEXT_PUBLIC_MAINTENANCE_MODE=false
   ```
   Or remove the line entirely
3. Restart your dev server

### Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Find `NEXT_PUBLIC_MAINTENANCE_MODE`
4. Either:
   - Delete the environment variable, OR
   - Change the value to `false`
5. Redeploy your application

## What Happens in Maintenance Mode

- ✅ **Public site** shows a maintenance page
- ✅ **Admin routes** (`/admin/*`) remain accessible
- ✅ **API routes** continue to work
- ✅ Static assets (images, CSS, JS) are served normally

## Customizing the Maintenance Page

Edit the file: `app/maintenance/page.tsx`

You can customize:
- The message shown to users
- The design and branding
- Contact information
- Estimated downtime (if known)

## Quick Toggle Commands

```bash
# Enable maintenance mode locally
echo "NEXT_PUBLIC_MAINTENANCE_MODE=true" >> .env.local

# Disable maintenance mode locally
echo "NEXT_PUBLIC_MAINTENANCE_MODE=false" >> .env.local
```

## Priority Order

The system checks for maintenance mode in this order:

1. **Environment Variable** (`NEXT_PUBLIC_MAINTENANCE_MODE=true`) - Takes highest priority
2. **Admin Panel Setting** (stored in Firestore) - Used if environment variable is not set

This means you can use the environment variable as an emergency override that takes precedence over the admin panel setting.

## Notes

- The maintenance mode check happens at the middleware level for fast response
- Admin panel changes take effect immediately (within 30 seconds due to caching)
- Changes to environment variables in Vercel require a redeploy to take effect
- Admin users can always access `/admin` routes even in maintenance mode
- API routes continue to function normally during maintenance mode
