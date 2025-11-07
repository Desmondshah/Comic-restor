/**
 * Core comic restoration functions using Replicate API
 * Handles upscaling, inpainting, face restoration, and OCR
 */

import Replicate from "replicate";
import fs from "node:fs";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "url";

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment from project root
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Validate API token
if (!process.env.REPLICATE_API_TOKEN) {
  console.error("❌ REPLICATE_API_TOKEN not found!");
  console.error("   Add your token to .env file:");
  console.error("   REPLICATE_API_TOKEN=r8_your_token_here");
}

// Initialize Replicate client
const replicate = new Replicate({ 
  auth: process.env.REPLICATE_API_TOKEN 
});

/**
 * Upscale and clean artifacts using Real-ESRGAN
 * @param {string|Buffer} input - File path or buffer
 * @param {Object} options - Upscaling options
 * @returns {Promise<Buffer>} Upscaled image buffer
 */
export async function upscale(input, options = {}) {
  const {
    scale = 2,           // 2x is usually enough for print
    faceEnhance = false  // Keep false for stylized comic art
  } = options;

  // Read input as buffer
  const imageBuffer = Buffer.isBuffer(input) 
    ? input 
    : fs.readFileSync(input);
  
  const base64Image = imageBuffer.toString("base64");

  console.log(`Upscaling with Real-ESRGAN (scale: ${scale}x)...`);
  
  try {
    const output = await replicate.run(
      "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
      {
        input: {
          image: `data:image/jpeg;base64,${base64Image}`,
          scale: scale,
          face_enhance: faceEnhance
        }
      }
    );

    // Handle output URL or base64
    let resultBuffer;
    if (typeof output === 'string' && output.startsWith('http')) {
      const response = await fetch(output);
      resultBuffer = Buffer.from(await response.arrayBuffer());
    } else if (typeof output === 'string' && output.includes('base64')) {
      resultBuffer = Buffer.from(output.split(",")[1], "base64");
    } else {
      throw new Error("Unexpected output format from Real-ESRGAN");
    }

    // Import sharp dynamically to ensure proper format
    const sharp = (await import('sharp')).default;
    
    // Ensure the buffer is in a valid format Sharp can work with
    try {
      return await sharp(resultBuffer).png().toBuffer();
    } catch (formatError) {
      console.error("Error converting upscaled image:", formatError.message);
      // If conversion fails, return original buffer
      return resultBuffer;
    }
  } catch (error) {
    console.error("Upscale error:", error.message);
    throw error;
  }
}

/**
 * Inpaint scratches/tears using available models
 * Only use on damaged areas with a mask
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Buffer} maskBuffer - Mask buffer (white = inpaint)
 * @returns {Promise<Buffer>} Inpainted image buffer
 */
export async function inpaint(imageBuffer, maskBuffer) {
  console.log("⚠️  Inpainting is currently disabled - Replicate models unavailable");
  console.log("    Returning original image. Consider using external tools for damage removal.");
  
  // For now, just return the original image
  // User can use Photoshop/GIMP for inpainting, then upload the result
  return imageBuffer;
}

/**
 * Restore faces using GFPGAN
 * Use sparingly on stylized comic art - only for realistic faces
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Face restoration options
 * @returns {Promise<Buffer>} Enhanced image buffer
 */
export async function faceRestore(imageBuffer, options = {}) {
  const {
    version = "v1.4",
    rescale = 1.0
  } = options;

  const imageB64 = imageBuffer.toString("base64");

  console.log("Restoring faces with GFPGAN (use sparingly!)...");
  
  try {
    const output = await replicate.run(
      "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
      {
        input: {
          img: `data:image/png;base64,${imageB64}`,
          version: version,
          scale: rescale
        }
      }
    );

    // Handle output URL or base64
    if (typeof output === 'string' && output.startsWith('http')) {
      const response = await fetch(output);
      return Buffer.from(await response.arrayBuffer());
    } else if (typeof output === 'string' && output.includes('base64')) {
      return Buffer.from(output.split(",")[1], "base64");
    }
    
    throw new Error("Unexpected output format from GFPGAN");
  } catch (error) {
    console.error("Face restore error:", error.message);
    throw error;
  }
}

/**
 * Extract text from comic balloons using OCR
 * Useful for re-typesetting unreadable text with vintage fonts
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<string>} Extracted text
 */
export async function extractText(imageBuffer) {
  const imageB64 = imageBuffer.toString("base64");

  console.log("Extracting text with OCR...");
  
  try {
    const output = await replicate.run(
      "abiruyt/text-extract-ocr:4e6e0e0b399e1f6f75c319523c9c53a6c3f6ab89fb5e9a49287b8890a63a4b83",
      {
        input: {
          image: `data:image/png;base64,${imageB64}`
        }
      }
    );

    return output || "";
  } catch (error) {
    console.error("OCR error:", error.message);
    return "";
  }
}

/**
 * Alternative OCR using Marker (better for complex layouts)
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} Structured text data
 */
