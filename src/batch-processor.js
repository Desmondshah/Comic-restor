/**
 * Batch processor for multiple comic pages
 * Uses queue-based processing to respect API rate limits
 */

import PQueue from "p-queue";
import fs from "node:fs";
import path from "node:path";
import { restorePage } from "./restore.js";
import { createPrintPDF, createMultiPagePDF } from "./pdf-export.js";
import { analyzeQuality, checkPrintReadiness } from "./qa-checks.js";

/**
 * Find all image files in a directory
 * @param {string} dirPath - Directory path
 * @param {Array<string>} extensions - Allowed extensions
 * @returns {Array<string>} Sorted array of image paths
 */
export function findImageFiles(dirPath, extensions = ['.jpg', '.jpeg', '.png', '.tif', '.tiff']) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const files = fs.readdirSync(dirPath)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return extensions.includes(ext);
    })
    .map(file => path.join(dirPath, file))
    .sort(); // Sort alphabetically for correct page order

  return files;
}

/**
 * Find corresponding mask file for an image
 * @param {string} imagePath - Image file path
 * @returns {string|null} Mask path or null
 */
export function findMaskFile(imagePath) {
  const dir = path.dirname(imagePath);
  const base = path.basename(imagePath, path.extname(imagePath));
  
  // Look for common mask naming conventions
  const maskPatterns = [
    `${base}_mask.png`,
    `${base}_mask.jpg`,
    `${base}-mask.png`,
    `${base}.mask.png`,
    `mask_${base}.png`
  ];

  for (const pattern of maskPatterns) {
    const maskPath = path.join(dir, pattern);
    if (fs.existsSync(maskPath)) {
      return maskPath;
    }
  }

  // Check masks subdirectory
  const masksDir = path.join(dir, 'masks');
  if (fs.existsSync(masksDir)) {
    for (const pattern of maskPatterns) {
      const maskPath = path.join(masksDir, pattern);
      if (fs.existsSync(maskPath)) {
        return maskPath;
      }
    }
  }

  return null;
}

/**
 * Process a single page with progress tracking
 * @param {string} inputPath - Input image path
 * @param {string} outputDir - Output directory
 * @param {Object} options - Processing options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Processing result
 */
