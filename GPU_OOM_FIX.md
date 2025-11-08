# GPU Out of Memory Fix Guide

## 🔥 Problem

Replicate's Real-ESRGAN model runs out of GPU memory when processing large images:
```
CUDA out of memory. Tried to allocate 3.18 GiB
```

## ✅ Solutions Implemented

### 1. Automatic Image Preprocessing (src/restore.js)

The code now automatically resizes images that are too large before sending to Replicate:

- **Max dimension:** 2048px (before upscaling)
- **Automatic resize:** If image > 2048px, it's resized to fit
- **Retry logic:** 3 attempts with progressive size reduction
- **Exponential backoff:** Waits 2s, 4s, 8s between retries

### 2. How It Works

```javascript
// Before upscaling, check image size
if (width or height > 2048px) {
  → Resize to fit within 2048px
  → Log warning
}

// Try upscaling
Attempt 1: Normal size
  ↓ (if CUDA OOM)
Attempt 2: Wait 2s, retry
  ↓ (if CUDA OOM)  
Attempt 3: Reduce to 75%, wait 4s, retry
  ↓ (if still fails)
Throw error
```

## 🚀 Usage

### Restart the Server

**Important:** Stop the current server and restart to load the new code:

```powershell
# Stop current server (Ctrl+C in the terminal)
# Then restart:
npm run web
```

### Upload Images

The preprocessing now happens automatically:

1. Upload any size image
2. If > 2048px, you'll see: `⚠️ Image too large, resizing...`
3. Processing continues automatically
4. If CUDA OOM still occurs, automatic retry with smaller size

## 📏 Recommended Image Sizes

For best results with Real-ESRGAN 2x upscaling:

| Input Size | After 2x | Status | Recommendation |
|-----------|----------|---------|----------------|
| 1024x768 | 2048x1536 | ✅ Safe | Perfect for web |
| 1500x1000 | 3000x2000 | ✅ Safe | Good for print |
| 2048x1536 | 4096x3072 | ✅ Safe | Max safe size |
| 3000x2000 | 6000x4000 | ⚠️ Risk | Auto-resized to 2048px |
| 4000x3000 | 8000x6000 | ❌ Fails | Auto-resized to 2048px |

## 💡 Tips

### 1. Pre-resize Large Scans

If you have very large scans (4000px+), resize them first:

**Using Sharp (Node.js):**
```javascript
import sharp from 'sharp';

await sharp('large-comic.jpg')
  .resize(2048, 2048, {
    fit: 'inside',
    withoutEnlargement: true
  })
  .toFile('comic-resized.jpg');
```

**Using ImageMagick:**
```bash
magick convert large-comic.jpg -resize 2048x2048\> comic-resized.jpg
```

**Using Photoshop:**
1. Image → Image Size
2. Set longest side to 2048px
3. Keep "Constrain Proportions" checked
4. Save

### 2. Use 4x Upscaling Sparingly

- 2x upscaling: Safe for most images
- 4x upscaling: Only use on small images (<1024px)
- Higher scale = more GPU memory needed

### 3. Batch Processing Strategy

When processing multiple pages:

```
Option A: All at once (may hit GPU limits)
❌ Upload 10 large pages simultaneously

Option B: Sequential processing (safer)
✅ Upload 1-2 pages at a time
✅ Wait for completion
✅ Then upload next batch
```

## 🔧 Advanced Configuration

### Modify Max Dimension

Edit `src/restore.js` to change the limit:

```javascript
// Current default: 2048px
if (maxDimension > 2048) {

// For larger GPU / lower scale:
if (maxDimension > 3072) {  // Allow 3072px

// For smaller GPU / higher quality:
if (maxDimension > 1536) {  // Limit to 1536px
```

### Disable Auto-resize

If you want to control resizing manually:

```javascript
// Comment out the resize block in src/restore.js
/*
if (maxDimension > 2048) {
  // ... resize code
}
*/
```

## 🐛 Troubleshooting

### Still Getting OOM After Update?

1. **Verify code loaded:**
   ```powershell
   # Restart server completely
   Ctrl+C
   npm run web
   ```

2. **Check for resize message:**
   - Should see: `⚠️ Image too large (3056x1988), resizing...`
   - If not visible, code didn't load

3. **Try smaller image:**
   - Resize to 1500px manually
   - Upload and test

### Replicate API Limits

Sometimes the issue is Replicate's server load:

- **Peak hours:** More users = less GPU available
- **Solution:** Wait 5-10 minutes, try again
- **Alternative:** Use different model/endpoint

### Memory Persists Between Jobs

Replicate's GPU doesn't clear between your jobs:

- **Problem:** Previous jobs still in GPU memory
- **Solution:** Wait 2-3 minutes between large jobs
- **Automatic:** Retry logic handles this

## 📊 Error Message Reference

| Error | Meaning | Auto-Fix |
|-------|---------|----------|
| `Input image of dimensions... greater than max size` | Image too large | ✅ Resized to 2048px |
| `CUDA out of memory` | GPU full | ✅ Retry with smaller size |
| `Tried to allocate X GiB` | Need more VRAM | ✅ Progressive reduction |
| `PyTorch memory... reserved but unallocated` | Fragmentation | ✅ Retry with delay |

## 🎯 Summary

**What Changed:**
- ✅ Automatic image resizing to prevent OOM
- ✅ 3 retry attempts with progressive size reduction
- ✅ Exponential backoff (wait between retries)
- ✅ Detailed logging for debugging

**What You Need To Do:**
1. Restart the server: `npm run web`
2. Upload images (any size)
3. Processing now automatic

**Expected Behavior:**
- Small images: Process normally
- Large images: Auto-resize → Process
- OOM errors: Auto-retry → Reduce → Process
- Persistent failures: Clear error message

---

**The fix is already in your code - just restart the server!**

*Last Updated: 2025-11-07*
