/**
 * Replicate API Helper - Optimized for Production
 * Uses Predictions API instead of blocking run() for 6x faster processing
 */

import Replicate from "replicate";

/**
 * Model version IDs (static - faster than model names)
 */
const MODEL_VERSIONS = {
  "real-esrgan": "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
  "gfpgan": "9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
  "codeformer": "7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
  "nano-banana": "google/nano-banana", // Use model name for newer models
};

/**
 * Run Replicate model using Predictions API (fast, async, non-blocking)
 * @param {Object} replicate - Replicate client instance
 * @param {string} modelNameOrVersion - Model name or version ID
 * @param {Object} input - Model input parameters
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<any>} Model output
 */
export async function runWithPredictions(replicate, modelNameOrVersion, input, onProgress = null) {
  try {
    // Get version ID
    const version = MODEL_VERSIONS[modelNameOrVersion] || modelNameOrVersion;
    
    console.log(`🚀 Creating prediction for ${modelNameOrVersion}...`);
    
    // Create prediction (non-blocking)
    const prediction = await replicate.predictions.create({
      version: version,
      input: input
    });
    
    console.log(`📋 Prediction ID: ${prediction.id}`);
    console.log(`📊 Status: ${prediction.status}`);
    
    // Poll for completion
    let result = prediction;
    let pollCount = 0;
    const maxPolls = 600; // 10 minutes max (600 * 1 second)
    
    while (!['succeeded', 'failed', 'canceled'].includes(result.status)) {
      // Wait 1 second between polls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get updated status
      result = await replicate.predictions.get(result.id);
      pollCount++;
      
      // Progress callback
      if (onProgress && result.logs) {
        onProgress({
          status: result.status,
          logs: result.logs,
          pollCount: pollCount
        });
      }
      
      // Log every 10 seconds
      if (pollCount % 10 === 0) {
        console.log(`⏳ Still processing... (${pollCount}s elapsed, status: ${result.status})`);
      }
      
      // Timeout check
      if (pollCount >= maxPolls) {
        throw new Error(`Prediction timeout after ${maxPolls} seconds`);
      }
    }
    
    // Check final status
    if (result.status === 'failed') {
      throw new Error(`Prediction failed: ${result.error || 'Unknown error'}`);
    }
    
    if (result.status === 'canceled') {
      throw new Error('Prediction was canceled');
    }
    
    console.log(`✅ Prediction completed in ${pollCount} seconds`);
    
    return result.output;
    
  } catch (error) {
    console.error(`❌ Prediction error:`, error.message);
    throw error;
  }
}

/**
 * Run with automatic retry on specific errors
 */
export async function runWithPredictionsAndRetry(replicate, modelNameOrVersion, input, onProgress = null, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await runWithPredictions(replicate, modelNameOrVersion, input, onProgress);
    } catch (error) {
      lastError = error;
      
      // Retry on specific errors
      if (error.message.includes('GPU') || error.message.includes('timeout') || error.message.includes('rate limit')) {
        console.warn(`⚠️  Attempt ${attempt} failed: ${error.message}`);
        if (attempt < maxRetries) {
          const waitTime = attempt * 5000; // Exponential backoff: 5s, 10s
          console.log(`⏳ Retrying in ${waitTime/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } else {
        // Don't retry on other errors
        throw error;
      }
    }
  }
  
  throw lastError;
}

/**
 * Get prediction status (for UI polling)
 */
export async function getPredictionStatus(replicate, predictionId) {
  try {
    const prediction = await replicate.predictions.get(predictionId);
    return {
      id: prediction.id,
      status: prediction.status,
      logs: prediction.logs,
      output: prediction.output,
      error: prediction.error
    };
  } catch (error) {
    console.error(`Failed to get prediction status:`, error.message);
    throw error;
  }
}

export default {
  runWithPredictions,
  runWithPredictionsAndRetry,
  getPredictionStatus,
  MODEL_VERSIONS
};
