# ✅ Vercel Blob Storage - Setup Complete

## What Was Added

Your comic restoration project is now ready for Vercel deployment with Blob Storage!

### 📦 New Files Created

1. **`src/blob-storage.js`** - Blob storage helper functions
   - `uploadToBlob()` - Upload files to Vercel Blob
   - `deleteFromBlob()` - Delete files from storage
   - `listBlobFiles()` - List all stored files
   - `cleanupOldFiles()` - Remove old files automatically
   - `downloadFromBlob()` - Download files as buffers

2. **`api/upload.js`** - Upload endpoint
   - Accepts base64-encoded images
   - Validates file type and size
   - Returns blob URL for uploaded file

3. **`api/restore.js`** - Restoration endpoint
   - Downloads image from URL
   - Applies AI damage restoration
   - Upscales and enhances
   - Uploads result to blob storage
   - Returns restored image URL

4. **`public/blob-demo.html`** - Demo web interface
   - Drag-and-drop file upload
   - Real-time progress tracking
   - Before/after comparison
   - Download restored images

5. **Documentation**
   - `VERCEL_BLOB_SETUP.md` - Complete setup guide
   - `VERCEL_QUICKSTART.md` - Quick deployment guide
   - `deploy-vercel.ps1` - PowerShell deployment script

### 🔧 Updated Files

1. **`package.json`**
   - Added `@vercel/blob` dependency

2. **`src/ai-damage-restoration.js`**
   - Added `restoreDamageBuffer()` method for serverless processing
   - No file I/O required - works with buffers only

## 🚀 How to Deploy

### Quick Deploy (3 Commands)

```powershell
# 1. Login to Vercel
vercel login

# 2. Deploy
vercel

# 3. Create blob store
vercel blob create comic-files
```

### Add Environment Variables

In [Vercel Dashboard](https://vercel.com/dashboard):
1. Go to your project
2. Settings → Environment Variables
3. Add:
   - `REPLICATE_API_TOKEN` - Your Replicate API key
   - `BLOB_READ_WRITE_TOKEN` - Auto-added when you create blob store

### Redeploy

```powershell
vercel --prod
```

## 📡 API Usage

### Upload File

```javascript
// Convert file to base64
const reader = new FileReader();
reader.onload = async () => {
  const base64 = reader.result;
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: base64,
      filename: 'comic.jpg'
    })
  });
  
  const { url } = await response.json();
  console.log('Uploaded to:', url);
};
reader.readAsDataURL(file);
```

### Restore Image

```javascript
const response = await fetch('/api/restore', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://blob.vercel-storage.com/...',
    options: {
      enableAIRestore: true,
      scale: 2,
      lightingPreset: 'modern-reprint',
      faceEnhance: true
    }
  })
});

const { outputUrl, metadata } = await response.json();
console.log('Restored:', outputUrl);
console.log('Dimensions:', metadata.width, 'x', metadata.height);
```

## 🧪 Test Locally

```powershell
# Set up environment
echo "REPLICATE_API_TOKEN=your_token" >> .env
echo "BLOB_READ_WRITE_TOKEN=your_blob_token" >> .env

# Run Vercel dev server (simulates production)
vercel dev
```

Visit: http://localhost:3000/blob-demo.html

## 📊 Storage Limits

### Free Tier (Hobby)
- ✅ 500 GB bandwidth/month
- ✅ 10 GB storage
- ✅ Function timeout: 10s (default), 60s (max)

### Pro Tier ($20/month)
- ✅ 1 TB bandwidth/month
- ✅ 100 GB storage
- ✅ Function timeout: 60s (default), 300s (max)

### Typical Usage
- Original comic: 10 MB
- Restored (2x): 40 MB
- **Total per job**: ~50 MB
- **Free tier**: ~200 restorations/month
- **Pro tier**: ~2,000 restorations/month

## 🛠️ Helper Functions

### Upload to Blob

```javascript
import { uploadToBlob, generateBlobFilename } from './src/blob-storage.js';

const filename = generateBlobFilename('comic.jpg', 'uploads');
const result = await uploadToBlob(imageBuffer, filename);

console.log('URL:', result.url);
console.log('Download:', result.downloadUrl);
```

### Cleanup Old Files

```javascript
import { cleanupOldFiles } from './src/blob-storage.js';

// Delete files older than 24 hours
const result = await cleanupOldFiles(24 * 60 * 60 * 1000, 'uploads');
console.log(`Deleted ${result.deleted} files`);
```

### List All Files

```javascript
import { listBlobFiles } from './src/blob-storage.js';

const files = await listBlobFiles('uploads');
files.forEach(file => {
  console.log(file.pathname, file.size, file.uploadedAt);
});
```

## 🔍 Troubleshooting

### Issue: "BLOB_READ_WRITE_TOKEN is not defined"
**Solution**: Create blob store with `vercel blob create` or in Dashboard

### Issue: Function timeout
**Solution**: Increase timeout in `vercel.json`:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60
    }
  }
}
```

### Issue: Out of memory
**Solution**: Reduce image size before processing or upgrade to Pro plan (3GB memory)

### Issue: Sharp module errors
**Solution**: Vercel handles native modules automatically. Ensure Node.js 18+ in deployment

## 📚 Next Steps

1. ✅ Deploy to Vercel: `vercel`
2. ✅ Create blob store: `vercel blob create`
3. ✅ Add environment variables in Dashboard
4. ✅ Test with demo: `https://your-project.vercel.app/blob-demo.html`
5. ✅ Monitor usage in Vercel Dashboard

## 🎯 Production Checklist

- [ ] Vercel account created
- [ ] Project deployed: `vercel --prod`
- [ ] Blob store created
- [ ] `REPLICATE_API_TOKEN` added
- [ ] `BLOB_READ_WRITE_TOKEN` verified
- [ ] Tested upload endpoint
- [ ] Tested restore endpoint
- [ ] Set up automatic cleanup (optional)
- [ ] Monitor usage limits

## 💡 Tips

- Use `vercel dev` to test locally with production-like environment
- Set up automatic cleanup to manage storage costs
- Monitor blob storage usage in Vercel Dashboard
- Consider CDN caching for frequently accessed images
- Use prefixes to organize files (uploads/, output/, temp/)

## 🆘 Need Help?

- Read: `VERCEL_BLOB_SETUP.md` - Detailed setup guide
- Read: `VERCEL_QUICKSTART.md` - Quick start guide
- Visit: [Vercel Docs](https://vercel.com/docs/storage/vercel-blob)
- Visit: [Vercel Support](https://vercel.com/support)

---

**You're all set!** Run `vercel` to deploy your comic restoration app to the cloud. 🚀
