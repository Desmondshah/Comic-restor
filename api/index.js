// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from public directory
app.use(express.static('public'));

// Initialize Convex client
const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
let convex;
if (convexUrl) {
  convex = new ConvexHttpClient(convexUrl);
}

/**
 * POST /api/upload - Upload image via base64
 */
app.post('/api/upload', async (req, res) => {
  try {
    console.log('Upload request received');
    
    if (!convex) {
      return res.status(500).json({ 
        error: 'Convex not configured. Please set CONVEX_URL environment variable.' 
      });
    }

    const { image, filename } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Image should be base64 encoded
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Store in Convex
    const result = await convex.mutation(api.restoration.uploadImage, {
      imageData: base64Data,
      filename: filename || 'upload.jpg'
    });

    res.json({
      success: true,
      filename: result.filename,
      storageId: result.storageId,
      originalName: filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Upload failed' 
    });
  }
});

/**
 * POST /api/restore - Start restoration job
 */
app.post('/api/restore', async (req, res) => {
  try {
    if (!convex) {
      return res.status(500).json({ 
        error: 'Convex not configured' 
      });
    }

    const { storageId, options = {} } = req.body;

    if (!storageId) {
      return res.status(400).json({ error: 'No storageId provided' });
    }

    // Create restoration job in Convex
    const jobId = await convex.mutation(api.restoration.createJob, {
      storageId,
      options
    });

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
    if (!convex) {
      return res.status(500).json({ error: 'Convex not configured' });
    }

    const job = await convex.query(api.restoration.getJob, {
      jobId: req.params.id
    });

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
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    convexConfigured: !!convex
  });
});

export default app;
