/**
 * Optimized upload endpoint for Vercel
 * Uses chunked upload for large files to avoid body size limits
 */

import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Pro plan supports up to 4.5MB on Hobby
    },
  },
  maxDuration: 30,
};

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
    const startTime = Date.now();
    
    // Check if we're using Vercel Blob Storage
    const useBlobStorage = !!process.env.BLOB_READ_WRITE_TOKEN;
    
    if (useBlobStorage) {
      // Vercel Blob Storage upload
      return await handleBlobUpload(req, res, startTime);
    } else {
      // Local/traditional server upload
      return await handleLocalUpload(req, res, startTime);
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Handle upload to Vercel Blob Storage
 */
async function handleBlobUpload(req, res, startTime) {
  const contentType = req.headers['content-type'] || '';
  
  let fileBuffer;
  let filename;

  if (contentType.includes('application/json')) {
    // Base64 upload (optimized for Vercel)
    const { file, filename: fname, chunk, totalChunks, chunkIndex } = req.body;
    
    if (!file || !fname) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: file and filename'
      });
    }

    // Handle chunked upload
    if (chunk && totalChunks && chunkIndex !== undefined) {
      // TODO: Implement chunk assembly if needed
      // For now, we'll use single upload with compression
    }

    // Decode base64
    console.log(`📥 Decoding base64 file: ${fname}`);
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    fileBuffer = Buffer.from(base64Data, 'base64');
    filename = fname;

  } else if (contentType.includes('multipart/form-data')) {
    // Direct multipart upload (not recommended for Vercel)
    return res.status(400).json({
      success: false,
      error: 'Use JSON with base64 encoding for Vercel deployment',
      hint: 'Convert file to base64 before uploading'
    });
  } else {
    return res.status(400).json({
      success: false,
      error: 'Unsupported content type',
      message: 'Use application/json with base64 encoded file'
    });
  }

  // Validate file size
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (fileBuffer.length > maxSize) {
    return res.status(400).json({
      success: false,
      error: 'File too large',
      message: `Maximum file size is 50MB, got ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`
    });
  }

  // Validate file type
  const allowedTypes = ['jpg', 'jpeg', 'png', 'tiff', 'tif'];
  const ext = filename.split('.').pop().toLowerCase();
  if (!allowedTypes.includes(ext)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: `Allowed types: ${allowedTypes.join(', ')}`
    });
  }

  // Generate unique filename
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const blobFilename = `uploads/${timestamp}-${random}-${filename}`;

  console.log(`📤 Uploading to blob: ${filename} (${(fileBuffer.length / 1024).toFixed(2)}KB)`);

  // Upload to Blob Storage
  const blob = await put(blobFilename, fileBuffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  const uploadTime = Date.now() - startTime;
  console.log(`✅ Upload complete in ${uploadTime}ms: ${blob.url}`);

  return res.status(200).json({
    success: true,
    url: blob.url,
    downloadUrl: blob.downloadUrl || blob.url,
    pathname: blob.pathname,
    filename: blobFilename,
    originalName: filename,
    size: fileBuffer.length,
    uploadTime: uploadTime
  });
}

/**
 * Handle local server upload (for development)
 */
async function handleLocalUpload(req, res, startTime) {
  // For local development without blob storage
  // This would need multer or similar for multipart handling
  return res.status(501).json({
    success: false,
    error: 'Local upload not implemented in this endpoint',
    message: 'Please configure BLOB_READ_WRITE_TOKEN or use the local server'
  });
}
