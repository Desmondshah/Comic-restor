/**
 * Premium lighting effects for modern comic reprint look
 * Adds depth, dynamic highlights, and subtle shadows
 */

import sharp from "sharp";

/**
 * Apply premium lighting effects for modern reprint variant look
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {Object} options - Lighting options
 * @returns {Promise<Buffer>} Enhanced image buffer
 */
export async function applyPremiumLighting(imageBuffer, options = {}) {
  const {
    // Lighting depth options
    addDepth = true,
    depthStrength = 0.4,           // 0-1, how strong the depth effect
    lightDirection = 'top-left',   // 'top-left', 'top-right', 'top', 'center'
    
    // Dynamic highlights
    addHighlights = true,
    highlightIntensity = 0.3,      // 0-1, brightness of highlights
    highlightThreshold = 200,      // 0-255, brightness threshold for highlights
    
    // Rim lighting (edge highlights)
    addRimLight = true,
    rimLightColor = [255, 240, 200], // Warm rim light RGB
    rimLightStrength = 0.25,       // 0-1
    
    // Ambient occlusion (subtle shadows in recesses)
    addAO = true,
    aoStrength = 0.2,              // 0-1
    
    // Overall adjustments
    contrastBoost = 1.15,          // 1.0 = no change, >1 = more contrast
    vibrance = 1.1,                // 1.0 = no change, >1 = more vibrant
    clarity = 0.3,                 // 0-1, local contrast enhancement
    
    // Cinematic effects
    addVignette = false,           // Subtle darkening at edges
    vignetteStrength = 0.15,
    
    // Preserve original style
    blendMode = 'soft-light',      // How to blend effects: 'soft-light', 'overlay', 'normal'
    effectOpacity = 0.7            // 0-1, overall effect strength
  } = options;

  console.log("Applying premium lighting effects...");
  
  try {
    // Get image metadata
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    // Extract original image data as raw RGBA
    const { data: originalData } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Create working buffer (copy of original)
    const workingData = Buffer.from(originalData);
    const pixelChannels = 4; // RGBA

    // Step 1: Add depth/lighting direction
    if (addDepth) {
      console.log(`  Adding depth lighting (${lightDirection})...`);
      applyDepthLighting(workingData, width, height, lightDirection, depthStrength);
    }

    // Step 2: Add dynamic highlights
    if (addHighlights) {
      console.log(`  Adding dynamic highlights...`);
      addDynamicHighlights(workingData, width, height, highlightIntensity, highlightThreshold);
    }

    // Step 3: Add rim lighting (edge highlights)
    if (addRimLight) {
      console.log(`  Adding rim lighting...`);
      await addRimLighting(workingData, width, height, rimLightColor, rimLightStrength);
    }

    // Step 4: Add ambient occlusion (subtle shadows)
    if (addAO) {
      console.log(`  Adding ambient occlusion...`);
      addAmbientOcclusion(workingData, width, height, aoStrength);
    }

    // Step 5: Apply local clarity enhancement
    if (clarity > 0) {
      console.log(`  Enhancing local clarity...`);
      await enhanceClarity(workingData, width, height, clarity);
    }

    // Step 6: Optional vignette
    if (addVignette) {
      console.log(`  Adding cinematic vignette...`);
      applyVignette(workingData, width, height, vignetteStrength);
    }

    // Convert raw buffer back to image with proper format
    const processedImage = sharp(workingData, {
      raw: {
        width,
        height,
        channels: pixelChannels
      }
    });

    // Apply contrast and vibrance adjustments
    let finalImage = processedImage;
    
    if (contrastBoost !== 1.0 || vibrance !== 1.0) {
      // First convert to a proper image format
      const pngBuffer = await processedImage.png().toBuffer();
      
      finalImage = sharp(pngBuffer)
        .modulate({
          brightness: 1.0,
          saturation: vibrance
        })
        .linear(contrastBoost, -(128 * contrastBoost - 128));
    }

    // Handle effect opacity blending
    if (effectOpacity < 1.0) {
      console.log(`  Blending with original (${Math.round(effectOpacity * 100)}% opacity)...`);
      
      // Get the processed result
      const enhancedBuffer = await finalImage.png().toBuffer();
      
      // Create a composite with opacity
      const blended = await sharp(imageBuffer)
        .composite([{
          input: enhancedBuffer,
          blend: 'over',
          opacity: effectOpacity
        }])
        .toBuffer();
      
      console.log("✓ Premium lighting effects applied");
      return blended;
    }

    console.log("✓ Premium lighting effects applied");
    return await finalImage.toBuffer();

  } catch (error) {
    console.error("❌ Error applying lighting effects:", error.message);
    throw error;
  }
}

