# Vercel Blob Storage Setup Guide

This guide shows how to integrate Vercel Blob Storage for handling file uploads and outputs in your comic restoration app.

## Why Vercel Blob Storage?

Vercel serverless functions have read-only file systems (except `/tmp`). Files uploaded or generated won't persist. Vercel Blob provides:
- ✅ Persistent file storage
- ✅ CDN-backed URLs for fast delivery
- ✅ Simple API integration
- ✅ Free tier: 500GB bandwidth, 10GB storage

## Step 1: Install Vercel Blob SDK

```bash
npm install @vercel/blob
```

## Step 2: Get Your Blob Store Token

### Option A: Using Vercel Dashboard

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create Database** → **Blob**
4. Name your store (e.g., "comic-restoration-files")
5. Click **Create**
6. Copy the `BLOB_READ_WRITE_TOKEN` from the environment variables shown

### Option B: Using Vercel CLI

```bash
# Create a blob store
vercel blob create comic-restoration-files

# This automatically adds the token to your project
```

## Step 3: Add Environment Variable

The token is automatically added to your Vercel project. For local development, add to `.env`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXX
```

## Step 4: Update Your Code

### Create Blob Storage Helper

Create `src/blob-storage.js`:

```javascript
import { put, del, list } from '@vercel/blob';

/**
 * Upload file to Vercel Blob
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} filename - Desired filename
 * @returns {Promise<{url: string, pathname: string}>}
 */
export async function uploadToBlob(fileBuffer, filename) {
  const blob = await put(filename, fileBuffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  
  return {
    url: blob.url,
    pathname: blob.pathname
  };
}

/**
 * Delete file from Vercel Blob
 */
export async function deleteFromBlob(url) {
  await del(url, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

/**
 * List all files in blob storage
 */
export async function listBlobFiles(prefix = '') {
  const { blobs } = await list({
    prefix,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  
  return blobs;
}
```

### Update API Endpoint

Modify `api/index.js`:

```javascript
import { put } from '@vercel/blob';
import { restorePage } from '../src/restore.js';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, options } = req.body;
    
    // Download image from URL
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    // Process the image
    const restoredBuffer = await restorePage(imageBuffer, options);
    
    // Upload to Blob Storage
    const filename = `restored/${Date.now()}-restored.jpg`;
    const blob = await put(filename, restoredBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    res.json({
      success: true,
      outputUrl: blob.url,
      downloadUrl: blob.downloadUrl,
    });
    
  } catch (error) {
    console.error('Restoration error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

## Step 5: Update Frontend

Modify `public/app.js` to handle blob URLs:

```javascript
async function restoreComic(file, options) {
  // Step 1: Upload original file to blob
  const formData = new FormData();
  formData.append('file', file);
  
  const uploadResponse = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const { uploadUrl } = await uploadResponse.json();
  
  // Step 2: Process with restoration API
  const restoreResponse = await fetch('/api/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl: uploadUrl,
      options
    })
  });
  
  const { outputUrl } = await restoreResponse.json();
  
  // Step 3: Display result
  document.getElementById('result-image').src = outputUrl;
  document.getElementById('download-link').href = outputUrl;
}
```

## Step 6: Deploy to Vercel

```bash
# Make sure your changes are committed
git add .
git commit -m "Add Vercel Blob storage integration"
git push

# Deploy
vercel --prod
```

Or push to GitHub and Vercel will auto-deploy.

## Testing Locally

```bash
# Make sure you have the token in .env
echo "BLOB_READ_WRITE_TOKEN=your_token_here" >> .env

# Run with Vercel CLI (simulates production environment)
vercel dev
```

## Usage Examples

### Upload and Restore

```javascript
// In your API route
import { put } from '@vercel/blob';

// Upload original
const originalBlob = await put(`uploads/${filename}`, fileBuffer, {
  access: 'public',
});

// Process
const restored = await restorePage(fileBuffer, options);

// Upload result
const resultBlob = await put(`output/${filename}`, restored, {
  access: 'public',
});

return {
  original: originalBlob.url,
  restored: resultBlob.url
};
```

### Cleanup Old Files

```javascript
import { list, del } from '@vercel/blob';

// Delete files older than 24 hours
const { blobs } = await list();
const now = Date.now();
const oneDayMs = 24 * 60 * 60 * 1000;

for (const blob of blobs) {
  if (now - new Date(blob.uploadedAt).getTime() > oneDayMs) {
    await del(blob.url);
  }
}
```

## Cost Estimates

**Free Tier Includes:**
- 500 GB bandwidth/month
- 10 GB storage

**Pro Plan ($20/month):**
- 1 TB bandwidth
- 100 GB storage

**Typical Usage:**
- 10 MB original image → 40 MB restored = ~50 MB per job
- Free tier = ~200 restorations/month
- Pro tier = ~2000 restorations/month

## Alternatives to Consider

If Vercel Blob doesn't fit your needs:

1. **AWS S3** - More control, cheaper at scale
2. **Cloudinary** - Image-specific CDN with transformations
3. **DigitalOcean Spaces** - S3-compatible, simpler pricing
4. **Self-hosted** - Deploy to Railway/Render with persistent disk

## Troubleshooting

### Error: "BLOB_READ_WRITE_TOKEN is not defined"

Make sure the environment variable is set in:
- `.env` file for local development
- Vercel Dashboard → Settings → Environment Variables for production

### Files not persisting

Remember: `/tmp` is the only writable directory in serverless functions, and it's cleared between invocations. Always upload to Blob storage immediately.

### Large file uploads timing out

Increase function timeout in `vercel.json`:

```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60
    }
  }
}
```

## Next Steps

1. ✅ Install `@vercel/blob` package
2. ✅ Create blob store in Vercel
3. ✅ Update API routes to use blob storage
4. ✅ Test locally with `vercel dev`
5. ✅ Deploy to production
6. ✅ Monitor usage in Vercel Dashboard

For more details, see:
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Blob SDK Reference](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
