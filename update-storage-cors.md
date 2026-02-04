# Firebase Storage CORS Configuration

Since gcloud isn't accessible via CLI, configure CORS manually:

## Option 1: Google Cloud Console (Web UI)
1. Go to: https://console.cloud.google.com/storage/browser/newsroomasios.firebasestorage.app
2. Click the bucket name
3. Click "Permissions" tab  
4. Click "CORS" sub-tab
5. Click "Edit CORS configuration"
6. Paste the contents of: c:/dev/newsroomaios/firebase-storage-cors.json
7. Click Save

## Option 2: Find and Run gsutil Manually
1. Open a NEW Command Prompt or PowerShell window
2. Run: where gcloud (to find the installation path)
3. Navigate to that path and run:
   ```
   gsutil cors set c:/dev/newsroomaios/firebase-storage-cors.json gs://newsroomasios.firebasestorage.app
   ```

## Quick Test First
Try accessing admin via HTTPS (not HTTP):
https://the42.newsroomaios.com/admin

Then try uploading the logo again.
