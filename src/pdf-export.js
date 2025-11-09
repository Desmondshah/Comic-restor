/**
 * PDF Export with print-ready specs
 * Includes proper bleed margins, DPI settings, and matte paper compensation
 */

import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";

/**
 * Apply matte paper compensation curve
 * Lifts midtones to prevent darkening on matte paper
 * @param {Buffer} imageBuffer - Input image
 * @param {number} midtoneLift - Amount to lift midtones (0-20, default 5)
 * @returns {Promise<Buffer>} Adjusted image
 */
export async function applyMatteCompensation(imageBuffer, midtoneLift = 5) {
  if (midtoneLift <= 0) {
    return imageBuffer;
  }

  console.log(`Applying matte paper compensation (+${midtoneLift} midtones)...`);

  // Debug: Check input buffer
  console.log(`  Input buffer size: ${imageBuffer.length} bytes`);
  
  // Ensure buffer is in a supported format (convert to PNG if needed)
  try {
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`  Input format: ${metadata.format}, ${metadata.width}x${metadata.height}`);
    imageBuffer = await sharp(imageBuffer).png().toBuffer();
    console.log(`  Converted to PNG: ${imageBuffer.length} bytes`);
  } catch (error) {
    console.error("Error converting image format:", error.message);
    console.error("Buffer preview (first 100 bytes):", imageBuffer.slice(0, 100));
    throw new Error(`Unsupported image format in applyMatteCompensation: ${error.message}`);
  }

  // Create a curve that lifts midtones while protecting blacks and whites
  // Input: 0-255, Output: adjusted 0-255
  const createCurve = (lift) => {
    const curve = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      const normalized = i / 255;
      
      // Bell curve centered on midtones (0.5)
      // Protects deep blacks (0-30) and bright highlights (225-255)
      const weight = Math.exp(-Math.pow((normalized - 0.5) * 3, 2));
      const adjustment = weight * lift;
      
      const adjusted = i + adjustment;
      curve[i] = Math.max(0, Math.min(255, Math.round(adjusted)));
    }
    return curve;
  };

  const curve = createCurve(midtoneLift);

  // Apply curve using raw pixel manipulation
  try {
    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha() // Ensure we have an alpha channel
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    console.log(`  Processing ${info.width}x${info.height}, ${info.channels} channels`);

    // Apply curve to each pixel (RGB channels only, preserve alpha)
    const output = Buffer.from(data);
    const channels = info.channels; // Should be 4 (RGBA)
    
    for (let i = 0; i < data.length; i += channels) {
      // Apply curve to R, G, B (first 3 channels)
      output[i] = curve[data[i]];       // R
      output[i + 1] = curve[data[i + 1]]; // G
      output[i + 2] = curve[data[i + 2]]; // B
      // Keep alpha as-is: output[i + 3] = data[i + 3];
    }
    
    const result = await sharp(output, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels
      }
    })
    .png()
    .toBuffer();
    
    console.log(`  Matte compensation complete: ${result.length} bytes`);
    return result;
  } catch (error) {
    console.error("❌ Error in matte compensation:", error.message);
    throw new Error(`Matte compensation failed: ${error.message}`);
  }
}

/**
 * Prepare image for print with proper sizing and bleed
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {Object} options - Print specifications
 * @returns {Promise<{buffer: Buffer, dimensions: Object}>} Print-ready image buffer and actual dimensions
 */
