/**
 * Quality Assurance checks for comic restoration
 * Includes histogram clipping detection and SSIM metrics
 */

import sharp from "sharp";

/**
 * Check for histogram clipping (blown highlights or crushed shadows)
 * @param {Buffer} imageBuffer - Image buffer to check
 * @param {number} threshold - Clipping threshold (0.01 = 1%)
 * @returns {Promise<Object>} Clipping analysis
 */
export async function checkHistogramClipping(imageBuffer, threshold = 0.01) {
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalPixels = info.width * info.height;
  const channels = info.channels;

  let whitePixels = 0;
  let blackPixels = 0;

  // Count near-white (>250) and near-black (<5) pixels
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const avg = (r + g + b) / 3;

    if (avg > 250) whitePixels++;
    if (avg < 5) blackPixels++;
  }

  const whiteClipping = whitePixels / totalPixels;
  const blackClipping = blackPixels / totalPixels;

  const result = {
    whiteClipping,
    blackClipping,
    hasClipping: whiteClipping > threshold || blackClipping > threshold,
    warnings: []
  };

  if (whiteClipping > threshold) {
    result.warnings.push(
      `⚠️  Highlight clipping detected: ${(whiteClipping * 100).toFixed(2)}% of pixels are blown out`
    );
  }

  if (blackClipping > threshold) {
    result.warnings.push(
      `⚠️  Shadow clipping detected: ${(blackClipping * 100).toFixed(2)}% of pixels are crushed`
    );
  }

  return result;
}

/**
 * Calculate image sharpness using Laplacian variance
 * Higher values = sharper image
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<number>} Sharpness score
 */
export async function calculateSharpness(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  // Simple Laplacian operator
  let variance = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const center = data[idx];
      const neighbors = [
        data[idx - width],     // top
        data[idx + width],     // bottom
        data[idx - 1],         // left
        data[idx + 1],         // right
      ];

      const laplacian = 4 * center - neighbors.reduce((a, b) => a + b, 0);
      variance += laplacian * laplacian;
      count++;
    }
  }

  return variance / count;
}

/**
 * Simple SSIM calculation between two images
 * (Structural Similarity Index - 1.0 = identical, 0.0 = completely different)
 * @param {Buffer} imageBuffer1 - First image
 * @param {Buffer} imageBuffer2 - Second image
 * @returns {Promise<number>} SSIM score (0-1)
 */
export async function calculateSSIM(imageBuffer1, imageBuffer2) {
  // Resize both images to same dimensions for comparison
  const size = { width: 512, height: 512 };
  
  const [data1, data2] = await Promise.all([
    sharp(imageBuffer1).resize(size).greyscale().raw().toBuffer(),
    sharp(imageBuffer2).resize(size).greyscale().raw().toBuffer()
  ]);

  const pixels = size.width * size.height;

  // Calculate means
  let mean1 = 0, mean2 = 0;
  for (let i = 0; i < pixels; i++) {
    mean1 += data1[i];
    mean2 += data2[i];
  }
  mean1 /= pixels;
  mean2 /= pixels;

  // Calculate variances and covariance
  let var1 = 0, var2 = 0, covar = 0;
  for (let i = 0; i < pixels; i++) {
    const diff1 = data1[i] - mean1;
    const diff2 = data2[i] - mean2;
    var1 += diff1 * diff1;
    var2 += diff2 * diff2;
    covar += diff1 * diff2;
  }
  var1 /= pixels;
  var2 /= pixels;
  covar /= pixels;

  // SSIM formula with constants
  const c1 = 6.5025; // (0.01 * 255)^2
  const c2 = 58.5225; // (0.03 * 255)^2

  const numerator = (2 * mean1 * mean2 + c1) * (2 * covar + c2);
  const denominator = (mean1 * mean1 + mean2 * mean2 + c1) * (var1 + var2 + c2);

  return numerator / denominator;
}

