/**
 * Example usage of the comic restoration API
 * Use this as a template for your own scripts
 */

import dotenv from "dotenv";
import { restorePage, processDirectory } from "./src/index.js";
import { createPrintPDF } from "./src/pdf-export.js";

// Load environment variables
dotenv.config();

// Example 1: Restore a single page
async function example1_singlePage() {
  console.log("Example 1: Single page restoration");

  const restoredBuffer = await restorePage("samples/page01.jpg", {
    scale: 2,
    faceEnhance: false,
    useFaceRestore: false,
    extractOCR: false
  });

  await createPrintPDF(restoredBuffer, "output/page01_restored.pdf", {
    widthIn: 6.625,
    heightIn: 10.25,
    dpi: 300,
    bleedIn: 0.125,
    matteCompensation: 5
  });

  console.log("✓ Done!");
}

// Example 2: Restore with damage mask
async function example2_withMask() {
  console.log("Example 2: Restoration with damage mask");

  const restoredBuffer = await restorePage("samples/page01.jpg", {
    maskPath: "samples/page01_mask.png",
    scale: 2
  });

  await createPrintPDF(restoredBuffer, "output/page01_masked_restored.pdf");

  console.log("✓ Done!");
}

// Example 3: Batch process directory
async function example3_batchProcess() {
  console.log("Example 3: Batch processing");

  const results = await processDirectory("samples/", "output/", {
    scale: 2,
    dpi: 300,
    matteCompensation: 5,
    runQA: true,
    createSinglePDF: true
  });

  console.log(`✓ Processed ${results.completed} pages`);
}

// Example 4: High-quality restoration for print
async function example4_highQuality() {
  console.log("Example 4: High-quality restoration");

  const restoredBuffer = await restorePage("samples/page01.jpg", {
    scale: 4,  // 4x upscaling for maximum detail
  });

  await createPrintPDF(restoredBuffer, "output/page01_hq_restored.pdf", {
    dpi: 600,  // High DPI for professional printing
    matteCompensation: 8,  // More compensation for matte
    widthIn: 8.5,
    heightIn: 11
  });

  console.log("✓ Done!");
}

// Run examples
// Uncomment the example you want to run:

// await example1_singlePage();
// await example2_withMask();
// await example3_batchProcess();
// await example4_highQuality();

console.log("\nℹ️  Uncomment an example in examples.js to run it");
console.log("   Or use the CLI: npm start -- -i samples/page01.jpg -o output/page01.pdf");
