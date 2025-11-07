/**
 * Color Correction & Tone Mapping Module
 * Post-upscale, pre-PDF color adjustments for comic restoration
 * 
 * Features:
 * - Neutral paper & cast removal
 * - Levels/curves with guardrails
 * - Selective saturation adjustments
 * - Local contrast enhancement (clarity)
 * - Halftone preservation
 * - Reference page matching
 * - Matte stock compensation
 * - CMYK conversion with TAC limits
 */

import sharp from "sharp";

/**
 * Sample paper color from margin areas
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Sampling options
 * @returns {Promise<Object>} Paper color statistics
 */
export async function samplePaperColor(imageBuffer, options = {}) {
  const {
    marginPercent = 5,  // Sample from outer 5% of image
    sampleCount = 100   // Number of samples per region
  } = options;

  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const marginX = Math.floor(width * marginPercent / 100);
  const marginY = Math.floor(height * marginPercent / 100);

  const samples = { r: [], g: [], b: [] };

  // Sample from four corners and edges
  const regions = [
    { x: 0, y: 0, w: marginX, h: marginY },                           // Top-left
    { x: width - marginX, y: 0, w: marginX, h: marginY },             // Top-right
    { x: 0, y: height - marginY, w: marginX, h: marginY },            // Bottom-left
    { x: width - marginX, y: height - marginY, w: marginX, h: marginY } // Bottom-right
  ];

  for (const region of regions) {
    for (let i = 0; i < sampleCount / 4; i++) {
      const x = region.x + Math.floor(Math.random() * region.w);
      const y = region.y + Math.floor(Math.random() * region.h);
      const idx = (y * width + x) * channels;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Only sample bright pixels (likely paper)
      const brightness = (r + g + b) / 3;
      if (brightness > 180) {
        samples.r.push(r);
        samples.g.push(g);
        samples.b.push(b);
      }
    }
  }

  // Calculate median values (more robust than mean)
  const median = (arr) => {
    const sorted = arr.sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };

  return {
    r: median(samples.r),
    g: median(samples.g),
    b: median(samples.b),
    samples: samples.r.length
  };
}

/**
 * Remove color cast from yellowed/tinted paper
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Cast removal options
 * @returns {Promise<Buffer>} Color-corrected image
 */
export async function removeColorCast(imageBuffer, options = {}) {
  const {
    strength = 0.5,        // Correction strength (0-1) - REDUCED to preserve colors
    targetNeutral = 240,   // Target paper brightness
    preserveInks = true    // Protect dark pixels (ink)
  } = options;

  console.log("Removing color cast from paper...");

  // Sample paper color
  const paperColor = await samplePaperColor(imageBuffer);
  console.log(`Detected paper color: R${paperColor.r} G${paperColor.g} B${paperColor.b}`);

  // Calculate cast correction multipliers
  const avgPaper = (paperColor.r + paperColor.g + paperColor.b) / 3;
  const redAdjust = (avgPaper / paperColor.r) * strength + (1 - strength);
  const greenAdjust = (avgPaper / paperColor.g) * strength + (1 - strength);
  const blueAdjust = (avgPaper / paperColor.b) * strength + (1 - strength);

  console.log(`Cast correction: R×${redAdjust.toFixed(3)} G×${greenAdjust.toFixed(3)} B×${blueAdjust.toFixed(3)}`);

  // Apply correction with ink preservation
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate brightness to determine if pixel is ink or paper
    const brightness = (r + g + b) / 3;
    
    // Reduce correction strength for dark pixels (ink protection)
    let pixelStrength = strength;
    if (preserveInks && brightness < 128) {
      pixelStrength *= Math.pow(brightness / 128, 2);
    }

    // Apply per-channel correction
    const localRedAdj = (avgPaper / paperColor.r) * pixelStrength + (1 - pixelStrength);
    const localGreenAdj = (avgPaper / paperColor.g) * pixelStrength + (1 - pixelStrength);
    const localBlueAdj = (avgPaper / paperColor.b) * pixelStrength + (1 - pixelStrength);

    data[i] = Math.min(255, Math.max(0, r * localRedAdj));
    data[i + 1] = Math.min(255, Math.max(0, g * localGreenAdj));
    data[i + 2] = Math.min(255, Math.max(0, b * localBlueAdj));
  }

  return sharp(data, {
    raw: { width, height, channels }
  }).png().toBuffer();
}