/**
 * Calculate perceptual difference (simplified LPIPS-style metric)
 * Lower values = more similar
 * @param {Buffer} imageBuffer1 - First image
 * @param {Buffer} imageBuffer2 - Second image
 * @returns {Promise<number>} Perceptual distance
 */
export async function calculatePerceptualDiff(imageBuffer1, imageBuffer2) {
  // Resize for comparison
  const size = { width: 256, height: 256 };
  
  const [data1, data2] = await Promise.all([
    sharp(imageBuffer1).resize(size).raw().toBuffer(),
    sharp(imageBuffer2).resize(size).raw().toBuffer()
  ]);

  let diff = 0;
  for (let i = 0; i < data1.length; i++) {
    const d = (data1[i] - data2[i]) / 255;
    diff += d * d;
  }

  return Math.sqrt(diff / (size.width * size.height * 3));
}

/**
 * Analyze image quality metrics
 * @param {Buffer} imageBuffer - Image to analyze
 * @param {Buffer} originalBuffer - Original for comparison (optional)
 * @returns {Promise<Object>} Quality metrics
 */
export async function analyzeQuality(imageBuffer, originalBuffer = null) {
  console.log("Running quality analysis...");

  const metrics = {
    sharpness: await calculateSharpness(imageBuffer),
    clipping: await checkHistogramClipping(imageBuffer)
  };

  if (originalBuffer) {
    metrics.ssim = await calculateSSIM(originalBuffer, imageBuffer);
    metrics.perceptualDiff = await calculatePerceptualDiff(originalBuffer, imageBuffer);
    
    console.log(`SSIM Score: ${metrics.ssim.toFixed(4)} (higher = more similar)`);
    console.log(`Perceptual Diff: ${metrics.perceptualDiff.toFixed(4)} (lower = more similar)`);
  }

  console.log(`Sharpness: ${metrics.sharpness.toFixed(2)}`);

  if (metrics.clipping.hasClipping) {
    metrics.clipping.warnings.forEach(w => console.log(w));
  } else {
    console.log("✓ No histogram clipping detected");
  }

  return metrics;
}

/**
 * Check if image meets print quality standards
 * @param {Buffer} imageBuffer - Image to check
 * @param {Object} requirements - Print requirements
 * @returns {Promise<Object>} Print readiness check
 */
export async function checkPrintReadiness(imageBuffer, requirements = {}) {
  const {
    minDPI = 300,
    minSharpness = 100,
    maxClipping = 0.01
  } = requirements;

  const metadata = await sharp(imageBuffer).metadata();
  const sharpness = await calculateSharpness(imageBuffer);
  const clipping = await checkHistogramClipping(imageBuffer, maxClipping);

  const dpi = metadata.density || 72;
  
  const checks = {
    dpi: {
      value: dpi,
      pass: dpi >= minDPI,
      message: dpi >= minDPI 
        ? `✓ Resolution: ${dpi} DPI` 
        : `✗ Resolution too low: ${dpi} DPI (need ${minDPI})`
    },
    sharpness: {
      value: sharpness,
      pass: sharpness >= minSharpness,
      message: sharpness >= minSharpness
        ? `✓ Sharpness: ${sharpness.toFixed(2)}`
        : `✗ Image may be blurry: ${sharpness.toFixed(2)} (need ${minSharpness})`
    },
    clipping: {
      value: clipping,
      pass: !clipping.hasClipping,
      message: clipping.hasClipping
        ? `✗ Clipping detected`
        : `✓ No clipping detected`
    }
  };

  const allPass = Object.values(checks).every(c => c.pass);

  return {
    ready: allPass,
    checks,
    warnings: [
      ...checks.dpi.pass ? [] : [checks.dpi.message],
      ...checks.sharpness.pass ? [] : [checks.sharpness.message],
      ...checks.clipping.pass ? [] : [checks.clipping.message],
      ...clipping.warnings
    ]
  };
}

/**
 * Calculate edge density to detect oversharpening
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<number>} Edge density score
 */