export async function extractTextMarker(imageBuffer) {
  const imageB64 = imageBuffer.toString("base64");

  console.log("Extracting text with Marker OCR...");
  
  try {
    const output = await replicate.run(
      "datalab-to/ocr:9da5085f0733d86c4b0af55b8d5ad686e7b2ad2780f35a5d0ac39bb9e3c4dc68",
      {
        input: {
          image: `data:image/png;base64,${imageB64}`
        }
      }
    );

    return output;
  } catch (error) {
    console.error("Marker OCR error:", error.message);
    return null;
  }
}

/**
 * Full restoration pipeline for a single page
 * @param {string} inputPath - Input image path
 * @param {Object} options - Restoration options
 * @returns {Promise<Buffer>} Final restored image buffer
 */
export async function restorePage(inputPath, options = {}) {
  const {
    maskPath = null,
    scale = 2,
    faceEnhance = false,
    useFaceRestore = false,
    extractOCR = false,
    // Color correction options
    applyColorCorrection = true,
    removeCast = true,
    castStrength = 0.7,
    applyLevels = true,
    whitePoint = 245,
    blackPoint = 12,
    applySaturation = true,
    applyClarity = true,
    addGrain = false,
    grainStrength = 0.03,
    matteCompensation = false,
    midtoneLift = 6,
    referenceImage = null,
    // Premium lighting options (NEW!)
    applyLighting = true,
    lightingPreset = 'modern-reprint', // 'modern-reprint', 'dramatic', 'subtle', 'vintage-enhanced'
    // CMYK conversion options
    convertToCMYK = false,
    gcrStrength = 0.8,
    tacLimit = 300,
    // QA options
    runQA = true,
    originalForComparison = null
  } = options;

  console.log(`\nRestoring: ${inputPath}`);
  
  // Step 1: Upscale & clean
  let currentBuffer = await upscale(inputPath, { scale, faceEnhance });

  // Step 2: Optional inpainting for damage
  if (maskPath && fs.existsSync(maskPath)) {
    const maskBuffer = fs.readFileSync(maskPath);
    currentBuffer = await inpaint(currentBuffer, maskBuffer);
  }

  // Step 3: Optional face restoration (be careful on manga/comics)
  if (useFaceRestore) {
    console.warn("⚠️  Face restoration can alter comic art style. Use only on realistic faces.");
    currentBuffer = await faceRestore(currentBuffer);
  }

  // Step 4: Color correction and tone mapping (NEW!)
  if (applyColorCorrection) {
    console.log("\n--- Color Correction & Tone Mapping ---");
    const { applyColorCorrection: colorCorrectFunc } = await import('./color-correction.js');
    
    currentBuffer = await colorCorrectFunc(currentBuffer, {
      removeCast,
      castStrength,
      applyLevelsAdjust: applyLevels,
      whitePoint,
      blackPoint,
      applySaturation,
      applyLocalContrast: applyClarity,
      addGrain,
      grainStrength,
      matteCompensation,
      midtoneLift,
      referenceImage
    });
    
    console.log("✓ Color correction complete");
  }

  // Step 4.5: Premium lighting effects (NEW!)
  if (options.applyLighting !== false) {
    console.log("\n--- Premium Lighting Effects ---");
    const { applyLightingPreset } = await import('./lighting-effects.js');
    
    const lightingPreset = options.lightingPreset || 'modern-reprint';
    currentBuffer = await applyLightingPreset(currentBuffer, lightingPreset);
    
    console.log("✓ Lighting effects applied");
  }

  // Step 5: CMYK conversion for print (NEW!)
  if (convertToCMYK) {
    console.log("\n--- CMYK Conversion ---");
    const { convertToCmyk, cmykToRgbBuffer } = await import('./cmyk-conversion.js');
    
    const cmykData = await convertToCmyk(currentBuffer, {
      gcrStrength,
      tacLimit,
      applyRichBlack: true,
      forceLineArtToK: true,
      compensateDotGainValue: matteCompensation,
      dotGainAmount: 15
    });
    
    // Convert back to RGB for final output
    currentBuffer = await cmykToRgbBuffer(cmykData);
    console.log("✓ CMYK conversion complete");
  }

  // Step 6: Quality assurance checks (NEW!)
  if (runQA) {
    console.log("\n--- Quality Assurance ---");
    const { runFullQA } = await import('./qa-checks.js');
    
    const originalBuffer = originalForComparison || fs.readFileSync(inputPath);
    const qaResults = await runFullQA(currentBuffer, originalBuffer, {
      checkClipping: true,
      checkSSIM: true,
      checkEdges: true,
      checkTint: true,
      checkContrast: true
    });
    
    if (!qaResults.passed) {
      console.warn("⚠️  QA checks failed! Review warnings above.");
    }
  }

  // Step 7: Optional OCR for text extraction
  if (extractOCR) {
    const text = await extractText(currentBuffer);
    if (text) {
      console.log("Extracted text:", text.substring(0, 200) + "...");
      // Save text to file
      const textPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, "_text.txt");
      fs.writeFileSync(textPath, text);
    }
  }

  return currentBuffer;
}

// Export all functions
export default {
  upscale,
  inpaint,
  faceRestore,
  extractText,
  extractTextMarker,
  restorePage
};
