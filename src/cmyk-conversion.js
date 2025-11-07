/**
 * CMYK Conversion & Prepress Module
 * Handles color space conversion with TAC limits for print on matte stock
 * 
 * Features:
 * - RGB to CMYK conversion with GCR (Gray Component Replacement)
 * - TAC (Total Area Coverage) limiting (280-300%)
 * - UCR (Under Color Removal) for cleaner neutrals
 * - Rich black handling
 * - Dot gain compensation for matte stock
 * - Black point preservation
 */

/**
 * Convert RGB to CMYK with GCR
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @param {Object} options - Conversion options
 * @returns {Object} CMYK values (0-100)
 */
export function rgbToCmyk(r, g, b, options = {}) {
  const {
    gcrStrength = 0.8,     // GCR strength (0-1, higher = more K)
    ucrAmount = 0.3,       // UCR amount for cleaner neutrals
    tacLimit = 300,        // Total Area Coverage limit (280-340%)
    blackStart = 0.0,      // Black generation start point (0-1)
    blackWidth = 1.0,      // Black generation curve width
    maxBlack = 1.0         // Maximum black generation (0-1)
  } = options;

  // Normalize RGB to 0-1
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Basic CMY conversion
  let c = 1 - rNorm;
  let m = 1 - gNorm;
  let y = 1 - bNorm;

  // Calculate black (K) using minimum CMY
  const minCMY = Math.min(c, m, y);
  
  // Black generation with curve
  let k = 0;
  if (minCMY > blackStart) {
    const blackRange = minCMY - blackStart;
    k = Math.pow(blackRange / blackWidth, 0.8) * gcrStrength * maxBlack;
    k = Math.min(k, minCMY, maxBlack);
  }

  // Under Color Removal (UCR)
  const ucr = k * ucrAmount;
  c = Math.max(0, c - ucr);
  m = Math.max(0, m - ucr);
  y = Math.max(0, y - ucr);

  // Gray Component Replacement (GCR)
  const gcr = k * gcrStrength;
  c = Math.max(0, c - gcr);
  m = Math.max(0, m - gcr);
  y = Math.max(0, y - gcr);

  // Ensure black is at least the GCR amount
  k = Math.max(k, minCMY * gcrStrength);

  // TAC limiting
  let currentTAC = (c + m + y + k) * 100;
  if (currentTAC > tacLimit) {
    const scale = tacLimit / currentTAC;
    c *= scale;
    m *= scale;
    y *= scale;
    k *= scale;
  }

  // Convert to percentage (0-100)
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
    tac: Math.round((c + m + y + k) * 100)
  };
}

/**
 * Convert CMYK back to RGB (for preview)
 * @param {number} c - Cyan (0-100)
 * @param {number} m - Magenta (0-100)
 * @param {number} y - Yellow (0-100)
 * @param {number} k - Black (0-100)
 * @returns {Object} RGB values (0-255)
 */
export function cmykToRgb(c, m, y, k) {
  // Normalize to 0-1
  const cNorm = c / 100;
  const mNorm = m / 100;
  const yNorm = y / 100;
  const kNorm = k / 100;

  // Standard CMYK to RGB conversion
  const r = 255 * (1 - cNorm) * (1 - kNorm);
  const g = 255 * (1 - mNorm) * (1 - kNorm);
  const b = 255 * (1 - yNorm) * (1 - kNorm);

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b)
  };
}

/**
 * Detect if a pixel is pure text/line art (should be 100% K)
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @param {Object} options - Detection options
 * @returns {boolean} True if pixel is line art
 */
export function isLineArt(r, g, b, options = {}) {
  const {
    threshold = 30,          // Darkness threshold
    neutralityThreshold = 10 // How neutral must it be
  } = options;

  const brightness = (r + g + b) / 3;
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

  // Dark and neutral = likely line art
  return brightness < threshold && maxDiff < neutralityThreshold;
}

/**
 * Create rich black for large fills
 * @param {number} k - Current black value (0-100)
 * @param {Object} options - Rich black options
 * @returns {Object} CMYK values for rich black
 */
export function createRichBlack(k, options = {}) {
  const {
    cSupport = 60,    // Cyan support
    mSupport = 40,    // Magenta support
    ySupport = 40,    // Yellow support
    minK = 80         // Only apply to dark blacks
  } = options;

  if (k < minK) {
    return { c: 0, m: 0, y: 0, k };
  }

  // Scale support based on K value
  const scale = (k - minK) / (100 - minK);

  return {
    c: Math.round(cSupport * scale),
    m: Math.round(mSupport * scale),
    y: Math.round(ySupport * scale),
    k: Math.round(k)
  };
}