/**
 * Apply directional depth lighting
 */
function applyDepthLighting(data, width, height, direction, strength) {
  const pixelChannels = 4;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * pixelChannels;
      
      // Calculate gradient based on direction
      let gradient = 0;
      switch (direction) {
        case 'top-left':
          gradient = ((x + y) / (width + height)) * 2;
          break;
        case 'top-right':
          gradient = ((width - x + y) / (width + height)) * 2;
          break;
        case 'top':
          gradient = y / height;
          break;
        case 'center':
          const centerX = width / 2;
          const centerY = height / 2;
          const distFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
          gradient = distFromCenter / maxDist;
          break;
      }
      
      // Apply lighting factor (brighter at light source, darker away)
      const lightingFactor = 1 + (gradient - 0.5) * strength;
      
      data[idx] = Math.max(0, Math.min(255, data[idx] * lightingFactor));     // R
      data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] * lightingFactor)); // G
      data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] * lightingFactor)); // B
    }
  }
}

/**
 * Add dynamic highlights to bright areas
 */
function addDynamicHighlights(data, width, height, intensity, threshold) {
  const pixelChannels = 4;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * pixelChannels;
      
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Calculate brightness
      const brightness = (r + g + b) / 3;
      
      // Add highlights to bright areas
      if (brightness > threshold) {
        const highlightAmount = ((brightness - threshold) / (255 - threshold)) * intensity;
        const boost = 1 + highlightAmount;
        
        data[idx] = Math.min(255, r * boost);
        data[idx + 1] = Math.min(255, g * boost);
        data[idx + 2] = Math.min(255, b * boost);
      }
    }
  }
}

/**
 * Add rim lighting (edge highlights)
 */
async function addRimLighting(data, width, height, rimColor, strength) {
  const pixelChannels = 4;
  
  // Detect edges using simple Sobel-like filter
  const edges = new Uint8Array(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * pixelChannels;
      
      // Simple edge detection (brightness differences)
      const centerBrightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      let maxDiff = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighborIdx = ((y + dy) * width + (x + dx)) * pixelChannels;
          const neighborBrightness = (data[neighborIdx] + data[neighborIdx + 1] + data[neighborIdx + 2]) / 3;
          const diff = Math.abs(centerBrightness - neighborBrightness);
          maxDiff = Math.max(maxDiff, diff);
        }
      }
      
      edges[y * width + x] = maxDiff;
    }
  }
  
  // Apply rim light to edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * pixelChannels;
      const edgeStrength = edges[y * width + x] / 255;
      
      if (edgeStrength > 0.1) {
        const rimAmount = edgeStrength * strength;
        
        data[idx] = Math.min(255, data[idx] + rimColor[0] * rimAmount);
        data[idx + 1] = Math.min(255, data[idx + 1] + rimColor[1] * rimAmount);
        data[idx + 2] = Math.min(255, data[idx + 2] + rimColor[2] * rimAmount);
      }
    }
  }
}

/**
 * Add ambient occlusion (subtle shadows in recesses)
 */
function addAmbientOcclusion(data, width, height, strength) {
  const pixelChannels = 4;
  const radius = 3; // AO sample radius
  
  const aoMap = new Float32Array(width * height);
  
  // Calculate AO for each pixel
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = (y * width + x) * pixelChannels;
      const centerBrightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      let occlusionSum = 0;
      let samples = 0;
      
      // Sample surrounding pixels
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighborIdx = ((y + dy) * width + (x + dx)) * pixelChannels;
          const neighborBrightness = (data[neighborIdx] + data[neighborIdx + 1] + data[neighborIdx + 2]) / 3;
          
          // If neighbor is brighter, adds occlusion
          if (neighborBrightness > centerBrightness) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            occlusionSum += (neighborBrightness - centerBrightness) / (255 * distance);
          }
          samples++;
        }
      }
      
      aoMap[y * width + x] = Math.min(1, occlusionSum / samples);
    }
  }
  
  // Apply AO darkening
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * pixelChannels;
      const ao = aoMap[y * width + x];
      const darken = 1 - (ao * strength);
      
      data[idx] = Math.max(0, data[idx] * darken);
      data[idx + 1] = Math.max(0, data[idx + 1] * darken);
      data[idx + 2] = Math.max(0, data[idx + 2] * darken);
    }
  }
}