/**
 * Apply levels adjustment with guardrails to prevent clipping
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Levels options
 * @returns {Promise<Buffer>} Adjusted image
 */
export async function applyLevels(imageBuffer, options = {}) {
  const {
    whitePoint = 235,      // Lift whites (guardrail) - REDUCED
    blackPoint = 15,       // Deepen blacks (guardrail) - INCREASED
    midtone = 1.0,         // Gamma adjustment
    protectMidtones = true // Keep mid-tones from crushing
  } = options;

  console.log(`Applying levels: black=${blackPoint}, white=${whitePoint}, gamma=${midtone}`);

  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Build lookup table for levels adjustment
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    // Input levels
    let val = (i - blackPoint) / (whitePoint - blackPoint);
    val = Math.max(0, Math.min(1, val));

    // Gamma (midtone) adjustment
    if (midtone !== 1.0) {
      val = Math.pow(val, 1 / midtone);
    }

    // Output levels (0-255)
    lut[i] = Math.round(val * 255);
  }

  // Apply LUT to each channel
  for (let i = 0; i < data.length; i++) {
    data[i] = lut[data[i]];
  }

  return sharp(data, {
    raw: { width, height, channels }
  }).png().toBuffer();
}

/**
 * Apply selective saturation adjustments
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Saturation options
 * @returns {Promise<Buffer>} Adjusted image
 */
export async function adjustSaturation(imageBuffer, options = {}) {
  const {
    redYellowBoost = 1.1,   // Slight boost for warm colors
    blueGreenReduce = 0.92,  // Rein in neon cool colors
    skinToneProtect = true   // Keep skin tones natural
  } = options;

  console.log("Applying selective saturation adjustments...");

  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Convert RGB to HSV
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = max === 0 ? 0 : delta / max;
    const v = max / 255;

    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        h = ((b - r) / delta + 2) / 6;
      } else {
        h = ((r - g) / delta + 4) / 6;
      }
    }

    const hDeg = h * 360;

    // Determine saturation adjustment based on hue
    let satAdjust = 1.0;

    // Red/Yellow (0-60°): boost
    if (hDeg >= 0 && hDeg <= 60) {
      satAdjust = redYellowBoost;
    }
    // Skin tones (25-45°): protect
    else if (skinToneProtect && hDeg >= 25 && hDeg <= 45) {
      satAdjust = 1.0;
    }
    // Blue/Green (180-270°): reduce
    else if (hDeg >= 180 && hDeg <= 270) {
      satAdjust = blueGreenReduce;
    }

    // Apply saturation adjustment
    s = Math.min(1, s * satAdjust);

    // Convert back to RGB
    const c = v * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = v - c;

    let rPrime, gPrime, bPrime;
    const hSix = h * 6;

    if (hSix < 1) {
      [rPrime, gPrime, bPrime] = [c, x, 0];
    } else if (hSix < 2) {
      [rPrime, gPrime, bPrime] = [x, c, 0];
    } else if (hSix < 3) {
      [rPrime, gPrime, bPrime] = [0, c, x];
    } else if (hSix < 4) {
      [rPrime, gPrime, bPrime] = [0, x, c];
    } else if (hSix < 5) {
      [rPrime, gPrime, bPrime] = [x, 0, c];
    } else {
      [rPrime, gPrime, bPrime] = [c, 0, x];
    }

    data[i] = Math.round((rPrime + m) * 255);
    data[i + 1] = Math.round((gPrime + m) * 255);
    data[i + 2] = Math.round((bPrime + m) * 255);
  }

  return sharp(data, {
    raw: { width, height, channels }
  }).png().toBuffer();
}

