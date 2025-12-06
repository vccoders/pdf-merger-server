# Netlify Deployment Checklist

## Before Deploying

### ✅ Step 1: Verify Environment Variables in Netlify Dashboard

Go to: **Netlify Dashboard → Your Site → Site Settings → Environment Variables**

Ensure ALL of these are set:

#### Required Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `REDIS_HOST` - Redis server hostname  
- [ ] `REDIS_PORT` - Redis port (usually 6379)
- [ ] `STORAGE_ACCESS_KEY` - S3 access key
- [ ] `STORAGE_SECRET_KEY` - S3 secret key
- [ ] `STORAGE_ENDPOINT` - S3 endpoint URL
- [ ] `STORAGE_BUCKET_NAME` - S3 bucket name

#### Optional but Recommended
- [ ] `NODE_ENV=production`
- [ ] `LOG_LEVEL=info`
- [ ] `STORAGE_REGION=us-east-1`
- [ ] `WORKER_CONCURRENCY=5`

### ✅ Step 2: Commit and Push Changes

```bash
cd d:\VC\Tools\Pdf\pdf-merger-server

# Check what changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "fix: resolve S3Service initialization error in serverless environment

- Added defensive check for ConfigService injection
- Made S3 credentials required in env validation
- Removed redundant ConfigModule import from S3Module
- Updated documentation with deployment guide
- Added comprehensive error messages for troubleshooting"

# Push to repository
git push origin main
```

### ✅ Step 3: Trigger Netlify Deployment

Option A: **Automatic** (if auto-deploy is enabled)
- Netlify will automatically deploy after you push to the repository

Option B: **Manual**
- Go to Netlify Dashboard → Deploys
- Click "Trigger deploy" → "Deploy site"

### ✅ Step 4: Monitor Deployment

1. **Watch Build Logs**
   - Go to Netlify Dashboard → Deploys → Click on the latest deploy
   - Watch for: `npx prisma generate && npm run build`
   - Should complete without errors

2. **Watch Function Logs**
   - After deployment completes, go to Functions tab
   - Click on the `api` function
   - Look for initialization logs

### ✅ Step 5: Verify Success

Look for this in the function logs:
```
✅ [Nest] - Initializing S3Service...
✅ [Nest] - S3 Configuration: region=us-east-1, endpoint=<your-endpoint>, bucket=<your-bucket>
✅ [Nest] - S3 Service initialized successfully for bucket: <your-bucket>
```

### ✅ Step 6: Test the API

```bash
# Replace with your actual Netlify URL
NETLIFY_URL="https://your-site.netlify.app"

# Test health endpoint
curl $NETLIFY_URL/api/health

# Test presign endpoint
curl -X POST $NETLIFY_URL/api/upload/presign \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.pdf",
    "fileSize": 1024,
    "contentType": "application/pdf"
  }'
```

## If Errors Occur

### Error: "ConfigService is not available"
**Cause:** Dependency injection issue (should be rare now)
**Solution:** 
1. Check if all environment variables are set
2. Redeploy the site
3. If persists, check Netlify build logs for other errors

### Error: "Missing required S3 configuration"
**Cause:** One or more S3 environment variables are not set
**Solution:**
1. Go to Netlify Dashboard → Environment Variables
2. Verify `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_ENDPOINT` are set
3. Redeploy

### Error: "Cannot read properties of undefined (reading 'get')"
**Cause:** This should NOT happen anymore with the fixes
**Solution:**
1. Ensure you've pushed the latest code
2. Verify Netlify is building from the correct branch
3. Check environment variables are set

### Build Fails
**Solution:**
1. Check build logs for specific error
2. Ensure `package.json` dependencies are correct
3. Verify `netlify.toml` configuration is correct

## Post-Deployment

- [ ] Save deployment URL
- [ ] Test all critical endpoints
- [ ] Monitor error logs for 24 hours
- [ ] Set up alerts (if using Sentry)

## Need Help?

1. Check `DEPLOYMENT_FIX.md` for detailed explanation
2. Check `README.md` for deployment documentation
3. Review Netlify function logs for specific errors
4. Check environment variables are correctly set