/**
 * Apply dot gain compensation for matte stock
 * @param {number} value - CMYK channel value (0-100)
 * @param {Object} options - Dot gain options
 * @returns {number} Compensated value
 */
export function compensateDotGain(value, options = {}) {
  const {
    gainAmount = 15,     // Expected dot gain % on matte (10-20%)
    compensationCurve = 0.5  // Compensation curve strength
  } = options;

  // Normalize to 0-1
  const norm = value / 100;

  // Dot gain is typically maximum at 50% and minimal at extremes
  const gainCurve = Math.sin(norm * Math.PI);
  const expectedGain = gainAmount * gainCurve * compensationCurve / 100;

  // Pre-compensate by reducing the value
  const compensated = norm - expectedGain;

  // Convert back to 0-100
  return Math.round(Math.max(0, Math.min(100, compensated * 100)));
}

/**
 * Convert RGB image buffer to CMYK with full prepress options
 * @param {Buffer} imageBuffer - RGB image buffer
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} CMYK channel buffers and metadata
 */
export async function convertToCmyk(imageBuffer, options = {}) {
  const {
    gcrStrength = 0.8,
    tacLimit = 300,
    applyRichBlack = true,
    forceLineArtToK = true,
    compensateDotGainValue = true,
    dotGainAmount = 15,
    renderingIntent = 'relative'  // 'relative', 'perceptual', 'saturation', 'absolute'
  } = options;

  console.log(`Converting to CMYK: GCR=${gcrStrength}, TAC≤${tacLimit}%`);

  const sharp = (await import('sharp')).default;
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixelCount = width * height;

  // Create separate buffers for CMYK channels
  const cChannel = new Uint8Array(pixelCount);
  const mChannel = new Uint8Array(pixelCount);
  const yChannel = new Uint8Array(pixelCount);
  const kChannel = new Uint8Array(pixelCount);

  let maxTAC = 0;
  let avgTAC = 0;
  let lineArtPixels = 0;
  let richBlackPixels = 0;

  for (let i = 0, pixelIdx = 0; i < data.length; i += channels, pixelIdx++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check if this is line art (force to 100% K)
    if (forceLineArtToK && isLineArt(r, g, b)) {
      cChannel[pixelIdx] = 0;
      mChannel[pixelIdx] = 0;
      yChannel[pixelIdx] = 0;
      kChannel[pixelIdx] = 100;
      lineArtPixels++;
      continue;
    }

    // Convert to CMYK
    let cmyk = rgbToCmyk(r, g, b, { gcrStrength, tacLimit });

    // Apply rich black for large dark areas
    if (applyRichBlack && cmyk.k >= 80) {
      const richBlack = createRichBlack(cmyk.k);
      cmyk = richBlack;
      richBlackPixels++;
    }

    // Apply dot gain compensation
    if (compensateDotGainValue) {
      cmyk.c = compensateDotGain(cmyk.c, { gainAmount: dotGainAmount });
      cmyk.m = compensateDotGain(cmyk.m, { gainAmount: dotGainAmount });
      cmyk.y = compensateDotGain(cmyk.y, { gainAmount: dotGainAmount });
      cmyk.k = compensateDotGain(cmyk.k, { gainAmount: dotGainAmount });
    }

    // Store in channel buffers (scale back to 0-255 for storage)
    cChannel[pixelIdx] = Math.round(cmyk.c * 2.55);
    mChannel[pixelIdx] = Math.round(cmyk.m * 2.55);
    yChannel[pixelIdx] = Math.round(cmyk.y * 2.55);
    kChannel[pixelIdx] = Math.round(cmyk.k * 2.55);

    // Track TAC statistics
    const tac = cmyk.c + cmyk.m + cmyk.y + cmyk.k;
    maxTAC = Math.max(maxTAC, tac);
    avgTAC += tac;
  }

  avgTAC /= pixelCount;

  console.log(`CMYK conversion complete:`);
  console.log(`  Max TAC: ${maxTAC.toFixed(1)}% (limit: ${tacLimit}%)`);
  console.log(`  Avg TAC: ${avgTAC.toFixed(1)}%`);
  console.log(`  Line art pixels: ${lineArtPixels} (${(lineArtPixels / pixelCount * 100).toFixed(2)}%)`);
  console.log(`  Rich black pixels: ${richBlackPixels} (${(richBlackPixels / pixelCount * 100).toFixed(2)}%)`);

  return {
    channels: {
      c: cChannel,
      m: mChannel,
      y: yChannel,
      k: kChannel
    },
    metadata: {
      width,
      height,
      maxTAC,
      avgTAC,
      tacLimit,
      gcrStrength,
      lineArtPixels,
      richBlackPixels
    }
  };
}