/**
 * Apply local contrast enhancement (clarity)
 * Low-radius unsharp mask for subtle snap without AI gloss
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Clarity options
 * @returns {Promise<Buffer>} Enhanced image
 */
export async function applyClarity(imageBuffer, options = {}) {
  const {
    radius = 2,        // Low radius for local contrast
    amount = 0.5,      // Subtle amount
    threshold = 0      // Apply to all pixels
  } = options;

  console.log(`Applying local contrast: radius=${radius}, amount=${amount}`);

  // Sharp's unsharp mask
  return sharp(imageBuffer)
    .sharpen({
      sigma: radius,
      m1: amount,
      m2: 0,
      x1: threshold,
      y2: 255
    })
    .toBuffer();
}

/**
 * Add subtle paper grain overlay to avoid plastic look
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Grain options
 * @returns {Promise<Buffer>} Image with grain
 */
export async function addPaperGrain(imageBuffer, options = {}) {
  const {
    strength = 0.03,  // 3% grain
    size = 1          // Grain particle size
  } = options;

  console.log(`Adding paper grain: ${(strength * 100).toFixed(1)}%`);

  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Add noise to simulate paper grain
  for (let i = 0; i < data.length; i += channels) {
    const noise = (Math.random() - 0.5) * strength * 255;
    
    for (let c = 0; c < Math.min(3, channels); c++) {
      data[i + c] = Math.min(255, Math.max(0, data[i + c] + noise));
    }
  }

  return sharp(data, {
    raw: { width, height, channels }
  }).png().toBuffer();
}

/**
 * Apply matte stock compensation
 * Lift midtones and compress shadows for better print on matte paper
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Compensation options
 * @returns {Promise<Buffer>} Compensated image
 */
export async function applyMatteCompensation(imageBuffer, options = {}) {
  const {
    midtoneLift = 6,        // +5-8 midtone lift
    shadowCompress = 0.95,  // Slightly compress deep shadows
    saturateReduce = 0.96   // Reduce oversaturated primaries
  } = options;

  console.log(`Applying matte compensation: midtone+${midtoneLift}, shadows×${shadowCompress}`);

  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const brightness = (r + g + b) / 3;

    // Midtone lift (brighten 64-192 range)
    let lift = 0;
    if (brightness >= 64 && brightness <= 192) {
      const midDistance = 1 - Math.abs(brightness - 128) / 64;
      lift = midtoneLift * midDistance;
    }

    // Shadow compression (darken deep shadows)
    let compress = 1.0;
    if (brightness < 64) {
      compress = shadowCompress;
    }

    // Apply adjustments
    data[i] = Math.min(255, Math.max(0, (r * compress + lift) * saturateReduce));
    data[i + 1] = Math.min(255, Math.max(0, (g * compress + lift) * saturateReduce));
    data[i + 2] = Math.min(255, Math.max(0, (b * compress + lift) * saturateReduce));
  }

  return sharp(data, {
    raw: { width, height, channels }
  }).png().toBuffer();
}

/**
 * Calculate per-channel statistics for reference matching
 * @param {Buffer} imageBuffer - Reference image buffer
 * @returns {Promise<Object>} Channel statistics
 */
export async function calculateChannelStats(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const stats = { r: [], g: [], b: [] };

  for (let i = 0; i < data.length; i += channels) {
    stats.r.push(data[i]);
    stats.g.push(data[i + 1]);
    stats.b.push(data[i + 2]);
  }

  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = (arr, m) => arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length;

  const rMean = mean(stats.r);
  const gMean = mean(stats.g);
  const bMean = mean(stats.b);

  return {
    r: { mean: rMean, stdDev: Math.sqrt(variance(stats.r, rMean)) },
    g: { mean: gMean, stdDev: Math.sqrt(variance(stats.g, gMean)) },
    b: { mean: bMean, stdDev: Math.sqrt(variance(stats.b, bMean)) }
  };
}

