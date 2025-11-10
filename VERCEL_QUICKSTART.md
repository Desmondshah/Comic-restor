# 🚀 Quick Start: Deploy to Vercel with Blob Storage

## ✅ What's Been Set Up

Your project now has:
- ✅ Vercel Blob Storage integration (`@vercel/blob` installed)
- ✅ API endpoints for upload and restoration (`/api/upload`, `/api/restore`)
- ✅ Blob storage helper functions (`src/blob-storage.js`)
- ✅ Demo web interface (`public/blob-demo.html`)
- ✅ Deployment configuration (`vercel.json`)

## 🎯 Deploy in 3 Steps

### Step 1: Install Vercel CLI & Login

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login
```

### Step 2: Deploy

```powershell
# Deploy to Vercel (from project directory)
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (first time)
- **Project name?** → Press Enter (or customize)
- **Directory?** → Press Enter (current directory)
- **Override settings?** → No

### Step 3: Configure Blob Storage

After first deployment:

```powershell
# Create a Blob Store
vercel blob create comic-files

# This automatically adds BLOB_READ_WRITE_TOKEN to your project
```

**OR** create via Dashboard:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database** → **Blob**
5. Name it (e.g., "comic-files")
6. Click **Create**

### Step 4: Add Replicate API Token

In Vercel Dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add:
   - **Key**: `REPLICATE_API_TOKEN`
   - **Value**: Your Replicate API token (from [replicate.com/account](https://replicate.com/account/api-tokens))
   - **Environments**: Production, Preview, Development (all)
3. Click **Save**

### Step 5: Redeploy

```powershell
# Redeploy to apply environment variables
vercel --prod
```

## 🎨 Test Your Deployment

Once deployed, visit:
- **Main App**: `https://your-project.vercel.app`
- **Blob Demo**: `https://your-project.vercel.app/blob-demo.html`

## 📡 API Endpoints

### Upload File
```bash
POST /api/upload
Content-Type: application/json

{
  "file": "base64_encoded_image",
  "filename": "comic-page.jpg"
}
```

Response:
```json
{
  "success": true,
  "url": "https://blob.vercel-storage.com/...",
  "downloadUrl": "https://..."
}
```

### Restore Comic
```bash
POST /api/restore
Content-Type: application/json

{
  "imageUrl": "https://blob.vercel-storage.com/...",
  "options": {
    "enableAIRestore": true,
    "scale": 2,
    "lightingPreset": "modern-reprint"
  }
}
```

Response:
```json
{
  "success": true,
  "outputUrl": "https://blob.vercel-storage.com/...",
  "downloadUrl": "https://...",
  "metadata": {
    "width": 3000,
    "height": 4000,
    "format": "jpeg"
  }
}
```

## 🧪 Test Locally

```powershell
# Set up environment
echo "REPLICATE_API_TOKEN=your_token" >> .env
echo "BLOB_READ_WRITE_TOKEN=your_blob_token" >> .env

# Run with Vercel dev server (simulates production)
vercel dev

# Or use the local Node server
npm run server
```

Then visit: http://localhost:3000/blob-demo.html

## 📊 Monitor Usage

Track your Blob storage usage:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. View bandwidth and storage metrics

## 💡 Tips

### Clean Up Old Files

Use the cleanup function to delete old uploads:

```javascript
import { cleanupOldFiles } from './src/blob-storage.js';

// Delete files older than 24 hours
await cleanupOldFiles(24 * 60 * 60 * 1000);
```

### Custom File Paths

Organize files with prefixes:

```javascript
import { uploadToBlob, generateBlobFilename } from './src/blob-storage.js';

// Generate unique filename
const filename = generateBlobFilename('comic.jpg', 'uploads');
// Result: uploads/1699564800000-123456789-comic.jpg

await uploadToBlob(buffer, filename);
```

### Error Handling

Always handle blob storage errors:

```javascript
try {
  const result = await uploadToBlob(buffer, filename);
  console.log('Uploaded:', result.url);
} catch (error) {
  console.error('Upload failed:', error.message);
  // Fallback to local storage or retry
}
```

## 🔧 Troubleshooting

### "BLOB_READ_WRITE_TOKEN is not defined"
→ Create a blob store with `vercel blob create` or via Dashboard

### "Function timeout"
→ Increase timeout in `vercel.json`:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60
    }
  }
}
```

### "File too large"
→ Check limits:
- API body size: 50MB (configured in `api/upload.js`)
- Vercel function memory: 1024MB (Hobby), 3008MB (Pro)

### Sharp/Native Module Errors
→ Vercel automatically handles native modules. If issues persist, ensure you're deploying with Node.js 18+

## 📚 Documentation

- [Complete Setup Guide](./VERCEL_BLOB_SETUP.md)
- [Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)

## 🎉 You're Ready!

Your comic restoration app is now ready for Vercel with blob storage. Just run:

```powershell
vercel --prod
```

Questions? Check the documentation or visit [Vercel Support](https://vercel.com/support).
