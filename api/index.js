// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from public directory
app.use(express.static('public'));

// Simple in-memory storage for uploaded files (temporary)
// In production, you'd use a proper storage service
const uploads = new Map();
const jobs = new Map();
let uploadCounter = 0;
let jobCounter = 0;

/**
 * POST /api/upload - Upload image via base64
 */
app.post('/api/upload', async (req, res) => {
  try {
    console.log('Upload request received');
    
    const { image, filename } = req.body;
    
    if (!image) {
      console.error('No image data in request body');
      return res.status(400).json({ error: 'No image data provided' });
    }

    console.log('Processing image upload for:', filename);

    // Generate unique ID
    const uploadId = `upload_${++uploadCounter}_${Date.now()}`;
    
    // Store the base64 image data
    uploads.set(uploadId, {
      imageData: image,
      filename: filename || 'upload.jpg',
      uploadedAt: new Date().toISOString()
    });

    console.log('Upload successful:', uploadId);

    res.json({
      success: true,
      filename: filename,
      storageId: uploadId,
      originalName: filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Upload failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/restore - Start restoration job
 */
app.post('/api/restore', async (req, res) => {
  try {
    const { storageId, options = {} } = req.body;

    if (!storageId) {
      return res.status(400).json({ error: 'No storageId provided' });
    }

    // Check if upload exists
    if (!uploads.has(storageId)) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Create job
    const jobId = `job_${++jobCounter}_${Date.now()}`;
    jobs.set(jobId, {
      jobId,
      status: 'pending',
      storageId,
      options,
      progress: 0,
      createdAt: new Date().toISOString()
    });

    // Note: Actual processing would happen in a background worker
    // For now, just return the job ID
    res.json({
      success: true,
      jobId,
      message: 'Restoration job queued'
    });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create restoration job' 
    });
  }
});

/**
 * GET /api/jobs/:id - Get job status
 */
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = jobs.get(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get job status' 
    });
  }
});

/**
 * GET /api/jobs - List all jobs
 */
app.get('/api/jobs', async (req, res) => {
  try {
    const allJobs = Array.from(jobs.values());
    res.json(allJobs);
  } catch (error) {
    console.error('List jobs error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to list jobs' 
    });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stats: {
      uploads: uploads.size,
      jobs: jobs.size
    }
  });
});

export default app;
