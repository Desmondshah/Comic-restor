# 🌐 Web UI Guide

The Comic Restoration Pipeline now includes a beautiful web interface for easy restoration without using the command line!

## 🚀 Quick Start

### 1. Start the Web Server

```powershell
npm run web
```

Or:
```powershell
npm run server
```

The server will start on **http://localhost:3000**

### 2. Open in Browser

Navigate to: **http://localhost:3000**

You'll see the web interface with:
- 📤 Drag & drop file upload
- ⚙️ Easy settings controls
- 📋 Real-time job tracking
- 📥 One-click PDF downloads

### 3. Upload & Restore

1. **Drag & drop** a comic scan (or click to browse)
2. **Optional**: Upload a damage mask (white = areas to fix)
3. **Adjust settings** (scale, DPI, matte compensation)
4. **Click "Start Restoration"**
5. **Watch progress** in real-time
6. **Download** your print-ready PDF!

---

## 🎨 Features

### Modern Interface
- ✅ Dark theme optimized for long sessions
- ✅ Drag & drop file uploads
- ✅ Live preview of uploaded images
- ✅ Real-time progress tracking via WebSocket
- ✅ Responsive design (works on mobile)

### File Management
- ✅ Upload comic scans (JPG, PNG, TIFF)
- ✅ Optional damage masks for inpainting
- ✅ Preview before restoration
- ✅ Download completed PDFs
- ✅ Job history with status

### Settings Control
- ✅ Upscale factor (2x or 4x)
- ✅ Output DPI (300 or 600)
- ✅ Matte compensation (0-20)
- ✅ Bleed margins
- ✅ Face restoration toggle
- ✅ OCR extraction toggle

### Real-Time Updates
- ✅ WebSocket connection for instant updates
- ✅ Progress bars showing completion
- ✅ Stage tracking (upscaling, quality check, PDF export)
- ✅ Success/error notifications

---

## 📡 API Endpoints

The web server provides a REST API that can be used programmatically:

### Health Check
```
GET /api/health
```
Returns server status and API token configuration.

### Upload Image
```
POST /api/upload
Body: multipart/form-data with "image" field
```
Uploads a comic scan. Returns filename for restoration.

### Upload Mask
```
POST /api/upload-mask
Body: multipart/form-data with "mask" field
```
Uploads a damage mask. Returns filename.

### Start Restoration
```
POST /api/restore
Body: {
  "filename": "uploaded-file.jpg",
  "maskFilename": "mask-file.png", // optional
  "options": {
    "scale": 2,
    "dpi": 300,
    "matteCompensation": 5,
    "bleedIn": 0.125,
    "useFaceRestore": false,
    "extractOCR": false
  }
}
```
Starts a restoration job. Returns job ID.

### Get Job Status
```
GET /api/jobs/:id
```
Returns current status of a job.

### List All Jobs
```
GET /api/jobs
```
Returns array of all jobs (newest first).

### Download PDF
```
GET /api/download/:filename
```
Downloads a completed PDF file.

### Delete Job
```
DELETE /api/jobs/:id
```
Deletes a job and its uploaded files.

---

## 🔧 Configuration

### Environment Variables

The web server uses the same `.env` file:

```env
REPLICATE_API_TOKEN=your_token_here
PORT=3000                    # Optional: custom port
```

### Default Settings

The web UI loads settings from `config.json` if it exists:

```json
{
  "upscale": {
    "scale": 2,
    "faceEnhance": false
  },
  "pdf": {
    "widthIn": 6.625,
    "heightIn": 10.25,
    "dpi": 300,
    "bleedIn": 0.125
  },
  "matteCompensation": 5
}
```

---

## 🖥️ Using the Web UI

### Uploading Files

**Method 1: Drag & Drop**
1. Drag comic scan from file explorer
2. Drop onto the upload zone
3. Preview appears automatically

**Method 2: Click to Browse**
1. Click the upload zone
2. Select file from file picker
3. Preview appears automatically

**Optional Damage Mask:**
- Upload a PNG mask where white = damaged areas
- Black = areas to preserve
- The AI will inpaint only the white areas

### Adjusting Settings

**Upscale Factor:**
- **2x**: Standard quality, faster, lower cost (~$0.10/page)
- **4x**: High quality, slower, higher cost (~$0.20/page)

**Output DPI:**
- **300**: Standard print quality
- **600**: Professional/archival quality

**Matte Compensation:**
- **0-5**: Glossy paper
- **5-8**: Matte paper (recommended)
- **8-10**: Newsprint or very absorbent paper

**Bleed:**
- **0.125"**: Standard (1/8 inch)
- **0.1875"**: Extended for offset printing

**Face Restoration:**
- ⚠️ Only enable for realistic comic faces
- Don't use on cartoons/manga/stylized art

**OCR Extraction:**
- Extracts text from speech balloons
- Useful for re-typesetting

### Monitoring Progress

Jobs show real-time progress:
- **Queued** (⏳): Waiting to start
- **Processing** (⚙️): Currently restoring
  - Progress bar shows completion %
  - Stage indicator shows current step
- **Completed** (✅): Ready to download
- **Failed** (❌): Error occurred

### Downloading Results

Click **"📥 Download PDF"** button on completed jobs.

The PDF includes:
- ✅ Upscaled and cleaned image
- ✅ Print-ready sizing with bleed
- ✅ Proper DPI for printing
- ✅ Matte paper compensation

---

## 💡 Tips for Web UI

### Best Practices

1. **Test with one page first**
   - Upload a single page
   - Adjust settings
   - Verify output quality
   - Then batch process

2. **Monitor progress**
   - Keep browser tab open
   - WebSocket provides real-time updates
   - If connection drops, refresh page