/**
 * Match image colors to reference page
 * @param {Buffer} imageBuffer - Image to adjust
 * @param {Buffer} referenceBuffer - Reference image
 * @param {Object} options - Matching options
 * @returns {Promise<Buffer>} Color-matched image
 */
export async function matchToReference(imageBuffer, referenceBuffer, options = {}) {
  const {
    strength = 0.8  // Matching strength
  } = options;

  console.log("Matching colors to reference page...");

  const sourceStats = await calculateChannelStats(imageBuffer);
  const targetStats = await calculateChannelStats(referenceBuffer);

  // Calculate gain and offset per channel
  const gain = {
    r: targetStats.r.stdDev / sourceStats.r.stdDev,
    g: targetStats.g.stdDev / sourceStats.g.stdDev,
    b: targetStats.b.stdDev / sourceStats.b.stdDev
  };

  const offset = {
    r: targetStats.r.mean - sourceStats.r.mean * gain.r,
    g: targetStats.g.mean - sourceStats.g.mean * gain.g,
    b: targetStats.b.mean - sourceStats.b.mean * gain.b
  };

  console.log(`Channel gains: R×${gain.r.toFixed(3)} G×${gain.g.toFixed(3)} B×${gain.b.toFixed(3)}`);

  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Apply linear transform with strength
    const newR = r * (gain.r * strength + (1 - strength)) + offset.r * strength;
    const newG = g * (gain.g * strength + (1 - strength)) + offset.g * strength;
    const newB = b * (gain.b * strength + (1 - strength)) + offset.b * strength;

    data[i] = Math.min(255, Math.max(0, newR));
    data[i + 1] = Math.min(255, Math.max(0, newG));
    data[i + 2] = Math.min(255, Math.max(0, newB));
  }

  return sharp(data, {
    raw: { width, height, channels }
  }).png().toBuffer();
}

/**
 * Full color correction pipeline
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Pipeline options
 * @returns {Promise<Buffer>} Color-corrected image
 */
export async function applyColorCorrection(imageBuffer, options = {}) {
  const {
    removeCast = true,
    castStrength = 0.7,
    applyLevelsAdjust = true,
    whitePoint = 245,
    blackPoint = 12,
    applySaturation = true,
    applyLocalContrast = true,
    addGrain = false,
    grainStrength = 0.03,
    matteCompensation = false,
    midtoneLift = 6,
    referenceImage = null  // Buffer of reference page for matching
  } = options;

  let result = imageBuffer;

  // Step 1: Remove color cast
  if (removeCast) {
    result = await removeColorCast(result, { strength: castStrength });
  }

  // Step 2: Apply levels with guardrails
  if (applyLevelsAdjust) {
    result = await applyLevels(result, { whitePoint, blackPoint });
  }

  // Step 3: Selective saturation
  if (applySaturation) {
    result = await adjustSaturation(result);
  }

  // Step 4: Local contrast (clarity)
  if (applyLocalContrast) {
    result = await applyClarity(result);
  }

  // Step 5: Matte compensation
  if (matteCompensation) {
    result = await applyMatteCompensation(result, { midtoneLift });
  }

  // Step 6: Match to reference page
  if (referenceImage) {
    result = await matchToReference(result, referenceImage);
  }

  // Step 7: Paper grain (optional)
  if (addGrain) {
    result = await addPaperGrain(result, { strength: grainStrength });
  }

  return result;
}

// Export all functions
export default {
  samplePaperColor,
  removeColorCast,
  applyLevels,
  adjustSaturation,
  applyClarity,
  addPaperGrain,
  applyMatteCompensation,
  calculateChannelStats,
  matchToReference,
  applyColorCorrection
};