export async function calculateEdgeDensity(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  let edgePixels = 0;
  const threshold = 30; // Edge detection threshold

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const center = data[idx];
      
      // Sobel-like edge detection
      const gx = Math.abs(
        -data[idx - 1 - width] + data[idx + 1 - width] +
        -2 * data[idx - 1] + 2 * data[idx + 1] +
        -data[idx - 1 + width] + data[idx + 1 + width]
      );
      
      const gy = Math.abs(
        -data[idx - width - 1] - 2 * data[idx - width] - data[idx - width + 1] +
        data[idx + width - 1] + 2 * data[idx + width] + data[idx + width + 1]
      );
      
      const gradient = Math.sqrt(gx * gx + gy * gy);
      
      if (gradient > threshold) {
        edgePixels++;
      }
    }
  }

  const totalPixels = (width - 2) * (height - 2);
  return edgePixels / totalPixels;
}

/**
 * Calculate perceptual hash for outlier detection
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<string>} Perceptual hash string
 */
export async function calculatePerceptualHash(imageBuffer) {
  // Resize to 8x8 for hash
  const { data } = await sharp(imageBuffer)
    .resize(8, 8, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Calculate average brightness
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const avg = sum / data.length;

  // Create hash: 1 if pixel > avg, 0 otherwise
  let hash = '';
  for (let i = 0; i < data.length; i++) {
    hash += data[i] > avg ? '1' : '0';
  }

  // Convert binary to hex
  let hexHash = '';
  for (let i = 0; i < hash.length; i += 4) {
    const nibble = hash.substr(i, 4);
    hexHash += parseInt(nibble, 2).toString(16);
  }

  return hexHash;
}

/**
 * Calculate Hamming distance between two hashes
 * @param {string} hash1 - First hash
 * @param {string} hash2 - Second hash
 * @returns {number} Hamming distance
 */
export function hammingDistance(hash1, hash2) {
  if (hash1.length !== hash2.length) {
    throw new Error("Hashes must be same length");
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const xor = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16);
    distance += xor.toString(2).split('1').length - 1;
  }

  return distance;
}

/**
 * Detect weird tints using color distribution analysis
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} Tint analysis
 */
export async function detectColorTint(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixelCount = width * height;

  let rSum = 0, gSum = 0, bSum = 0;
  let rVar = 0, gVar = 0, bVar = 0;

  // Calculate means
  for (let i = 0; i < data.length; i += channels) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }

  const rMean = rSum / pixelCount;
  const gMean = gSum / pixelCount;
  const bMean = bSum / pixelCount;

  // Calculate variances
  for (let i = 0; i < data.length; i += channels) {
    rVar += Math.pow(data[i] - rMean, 2);
    gVar += Math.pow(data[i + 1] - gMean, 2);
    bVar += Math.pow(data[i + 2] - bMean, 2);
  }

  rVar /= pixelCount;
  gVar /= pixelCount;
  bVar /= pixelCount;

  // Detect tints based on channel imbalance
  const avgMean = (rMean + gMean + bMean) / 3;
  const redTint = rMean - avgMean;
  const greenTint = gMean - avgMean;
  const blueTint = bMean - avgMean;

  const warnings = [];
  const tintThreshold = 10;

  if (Math.abs(redTint) > tintThreshold) {
    warnings.push(`${redTint > 0 ? 'Red' : 'Cyan'} tint detected: ${Math.abs(redTint).toFixed(1)}`);
  }
  if (Math.abs(greenTint) > tintThreshold) {
    warnings.push(`${greenTint > 0 ? 'Green' : 'Magenta'} tint detected: ${Math.abs(greenTint).toFixed(1)}`);
  }
  if (Math.abs(blueTint) > tintThreshold) {
    warnings.push(`${blueTint > 0 ? 'Blue' : 'Yellow'} tint detected: ${Math.abs(blueTint).toFixed(1)}`);
  }

  return {
    channelMeans: { r: rMean, g: gMean, b: bMean },
    channelVariances: { r: rVar, g: gVar, b: bVar },
    tints: { red: redTint, green: greenTint, blue: blueTint },
    hasTint: warnings.length > 0,
    warnings
  };
}