export async function prepareForPrint(imageBuffer, options = {}) {
  const {
    widthIn = 6.625,      // Standard comic width
    heightIn = 10.25,     // Standard comic height
    dpi = 300,            // Print resolution
    bleedIn = 0.125,      // 1/8" bleed on all sides
    matteCompensation = 5,
    adaptiveSize = true   // Adapt page size to image aspect ratio
  } = options;

  console.log(`\n=== prepareForPrint Debug ===`);
  console.log(`Input buffer type: ${Buffer.isBuffer(imageBuffer) ? 'Buffer' : typeof imageBuffer}`);
  console.log(`Input buffer size: ${imageBuffer ? imageBuffer.length : 'null'} bytes`);

  // Ensure buffer is in a supported format first
  let metadata;
  try {
    metadata = await sharp(imageBuffer).metadata();
    console.log(`Input format: ${metadata.format}, ${metadata.width}x${metadata.height}, channels: ${metadata.channels}`);
    
    imageBuffer = await sharp(imageBuffer).png().toBuffer();
    console.log(`Converted to PNG: ${imageBuffer.length} bytes`);
  } catch (error) {
    console.error("❌ Error reading image format:", error.message);
    console.error("Buffer preview (first 100 bytes):", imageBuffer.slice(0, 100));
    throw new Error(`Unsupported image format in prepareForPrint: ${error.message}`);
  }

  // Apply matte compensation first
  let processed = imageBuffer;
  if (matteCompensation > 0) {
    processed = await applyMatteCompensation(processed, matteCompensation);
  }

  let finalWidthIn, finalHeightIn;
  
  if (adaptiveSize) {
    // Calculate actual dimensions from image to prevent white space
    // Keep the image's aspect ratio and scale to appropriate print size
    const imageAspectRatio = metadata.width / metadata.height;
    const targetAspectRatio = widthIn / heightIn;
    
    if (Math.abs(imageAspectRatio - targetAspectRatio) > 0.1) {
      // Image has different aspect ratio - adapt the page size
      if (imageAspectRatio > targetAspectRatio) {
        // Wider image (horizontal) - keep width, adjust height
        finalWidthIn = widthIn;
        finalHeightIn = widthIn / imageAspectRatio;
      } else {
        // Taller image (vertical) - keep height, adjust width
        finalHeightIn = heightIn;
        finalWidthIn = heightIn * imageAspectRatio;
      }
      console.log(`Adaptive sizing: ${finalWidthIn.toFixed(3)}" x ${finalHeightIn.toFixed(3)}" (aspect ratio: ${imageAspectRatio.toFixed(2)})`);
    } else {
      // Aspect ratio is close enough - use standard dimensions
      finalWidthIn = widthIn;
      finalHeightIn = heightIn;
    }
  } else {
    finalWidthIn = widthIn;
    finalHeightIn = heightIn;
  }

  // Calculate pixel dimensions with bleed
  const pxWidth = Math.round((finalWidthIn + bleedIn * 2) * dpi);
  const pxHeight = Math.round((finalHeightIn + bleedIn * 2) * dpi);

  console.log(`Preparing for print: ${pxWidth}x${pxHeight}px (${(finalWidthIn + bleedIn * 2).toFixed(3)}"x${(finalHeightIn + bleedIn * 2).toFixed(3)}" @ ${dpi} DPI)`);

  // Resize to print dimensions - use cover to fill the page without white space
  processed = await sharp(processed)
    .resize(pxWidth, pxHeight, {
      fit: "cover",           // Fill the page completely
      position: "center",     // Center the crop
      kernel: "lanczos3"      // High-quality resampling
    })
    .withMetadata({ density: dpi })
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();

  return {
    buffer: processed,
    dimensions: {
      widthIn: finalWidthIn + bleedIn * 2,
      heightIn: finalHeightIn + bleedIn * 2,
      bleedIn
    }
  };
}

/**
 * Create a print-ready PDF from image buffer
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {string} outputPath - Output PDF path
 * @param {Object} options - PDF and print options
 * @returns {Promise<string>} Path to created PDF
 */
export async function createPrintPDF(imageBuffer, outputPath, options = {}) {
  const {
    widthIn = 6.625,
    heightIn = 10.25,
    dpi = 300,
    bleedIn = 0.125,
    matteCompensation = 5,
    title = "Comic Page",
    author = ""
  } = options;

  console.log(`Creating print-ready PDF: ${outputPath}`);

  // Prepare image for print (now returns object with buffer and dimensions)
  const { buffer: printReady, dimensions } = await prepareForPrint(imageBuffer, {
    widthIn,
    heightIn,
    dpi,
    bleedIn,
    matteCompensation
  });

  // Calculate PDF dimensions in points (72 points = 1 inch) using actual dimensions
  const pdfWidth = dimensions.widthIn * 72;
  const pdfHeight = dimensions.heightIn * 72;

  console.log(`PDF page size: ${pdfWidth.toFixed(1)}pt x ${pdfHeight.toFixed(1)}pt (${dimensions.widthIn.toFixed(3)}" x ${dimensions.heightIn.toFixed(3)}")`);

  // Create PDF
  const pdfDoc = await PDFDocument.create();
  
  // Set PDF metadata
  pdfDoc.setTitle(title);
  if (author) pdfDoc.setAuthor(author);
  pdfDoc.setProducer("Comic Restoration Pipeline");
  pdfDoc.setCreator("Comic Restoration Pipeline");
  pdfDoc.setCreationDate(new Date());

  // Add page with bleed dimensions
  const page = pdfDoc.addPage([pdfWidth, pdfHeight]);

  // Embed image
  const pngImage = await pdfDoc.embedPng(printReady);

  // Draw image to fill entire page (including bleed)
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: pdfWidth,
    height: pdfHeight
  });

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  console.log(`✓ PDF created: ${outputPath} (${(pdfBytes.length / 1024 / 1024).toFixed(2)} MB)`);

  return outputPath;
}