3. **Download promptly**
   - PDFs are stored in `output/` folder
   - Download completed jobs
   - Delete old jobs to save space

4. **Use appropriate settings**
   - 2x/300 DPI for most comics
   - 4x/600 DPI for high-end printing
   - Adjust matte compensation for paper type

### Batch Processing

For multiple pages:

1. **Process sequentially** (not simultaneously)
   - Start one job
   - Wait for completion
   - Start next job
   - Respects API rate limits

2. **Or use CLI for large batches**
   ```powershell
   npm start -- -b -i samples/ -o output/
   ```

### Troubleshooting

**"API Token Not Configured" warning:**
- Add `REPLICATE_API_TOKEN` to `.env` file
- Restart server: `Ctrl+C` then `npm run web`

**Upload fails:**
- Check file size (max 50MB)
- Ensure file format (JPG, PNG, TIFF)
- Check disk space

**Job stuck in "Processing":**
- Replicate API may have queue delays
- Wait a few minutes
- Check Replicate dashboard for status

**WebSocket disconnected:**
- Refresh browser page
- Server may have restarted
- Jobs continue processing in background

**Can't download PDF:**
- Check if job actually completed
- Look in `output/` folder manually
- May need to restart server

---

## 🔒 Security Notes

### For Local Use Only

The web server is designed for **local use** (localhost):
- No authentication implemented
- File uploads stored locally
- Suitable for personal projects

### For Production/Remote Use

If deploying to a server:

1. **Add authentication**
   - Use middleware like `passport` or `express-session`
   - Require login before access

2. **Add HTTPS**
   - Use reverse proxy (nginx, Caddy)
   - Enable SSL/TLS certificates

3. **Limit file sizes**
   - Already set to 50MB
   - Adjust in `server.js` if needed

4. **Add rate limiting**
   - Prevent abuse
   - Use `express-rate-limit`

5. **Secure WebSocket**
   - Use WSS (WebSocket Secure)
   - Validate connections

---

## 🎯 API Usage Examples

### Using curl

**Upload image:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "image=@page01.jpg"
```

**Start restoration:**
```bash
curl -X POST http://localhost:3000/api/restore \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "1234567890-page01.jpg",
    "options": {
      "scale": 2,
      "dpi": 300,
      "matteCompensation": 5
    }
  }'
```

**Check job status:**
```bash
curl http://localhost:3000/api/jobs/1
```

**Download PDF:**
```bash
curl http://localhost:3000/api/download/page01_restored.pdf \
  -o page01_restored.pdf
```

### Using JavaScript/Fetch

```javascript
// Upload image
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
const { filename } = await uploadResponse.json();

// Start restoration
const restoreResponse = await fetch('/api/restore', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filename,
    options: { scale: 2, dpi: 300 }
  })
});
const { jobId } = await restoreResponse.json();

// Poll for completion
const interval = setInterval(async () => {
  const statusResponse = await fetch(`/api/jobs/${jobId}`);
  const job = await statusResponse.json();
  
  if (job.status === 'completed') {
    clearInterval(interval);
    window.location.href = `/api/download/${job.outputFilename}`;
  }
}, 2000);
```

### Using Python

```python
import requests
import time

# Upload image
files = {'image': open('page01.jpg', 'rb')}
upload = requests.post('http://localhost:3000/api/upload', files=files)
filename = upload.json()['filename']

# Start restoration
restore = requests.post('http://localhost:3000/api/restore', json={
    'filename': filename,
    'options': {
        'scale': 2,
        'dpi': 300,
        'matteCompensation': 5
    }
})
job_id = restore.json()['jobId']

# Wait for completion
while True:
    status = requests.get(f'http://localhost:3000/api/jobs/{job_id}')
    job = status.json()
    
    if job['status'] == 'completed':
        # Download PDF
        pdf = requests.get(f'http://localhost:3000/api/download/{job["outputFilename"]}')
        with open('output.pdf', 'wb') as f:
            f.write(pdf.content)
        break
    
    time.sleep(2)
```

---

## 🚀 Advanced Usage

### Custom Port

```powershell
$env:PORT=8080; npm run web
```

Or in `.env`:
```
PORT=8080
```

### Running in Background

**Windows (PowerShell):**
```powershell
Start-Process npm -ArgumentList "run web" -WindowStyle Hidden
```

**Using PM2 (recommended):**
```powershell
npm install -g pm2
pm2 start src/server.js --name comic-restore
pm2 save
```

### Accessing from Other Devices

1. Find your local IP:
   ```powershell
   ipconfig
   ```

2. Start server:
   ```powershell
   npm run web
   ```

3. Access from other device:
   ```
   http://YOUR_IP:3000
   ```

⚠️ **Note**: Only works on local network. Not suitable for public internet without security measures.

---

## 📊 Comparison: Web UI vs CLI

| Feature | Web UI | CLI |
|---------|--------|-----|
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Visual Preview** | ✅ Yes | ❌ No |
| **Progress Tracking** | ✅ Real-time | ⚠️ Console output |
| **Batch Processing** | ⚠️ Manual | ✅ Automatic |
| **File Management** | ✅ Download links | ⚠️ Manual |
| **Settings** | ✅ GUI controls | ⚠️ Command flags |
| **Best For** | Single pages, testing | Batch jobs, automation |

**Recommendation:**
- Use **Web UI** for interactive restoration and testing
- Use **CLI** for batch processing and automation

---

## 🎉 Summary

The web interface provides:
- ✅ Easy drag & drop uploads
- ✅ Visual settings controls
- ✅ Real-time progress tracking
- ✅ One-click PDF downloads
- ✅ Modern, responsive design
- ✅ REST API for integration

**Start the server:**
```powershell
npm run web
```

**Open browser:**
```
http://localhost:3000
```

**Start restoring comics!** 📘✨
