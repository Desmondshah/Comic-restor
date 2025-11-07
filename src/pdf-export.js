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

  // Ensure buffer is in a supported format (convert to PNG if needed)
  try {
    imageBuffer = await sharp(imageBuffer).png().toBuffer();
  } catch (error) {
    console.error("Error converting image format:", error.message);
    throw new Error("Unsupported image format. Please use JPG, PNG, or TIFF.");
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

  // Apply curve using recomb with the curve as a lookup table
  // Convert curve to array for Sharp
  const curveArray = Array.from(curve);
  
  return await sharp(imageBuffer)
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(async ({ data, info }) => {
      // Apply curve to each pixel
      const output = Buffer.from(data);
      for (let i = 0; i < data.length; i++) {
        output[i] = curve[data[i]];
      }
      
      return await sharp(output, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels
        }
      })
      .toColourspace('srgb')
      .toBuffer();
    });
}

/**
 * Prepare image for print with proper sizing and bleed
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {Object} options - Print specifications
 * @returns {Promise<Buffer>} Print-ready image buffer
 */
export async function prepareForPrint(imageBuffer, options = {}) {
  const {
    widthIn = 6.625,      // Standard comic width
    heightIn = 10.25,     // Standard comic height
    dpi = 300,            // Print resolution
    bleedIn = 0.125,      // 1/8" bleed on all sides
    matteCompensation = 5
  } = options;

  // Ensure buffer is in a supported format first
  try {
    imageBuffer = await sharp(imageBuffer).png().toBuffer();
  } catch (error) {
    console.error("Error reading image format:", error.message);
    throw new Error("Unsupported image format. Please use JPG, PNG, or TIFF.");
  }

  // Calculate pixel dimensions with bleed
  const pxWidth = Math.round((widthIn + bleedIn * 2) * dpi);
  const pxHeight = Math.round((heightIn + bleedIn * 2) * dpi);

  console.log(`Preparing for print: ${pxWidth}x${pxHeight}px (${widthIn + bleedIn * 2}"x${heightIn + bleedIn * 2}" @ ${dpi} DPI)`);

  // Apply matte compensation first
  let processed = imageBuffer;
  if (matteCompensation > 0) {
    processed = await applyMatteCompensation(processed, matteCompensation);
  }

  // Resize to exact print dimensions
  processed = await sharp(processed)
    .resize(pxWidth, pxHeight, {
      fit: "cover",           // Cover the area, crop if needed
      position: "center",     // Center the crop
      kernel: "lanczos3"      // High-quality resampling
    })
    .withMetadata({ density: dpi })
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();

  return processed;
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

  // Prepare image for print
  const printReady = await prepareForPrint(imageBuffer, {
    widthIn,
    heightIn,
    dpi,
    bleedIn,
    matteCompensation
  });

  // Calculate PDF dimensions in points (72 points = 1 inch)
  const pdfWidth = (widthIn + bleedIn * 2) * 72;
  const pdfHeight = (heightIn + bleedIn * 2) * 72;

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

  // Calculate PDF dimensions in points
  const pdfWidth = (widthIn + bleedIn * 2) * 72;
  const pdfHeight = (heightIn + bleedIn * 2) * 72;

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
    console.log(`Processing page ${i + 1}/${imageBuffers.length}...`);

    // Prepare image for print
    const printReady = await prepareForPrint(imageBuffers[i], {
      widthIn,
      heightIn,
      dpi,
      bleedIn,
      matteCompensation
    });

    // Add page
    const page = pdfDoc.addPage([pdfWidth, pdfHeight]);

    // Embed and draw image
    const pngImage = await pdfDoc.embedPng(printReady);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pdfWidth,
      height: pdfHeight
    });
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