/**
 * Create multi-page PDF from multiple images
 * @param {Array<Buffer>} imageBuffers - Array of image buffers
 * @param {string} outputPath - Output PDF path
 * @param {Object} options - PDF and print options
 * @returns {Promise<string>} Path to created PDF
 */
export async function createMultiPagePDF(imageBuffers, outputPath, options = {}) {
  const {
    widthIn = 6.625,
    heightIn = 10.25,
    dpi = 300,
    bleedIn = 0.125,
    matteCompensation = 5,
    title = "Comic Book",
    author = ""
  } = options;

  console.log(`Creating multi-page PDF with ${imageBuffers.length} pages...`);

  // Create PDF
  const pdfDoc = await PDFDocument.create();
  
  // Set PDF metadata
  pdfDoc.setTitle(title);
  if (author) pdfDoc.setAuthor(author);
  pdfDoc.setProducer("Comic Restoration Pipeline");
  pdfDoc.setCreator("Comic Restoration Pipeline");
  pdfDoc.setCreationDate(new Date());

  // Process each page
  for (let i = 0; i < imageBuffers.length; i++) {
    console.log(`\n=== Processing PDF page ${i + 1}/${imageBuffers.length} ===`);
    console.log(`Page ${i + 1} buffer type: ${Buffer.isBuffer(imageBuffers[i]) ? 'Buffer' : typeof imageBuffers[i]}`);
    console.log(`Page ${i + 1} buffer size: ${imageBuffers[i] ? imageBuffers[i].length : 'null'} bytes`);

    try {
      // Prepare image for print (now returns object with buffer and dimensions)
      const { buffer: printReady, dimensions } = await prepareForPrint(imageBuffers[i], {
        widthIn,
        heightIn,
        dpi,
        bleedIn,
        matteCompensation
      });

      console.log(`✓ Page ${i + 1} prepared: ${printReady.length} bytes`);

      // Calculate page dimensions in points using actual dimensions
      const pagePdfWidth = dimensions.widthIn * 72;
      const pagePdfHeight = dimensions.heightIn * 72;

      // Add page with actual dimensions
      const page = pdfDoc.addPage([pagePdfWidth, pagePdfHeight]);

      // Embed and draw image
      const pngImage = await pdfDoc.embedPng(printReady);
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pagePdfWidth,
        height: pagePdfHeight
      });

      console.log(`✓ Page ${i + 1} added to PDF (${dimensions.widthIn.toFixed(3)}" x ${dimensions.heightIn.toFixed(3)}")`);
    } catch (error) {
      console.error(`❌ Failed to process page ${i + 1}:`, error.message);
      throw new Error(`Page ${i + 1} failed: ${error.message}`);
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  console.log(`✓ Multi-page PDF created: ${outputPath} (${(pdfBytes.length / 1024 / 1024).toFixed(2)} MB)`);

  return outputPath;
}

/**
 * Add crop marks and registration marks to PDF (for professional printing)
 * @param {string} pdfPath - Input PDF path
 * @param {Object} options - Crop mark options
 * @returns {Promise<string>} Path to PDF with crop marks
 */
export async function addCropMarks(pdfPath, options = {}) {
  const {
    trimBoxWidthIn = 6.625,
    trimBoxHeightIn = 10.25,
    bleedIn = 0.125
  } = options;

  console.log("Adding crop marks to PDF...");

  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const pages = pdfDoc.getPages();
  
  // Convert to points
  const trimWidth = trimBoxWidthIn * 72;
  const trimHeight = trimBoxHeightIn * 72;
  const bleed = bleedIn * 72;

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Set trim box (final size after cutting)
    page.setTrimBox(bleed, bleed, trimWidth, trimHeight);

    // Set bleed box
    page.setBleedBox(0, 0, width, height);

    // Note: Actual crop mark drawing would require more complex PDF operations
    // Most print shops add these automatically from TrimBox/BleedBox metadata
  }

  // Save updated PDF
  const updatedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfPath, updatedPdfBytes);

  console.log("✓ Crop marks metadata added");

  return pdfPath;
}

export default {
  applyMatteCompensation,
  prepareForPrint,
  createPrintPDF,
  createMultiPagePDF,
  addCropMarks
};