/**
 * Convert CMYK back to RGB for preview/export
 * @param {Object} cmykData - CMYK channel data from convertToCmyk
 * @returns {Promise<Buffer>} RGB image buffer
 */
export async function cmykToRgbBuffer(cmykData) {
  const { channels, metadata } = cmykData;
  const { width, height } = metadata;
  const { c, m, y, k } = channels;

  const sharp = (await import('sharp')).default;
  const pixelCount = width * height;
  const rgbData = new Uint8Array(pixelCount * 3);

  for (let i = 0; i < pixelCount; i++) {
    // Convert from 0-255 storage back to 0-100 percentage
    const cVal = c[i] / 2.55;
    const mVal = m[i] / 2.55;
    const yVal = y[i] / 2.55;
    const kVal = k[i] / 2.55;

    const rgb = cmykToRgb(cVal, mVal, yVal, kVal);

    rgbData[i * 3] = rgb.r;
    rgbData[i * 3 + 1] = rgb.g;
    rgbData[i * 3 + 2] = rgb.b;
  }

  return sharp(rgbData, {
    raw: { width, height, channels: 3 }
  }).png().toBuffer();
}

/**
 * Export CMYK channels as separate grayscale images (for inspection)
 * @param {Object} cmykData - CMYK channel data
 * @param {string} outputPath - Base output path (without extension)
 * @returns {Promise<void>}
 */
export async function exportCmykChannels(cmykData, outputPath) {
  const sharp = (await import('sharp')).default;
  const { channels, metadata } = cmykData;
  const { width, height } = metadata;

  const channelNames = ['c', 'm', 'y', 'k'];
  const channelLabels = ['Cyan', 'Magenta', 'Yellow', 'Black'];

  for (let i = 0; i < channelNames.length; i++) {
    const name = channelNames[i];
    const label = channelLabels[i];
    const channelData = channels[name];

    const outputFile = `${outputPath}_${name}.png`;
    
    await sharp(channelData, {
      raw: { width, height, channels: 1 }
    })
      .grayscale()
      .toFile(outputFile);

    console.log(`  ${label} channel: ${outputFile}`);
  }
}

/**
 * Analyze CMYK separation quality
 * @param {Object} cmykData - CMYK channel data
 * @returns {Object} Quality analysis
 */
export function analyzeCmykQuality(cmykData) {
  const { channels, metadata } = cmykData;
  const { c, m, y, k } = channels;
  const pixelCount = c.length;

  let neutralPixels = 0;
  let colorPixels = 0;
  let totalInk = 0;
  let problematicTAC = 0;

  for (let i = 0; i < pixelCount; i++) {
    const cVal = c[i] / 2.55;
    const mVal = m[i] / 2.55;
    const yVal = y[i] / 2.55;
    const kVal = k[i] / 2.55;

    const tac = cVal + mVal + yVal + kVal;
    totalInk += tac;

    if (tac > metadata.tacLimit) {
      problematicTAC++;
    }

    // Check if pixel is neutral (using mostly K)
    const cmyTotal = cVal + mVal + yVal;
    if (kVal > 0 && cmyTotal < kVal * 0.3) {
      neutralPixels++;
    } else if (cmyTotal > 10) {
      colorPixels++;
    }
  }

  const avgInk = totalInk / pixelCount;

  return {
    neutralPixels,
    colorPixels,
    avgInkCoverage: avgInk,
    problematicTACPixels: problematicTAC,
    problematicTACPercentage: (problematicTAC / pixelCount * 100).toFixed(3),
    gcrEfficiency: (neutralPixels / pixelCount * 100).toFixed(2),
    warnings: []
  };
}

// Export all functions
export default {
  rgbToCmyk,
  cmykToRgb,
  isLineArt,
  createRichBlack,
  compensateDotGain,
  convertToCmyk,
  cmykToRgbBuffer,
  exportCmykChannels,
  analyzeCmykQuality
};