export async function processSinglePage(inputPath, outputDir, options = {}, onProgress = null) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const startTime = Date.now();

  try {
    if (onProgress) {
      onProgress({
        file: inputPath,
        status: 'processing',
        stage: 'restoration'
      });
    }

    // Find mask if auto-detect enabled
    let maskPath = options.maskPath;
    if (options.autoDetectMask && !maskPath) {
      maskPath = findMaskFile(inputPath);
      if (maskPath) {
        console.log(`  Found mask: ${path.basename(maskPath)}`);
      }
    }

    // Restore the page
    const restoredBuffer = await restorePage(inputPath, {
      maskPath,
      scale: options.scale || 2,
      faceEnhance: options.faceEnhance || false,
      useFaceRestore: options.useFaceRestore || false,
      extractOCR: options.extractOCR || false
    });

    // Quality analysis
    if (options.runQA) {
      if (onProgress) {
        onProgress({
          file: inputPath,
          status: 'processing',
          stage: 'quality-check'
        });
      }

      const originalBuffer = fs.readFileSync(inputPath);
      const qaResults = await analyzeQuality(restoredBuffer, originalBuffer);
      
      if (options.checkPrintReadiness) {
        const printCheck = await checkPrintReadiness(restoredBuffer, {
          minDPI: options.minDPI || 300,
          minSharpness: options.minSharpness || 100
        });

        if (!printCheck.ready) {
          console.warn(`  ⚠️  Print readiness warnings for ${filename}:`);
          printCheck.warnings.forEach(w => console.warn(`    ${w}`));
        }
      }
    }

    // Export to PDF
    if (onProgress) {
      onProgress({
        file: inputPath,
        status: 'processing',
        stage: 'pdf-export'
      });
    }

    const outputPath = path.join(outputDir, `${filename}_restored.pdf`);
    await createPrintPDF(restoredBuffer, outputPath, {
      widthIn: options.widthIn || 6.625,
      heightIn: options.heightIn || 10.25,
      dpi: options.dpi || 300,
      bleedIn: options.bleedIn || 0.125,
      matteCompensation: options.matteCompensation || 5,
      title: `${filename} - Restored`,
      author: options.author || ""
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (onProgress) {
      onProgress({
        file: inputPath,
        status: 'completed',
        outputPath,
        duration
      });
    }

    return {
      success: true,
      inputPath,
      outputPath,
      duration
    };

  } catch (error) {
    console.error(`✗ Error processing ${filename}:`, error.message);

    if (onProgress) {
      onProgress({
        file: inputPath,
        status: 'failed',
        error: error.message
      });
    }

    return {
      success: false,
      inputPath,
      error: error.message
    };
  }
}

/**
 * Batch process multiple pages with queue
 * @param {Array<string>} inputPaths - Array of input paths
 * @param {string} outputDir - Output directory
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Batch results
 */
export async function batchProcess(inputPaths, outputDir, options = {}) {
  const {
    concurrency = 1,  // Process sequentially by default (API rate limits)
    createSinglePDF = false,
    onProgress = null
  } = options;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📚 Batch Processing: ${inputPaths.length} pages`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create queue
  const queue = new PQueue({ concurrency });

  const results = {
    total: inputPaths.length,
    completed: 0,
    failed: 0,
    startTime: Date.now(),
    pages: []
  };

  // Track progress
  const progressCallback = (update) => {
    if (update.status === 'completed') {
      results.completed++;
      console.log(`✓ [${results.completed}/${results.total}] ${path.basename(update.file)} (${update.duration}s)`);
    } else if (update.status === 'failed') {
      results.failed++;
      console.error(`✗ [${results.completed + results.failed}/${results.total}] ${path.basename(update.file)} - ${update.error}`);
    }

    if (onProgress) {
      onProgress({
        ...update,
        progress: {
          completed: results.completed,
          failed: results.failed,
          total: results.total
        }
      });
    }
  };

  // Add all tasks to queue
  const tasks = inputPaths.map(inputPath =>
    queue.add(() => processSinglePage(inputPath, outputDir, options, progressCallback))
  );

  // Wait for all tasks to complete
  const pageResults = await Promise.all(tasks);
  results.pages = pageResults;

  const totalDuration = ((Date.now() - results.startTime) / 1000).toFixed(1);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✓ Batch Complete: ${results.completed} succeeded, ${results.failed} failed (${totalDuration}s)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Optionally combine into single PDF
  if (createSinglePDF && results.completed > 0) {
    console.log("Creating combined PDF...");

    const successfulBuffers = [];
    for (const result of pageResults) {
      if (result.success) {
        // Re-process to get buffer (we could optimize by storing buffers)
        const buffer = await restorePage(result.inputPath, options);
        successfulBuffers.push(buffer);
      }
    }

    if (successfulBuffers.length > 0) {
      const combinedPath = path.join(outputDir, 'combined_restored.pdf');
      await createMultiPagePDF(successfulBuffers, combinedPath, {
        widthIn: options.widthIn || 6.625,
        heightIn: options.heightIn || 10.25,
        dpi: options.dpi || 300,
        bleedIn: options.bleedIn || 0.125,
        matteCompensation: options.matteCompensation || 5,
        title: options.title || "Restored Comic Book",
        author: options.author || ""
      });

      results.combinedPDF = combinedPath;
    }
  }

  return results;
}

/**
 * Process directory of images
 * @param {string} inputDir - Input directory
 * @param {string} outputDir - Output directory
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Batch results
 */
export async function processDirectory(inputDir, outputDir, options = {}) {
  console.log(`Scanning directory: ${inputDir}`);
  
  const imageFiles = findImageFiles(inputDir);
  
  if (imageFiles.length === 0) {
    throw new Error(`No image files found in ${inputDir}`);
  }

  console.log(`Found ${imageFiles.length} image files`);

  return await batchProcess(imageFiles, outputDir, {
    ...options,
    autoDetectMask: true  // Enable auto mask detection in batch mode
  });
}

export default {
  findImageFiles,
  findMaskFile,
  processSinglePage,
  batchProcess,
  processDirectory
};
