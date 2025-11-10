/**
 * Vercel Blob Storage Integration
 * Handles file uploads and storage for comic restoration
 */

import { put, del, list } from '@vercel/blob';

/**
 * Upload file buffer to Vercel Blob Storage
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} filename - Desired filename (with path prefix)
 * @param {Object} options - Additional options
 * @returns {Promise<{url: string, pathname: string, downloadUrl: string}>}
 */
export async function uploadToBlob(fileBuffer, filename, options = {}) {
  try {
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      ...options
    });
    
    console.log(`✅ Uploaded to blob: ${blob.pathname}`);
    
    return {
      url: blob.url,
      pathname: blob.pathname,
      downloadUrl: blob.downloadUrl || blob.url
    };
  } catch (error) {
    console.error('❌ Blob upload error:', error);
    throw new Error(`Failed to upload to blob storage: ${error.message}`);
  }
}

/**
 * Delete file from Vercel Blob Storage
 * @param {string} url - Blob URL to delete
 */
export async function deleteFromBlob(url) {
  try {
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    console.log(`🗑️  Deleted from blob: ${url}`);
  } catch (error) {
    console.error('❌ Blob delete error:', error);
    throw new Error(`Failed to delete from blob storage: ${error.message}`);
  }
}

/**
 * Delete multiple files from blob storage
 * @param {string[]} urls - Array of blob URLs to delete
 */
export async function deleteManyFromBlob(urls) {
  const results = await Promise.allSettled(
    urls.map(url => deleteFromBlob(url))
  );
  
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`⚠️  Failed to delete ${failed.length} files`);
  }
  
  return {
    total: urls.length,
    succeeded: results.filter(r => r.status === 'fulfilled').length,
    failed: failed.length
  };
}

/**
 * List all files in blob storage
 * @param {string} prefix - Optional prefix to filter files
 * @param {Object} options - Additional list options
 * @returns {Promise<Array>} Array of blob objects
 */
export async function listBlobFiles(prefix = '', options = {}) {
  try {
    const { blobs } = await list({
      prefix,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      ...options
    });
    
    return blobs;
  } catch (error) {
    console.error('❌ Blob list error:', error);
    throw new Error(`Failed to list blob files: ${error.message}`);
  }
}

/**
 * Cleanup old files from blob storage
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 24 hours)
 * @param {string} prefix - Optional prefix to filter files
 * @returns {Promise<{deleted: number, errors: number}>}
 */
export async function cleanupOldFiles(maxAgeMs = 24 * 60 * 60 * 1000, prefix = '') {
  try {
    const blobs = await listBlobFiles(prefix);
    const now = Date.now();
    
    const oldBlobs = blobs.filter(blob => {
      const uploadTime = new Date(blob.uploadedAt).getTime();
      return now - uploadTime > maxAgeMs;
    });
    
    console.log(`🧹 Found ${oldBlobs.length} old files to cleanup`);
    
    if (oldBlobs.length === 0) {
      return { deleted: 0, errors: 0 };
    }
    
    const result = await deleteManyFromBlob(oldBlobs.map(b => b.url));
    
    console.log(`✅ Cleanup complete: ${result.succeeded} deleted, ${result.failed} errors`);
    
    return {
      deleted: result.succeeded,
      errors: result.failed
    };
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    throw new Error(`Failed to cleanup old files: ${error.message}`);
  }
}

/**
 * Download file from blob storage as buffer
 * @param {string} url - Blob URL to download
 * @returns {Promise<Buffer>}
 */
export async function downloadFromBlob(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('❌ Blob download error:', error);
    throw new Error(`Failed to download from blob: ${error.message}`);
  }
}

/**
 * Check if blob storage is configured
 * @returns {boolean}
 */
export function isBlobConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Generate a unique filename with timestamp
 * @param {string} originalName - Original filename
 * @param {string} prefix - Path prefix (e.g., 'uploads', 'output')
 * @returns {string}
 */
export function generateBlobFilename(originalName, prefix = 'uploads') {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = originalName.split('.').pop();
  const basename = originalName.replace(/\.[^/.]+$/, '');
  
  return `${prefix}/${timestamp}-${random}-${basename}.${ext}`;
}

export default {
  uploadToBlob,
  deleteFromBlob,
  deleteManyFromBlob,
  listBlobFiles,
  cleanupOldFiles,
  downloadFromBlob,
  isBlobConfigured,
  generateBlobFilename
};