/**
 * Enhance local clarity (unsharp mask variant)
 */
async function enhanceClarity(data, width, height, amount) {
  const pixelChannels = 4;
  const blurred = new Float32Array(width * height * 3);
  
  // Simple box blur for clarity enhancement
  const radius = 2;
  
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * pixelChannels;
          sumR += data[idx];
          sumG += data[idx + 1];
          sumB += data[idx + 2];
          count++;
        }
      }
      
      const blurIdx = (y * width + x) * 3;
      blurred[blurIdx] = sumR / count;
      blurred[blurIdx + 1] = sumG / count;
      blurred[blurIdx + 2] = sumB / count;
    }
  }
  
  // Apply clarity by enhancing difference from blur
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = (y * width + x) * pixelChannels;
      const blurIdx = (y * width + x) * 3;
      
      const diffR = data[idx] - blurred[blurIdx];
      const diffG = data[idx + 1] - blurred[blurIdx + 1];
      const diffB = data[idx + 2] - blurred[blurIdx + 2];
      
      data[idx] = Math.max(0, Math.min(255, data[idx] + diffR * amount));
      data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + diffG * amount));
      data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + diffB * amount));
    }
  }
}

/**
 * Apply cinematic vignette
 */
function applyVignette(data, width, height, strength) {
  const pixelChannels = 4;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * pixelChannels;
      
      const distFromCenter = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      
      // Smooth falloff
      const vignette = 1 - Math.pow(distFromCenter / maxDist, 2) * strength;
      
      data[idx] = Math.max(0, data[idx] * vignette);
      data[idx + 1] = Math.max(0, data[idx + 1] * vignette);
      data[idx + 2] = Math.max(0, data[idx + 2] * vignette);
    }
  }
}

/**
 * Apply preset lighting styles
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {string} preset - Preset name
 * @returns {Promise<Buffer>} Enhanced image buffer
 */
export async function applyLightingPreset(imageBuffer, preset = 'modern-reprint') {
  const presets = {
    'modern-reprint': {
      addDepth: true,
      depthStrength: 0.35,
      lightDirection: 'top-left',
      addHighlights: true,
      highlightIntensity: 0.3,
      addRimLight: true,
      rimLightStrength: 0.25,
      addAO: true,
      aoStrength: 0.2,
      clarity: 0.3,
      contrastBoost: 1.15,
      vibrance: 1.1,
      effectOpacity: 0.7
    },
    'dramatic': {
      addDepth: true,
      depthStrength: 0.6,
      lightDirection: 'top-left',
      addHighlights: true,
      highlightIntensity: 0.5,
      addRimLight: true,
      rimLightStrength: 0.4,
      addAO: true,
      aoStrength: 0.35,
      clarity: 0.5,
      contrastBoost: 1.25,
      vibrance: 1.15,
      addVignette: true,
      vignetteStrength: 0.2,
      effectOpacity: 0.8
    },
    'subtle': {
      addDepth: true,
      depthStrength: 0.2,
      lightDirection: 'top',
      addHighlights: true,
      highlightIntensity: 0.15,
      addRimLight: true,
      rimLightStrength: 0.15,
      addAO: false,
      clarity: 0.2,
      contrastBoost: 1.08,
      vibrance: 1.05,
      effectOpacity: 0.5
    },
    'vintage-enhanced': {
      addDepth: true,
      depthStrength: 0.3,
      lightDirection: 'center',
      addHighlights: false,
      addRimLight: true,
      rimLightColor: [255, 235, 180], // Warm vintage glow
      rimLightStrength: 0.2,
      addAO: true,
      aoStrength: 0.15,
      clarity: 0.25,
      contrastBoost: 1.1,
      vibrance: 0.95,
      addVignette: true,
      vignetteStrength: 0.15,
      effectOpacity: 0.6
    }
  };

  const options = presets[preset] || presets['modern-reprint'];
  return applyPremiumLighting(imageBuffer, options);
}

export default {
  applyPremiumLighting,
  applyLightingPreset
};