/**
 * Check text balloon contrast for readability
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Contrast check options
 * @returns {Promise<Object>} Contrast analysis
 */
export async function checkTextContrast(imageBuffer, options = {}) {
  const {
    minContrast = 7.0,  // WCAG AAA standard
    sampleSize = 100    // Number of sample points
  } = options;

  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Sample random points and calculate local contrast
  let contrastSum = 0;
  let lowContrastCount = 0;
  const samples = [];

  for (let i = 0; i < sampleSize; i++) {
    const x = Math.floor(Math.random() * (width - 20)) + 10;
    const y = Math.floor(Math.random() * (height - 20)) + 10;
    const centerIdx = (y * width + x) * channels;

    // Get center pixel luminance
    const centerR = data[centerIdx];
    const centerG = data[centerIdx + 1];
    const centerB = data[centerIdx + 2];
    const centerLum = 0.2126 * centerR + 0.7152 * centerG + 0.0722 * centerB;

    // Sample neighborhood
    let minLum = centerLum;
    let maxLum = centerLum;

    for (let dy = -5; dy <= 5; dy += 2) {
      for (let dx = -5; dx <= 5; dx += 2) {
        const idx = ((y + dy) * width + (x + dx)) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        
        minLum = Math.min(minLum, lum);
        maxLum = Math.max(maxLum, lum);
      }
    }

    // Calculate contrast ratio
    const lighter = Math.max(minLum, maxLum) + 0.05;
    const darker = Math.min(minLum, maxLum) + 0.05;
    const contrast = lighter / darker;

    samples.push(contrast);
    contrastSum += contrast;

    if (contrast < minContrast) {
      lowContrastCount++;
    }
  }

  const avgContrast = contrastSum / sampleSize;
  const lowContrastPercent = (lowContrastCount / sampleSize) * 100;

  return {
    avgContrast,
    minContrast,
    lowContrastPercent,
    passed: lowContrastPercent < 20, // Allow up to 20% low contrast areas
    warnings: lowContrastPercent >= 20 
      ? [`⚠️  ${lowContrastPercent.toFixed(1)}% of sampled areas have low contrast (<${minContrast}:1)`]
      : []
  };
}

/**
 * Comprehensive QA check with all automated tests
 * @param {Buffer} imageBuffer - Image to check
 * @param {Buffer} originalBuffer - Original image for comparison (optional)
 * @param {Object} options - QA options
 * @returns {Promise<Object>} Complete QA report
 */
