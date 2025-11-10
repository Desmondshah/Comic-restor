/**
 * Vercel Serverless API for Comic Restoration
 * Uses Vercel Blob Storage for file handling
 */

import { put } from '@vercel/blob';
import { restorePage } from '../src/restore.js';
import { AIDamageRestoration } from '../src/ai-damage-restoration.js';
import { analyzeQuality, checkPrintReadiness } from '../src/qa-checks.js';
import sharp from 'sharp';

/**
 * Main API handler
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, options = {} } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    console.log('🎨 Starting restoration process...');
    console.log('📥 Input URL:', imageUrl);
    console.log('⚙️  Options:', options);

    // Step 1: Download image from URL
    console.log('📥 Downloading image...');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    let processedBuffer = imageBuffer;
    let metadata = {};

    // Step 2: AI Damage Restoration (if enabled)
    if (options.enableAIRestore) {
      console.log('🤖 Running AI damage restoration...');
      
      const restorer = new AIDamageRestoration();
      const aiOptions = {
        preserveLogo: options.aiPreserveLogo !== false,
        preserveSignature: options.aiPreserveSignature !== false,
        modernStyle: options.aiModernStyle !== false,
        strength: options.aiStrength || 0.8,
      };

      // Process in memory
      processedBuffer = await restorer.restoreDamageBuffer(imageBuffer, aiOptions);
      metadata.aiRestoration = {
        applied: true,
        ...aiOptions
      };
    }

    // Step 3: Upscaling and Enhancement
    console.log('⬆️  Upscaling and enhancing...');
    const restoredBuffer = await restorePage(processedBuffer, {
      scale: options.scale || 2,
      faceEnhance: options.faceEnhance !== false,
      useFaceRestore: options.useFaceRestore !== false,
      extractOCR: options.extractOCR || false,
      applyLighting: options.lightingPreset !== 'none',
      lightingPreset: options.lightingPreset || 'modern-reprint'
    });

    // Step 4: Quality Analysis (if requested)
    if (options.runQA) {
      console.log('🔍 Running quality analysis...');
      metadata.quality = await analyzeQuality(restoredBuffer, imageBuffer);
      
      if (options.checkPrintReadiness) {
        metadata.printCheck = await checkPrintReadiness(restoredBuffer);
      }
    }

    // Step 5: Upload result to Blob Storage
    console.log('☁️  Uploading to blob storage...');
    const filename = `restored/${Date.now()}-restored.jpg`;
    
    const blob = await put(filename, restoredBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Get image dimensions
    const imageInfo = await sharp(restoredBuffer).metadata();

    console.log('✅ Restoration complete!');

    return res.status(200).json({
      success: true,
      outputUrl: blob.url,
      downloadUrl: blob.downloadUrl || blob.url,
      metadata: {
        ...metadata,
        width: imageInfo.width,
        height: imageInfo.height,
        format: imageInfo.format,
        size: restoredBuffer.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Restoration error:', error);
    
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
  maxDuration: 60, // 60 seconds for Hobby plan, up to 300 for Pro
  memory: 1024, // MB
};
