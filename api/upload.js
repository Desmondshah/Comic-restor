/**
 * Upload endpoint for Vercel Blob Storage
 * Handles file uploads and returns blob URL
 */

import { put } from '@vercel/blob';

/**
 * Handle file upload
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if blob storage is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: 'Blob storage not configured',
        message: 'Please set BLOB_READ_WRITE_TOKEN environment variable'
      });
    }

    // Parse multipart form data (Vercel handles this automatically)
    const contentType = req.headers['content-type'] || '';
    
    let fileBuffer;
    let filename;

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form upload
      // Note: For production, you might want to use a library like 'formidable' or 'busboy'
      return res.status(400).json({
        error: 'Use base64 upload instead',
        message: 'Send file as base64 in JSON body: { "file": "base64string", "filename": "image.jpg" }'
      });
    } else if (contentType.includes('application/json')) {
      // Handle base64 encoded file
      const { file, filename: fname } = req.body;
      
      if (!file || !fname) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please provide both "file" (base64) and "filename"'
        });
      }

      // Decode base64
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
      filename = fname;
    } else {
      return res.status(400).json({
        error: 'Unsupported content type',
        message: 'Use application/json with base64 encoded file'
      });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileBuffer.length > maxSize) {
      return res.status(400).json({
        error: 'File too large',
        message: `Maximum file size is 50MB, got ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // Validate file type
    const allowedTypes = ['jpg', 'jpeg', 'png', 'tiff', 'tif'];
    const ext = filename.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: `Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const blobFilename = `uploads/${timestamp}-${random}-${filename}`;

    console.log(`📤 Uploading file: ${filename} (${(fileBuffer.length / 1024).toFixed(2)}KB)`);

    // Upload to Blob Storage
    const blob = await put(blobFilename, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`✅ Upload complete: ${blob.url}`);

    return res.status(200).json({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl || blob.url,
      pathname: blob.pathname,
      size: fileBuffer.length,
      filename: filename
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Vercel serverless config
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  maxDuration: 30,
};