export async function runFullQA(imageBuffer, originalBuffer = null, options = {}) {
  const {
    checkClipping = true,
    clippingThreshold = 0.005,  // 0.5%
    checkSSIM = true,
    minSSIM = 0.92,
    checkEdges = true,
    maxEdgeDensity = 0.25,      // Warn if >25% edges (oversharpened)
    checkTint = true,
    checkContrast = true
  } = options;

  console.log("\n" + "=".repeat(60));
  console.log("Running comprehensive QA checks...");
  console.log("=".repeat(60));

  const results = {
    passed: true,
    warnings: [],
    errors: [],
    metrics: {}
  };

  try {
    // 1. Histogram clipping check
    if (checkClipping) {
      console.log("\n1. Checking histogram clipping...");
      const clipping = await checkHistogramClipping(imageBuffer, clippingThreshold);
      results.metrics.clipping = clipping;
      
      if (clipping.hasClipping) {
        results.warnings.push(...clipping.warnings);
        console.log(`   ⚠️  Clipping detected!`);
      } else {
        console.log(`   ✓ No clipping (white: ${(clipping.whiteClipping * 100).toFixed(3)}%, black: ${(clipping.blackClipping * 100).toFixed(3)}%)`);
      }
    }

    // 2. SSIM check (if original provided)
    if (checkSSIM && originalBuffer) {
      console.log("\n2. Checking structural similarity (SSIM)...");
      const ssim = await calculateSSIM(originalBuffer, imageBuffer);
      results.metrics.ssim = ssim;
      
      if (ssim < minSSIM) {
        results.warnings.push(`⚠️  SSIM score too low: ${ssim.toFixed(4)} (minimum: ${minSSIM})`);
        console.log(`   ⚠️  SSIM: ${ssim.toFixed(4)} - image may be overprocessed`);
      } else {
        console.log(`   ✓ SSIM: ${ssim.toFixed(4)} - good similarity to original`);
      }
    }

    // 3. Edge density check
    if (checkEdges) {
      console.log("\n3. Checking edge density (oversharpening)...");
      const edgeDensity = await calculateEdgeDensity(imageBuffer);
      results.metrics.edgeDensity = edgeDensity;
      
      if (edgeDensity > maxEdgeDensity) {
        results.warnings.push(`⚠️  High edge density: ${(edgeDensity * 100).toFixed(2)}% - possible oversharpening`);
        console.log(`   ⚠️  Edge density: ${(edgeDensity * 100).toFixed(2)}% (threshold: ${(maxEdgeDensity * 100).toFixed(0)}%)`);
      } else {
        console.log(`   ✓ Edge density: ${(edgeDensity * 100).toFixed(2)}% - looks good`);
      }
    }

    // 4. Color tint detection
    if (checkTint) {
      console.log("\n4. Checking for color tints...");
      const tint = await detectColorTint(imageBuffer);
      results.metrics.tint = tint;
      
      if (tint.hasTint) {
        results.warnings.push(...tint.warnings);
        tint.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
      } else {
        console.log(`   ✓ No significant color tints detected`);
      }
    }

    // 5. Text contrast check
    if (checkContrast) {
      console.log("\n5. Checking text readability contrast...");
      const contrast = await checkTextContrast(imageBuffer);
      results.metrics.contrast = contrast;
      
      if (!contrast.passed) {
        results.warnings.push(...contrast.warnings);
        console.log(`   ⚠️  Average contrast: ${contrast.avgContrast.toFixed(2)}:1`);
      } else {
        console.log(`   ✓ Average contrast: ${contrast.avgContrast.toFixed(2)}:1 - good readability`);
      }
    }

    // 6. Perceptual hash (for batch processing outlier detection)
    console.log("\n6. Generating perceptual hash...");
    const pHash = await calculatePerceptualHash(imageBuffer);
    results.metrics.perceptualHash = pHash;
    console.log(`   Hash: ${pHash}`);

    // 7. Sharpness check
    console.log("\n7. Checking sharpness...");
    const sharpness = await calculateSharpness(imageBuffer);
    results.metrics.sharpness = sharpness;
    console.log(`   Sharpness score: ${sharpness.toFixed(2)}`);

    // Set overall pass/fail
    results.passed = results.errors.length === 0;

    // Summary
    console.log("\n" + "=".repeat(60));
    if (results.passed) {
      console.log("✓ QA CHECK PASSED");
    } else {
      console.log("✗ QA CHECK FAILED");
    }
    
    if (results.warnings.length > 0) {
      console.log(`\n${results.warnings.length} warning(s):`);
      results.warnings.forEach(w => console.log(`  ${w}`));
    } else {
      console.log("No warnings!");
    }
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    results.passed = false;
    results.errors.push(`QA check error: ${error.message}`);
    console.error("QA check failed:", error);
  }

  return results;
}

export default {
  checkHistogramClipping,
  calculateSharpness,
  calculateSSIM,
  calculatePerceptualDiff,
  analyzeQuality,
  checkPrintReadiness,
  calculateEdgeDensity,
  calculatePerceptualHash,
  hammingDistance,
  detectColorTint,
  checkTextContrast,
  runFullQA
};
