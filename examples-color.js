/**
 * Color Correction Examples
 * Demonstrates how to use the color correction and CMYK features
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import modules
import { applyColorCorrection, removeColorCast, matchToReference } from './src/color-correction.js';
import { convertToCmyk, cmykToRgbBuffer, exportCmykChannels } from './src/cmyk-conversion.js';
import { runFullQA } from './src/qa-checks.js';

/**
 * Example 1: Basic color correction
 */
export async function example1_basicCorrection() {
  console.log("\n=== Example 1: Basic Color Correction ===\n");
  
  const inputPath = 'samples/yellowed-page.png';
  if (!fs.existsSync(inputPath)) {
    console.log("⚠️  Sample file not found. Skipping example.");
    return;
  }

  const imageBuffer = fs.readFileSync(inputPath);

  // Apply basic color correction
  const corrected = await applyColorCorrection(imageBuffer, {
    removeCast: true,
    castStrength: 0.7,
    applyLevelsAdjust: true,
    whitePoint: 245,
    blackPoint: 12,
    applySaturation: true,
    applyLocalContrast: true
  });

  // Save result
  const outputPath = path.join('output', 'example1-corrected.png');
  fs.writeFileSync(outputPath, corrected);
  console.log(`✓ Saved: ${outputPath}`);
}

/**
 * Example 2: Remove heavy yellowing
 */
export async function example2_removeYellowing() {
  console.log("\n=== Example 2: Remove Heavy Yellowing ===\n");
  
  const inputPath = 'samples/golden-age-page.png';
  if (!fs.existsSync(inputPath)) {
    console.log("⚠️  Sample file not found. Skipping example.");
    return;
  }

  const imageBuffer = fs.readFileSync(inputPath);

  // Strong cast removal for golden age comics
  const corrected = await removeColorCast(imageBuffer, {
    strength: 0.9,  // Strong correction
    preserveInks: true
  });

  const outputPath = path.join('output', 'example2-no-yellowing.png');
  fs.writeFileSync(outputPath, corrected);
  console.log(`✓ Saved: ${outputPath}`);
}

/**
 * Example 3: Match pages to reference
 */
export async function example3_referenceMatching() {
  console.log("\n=== Example 3: Reference Page Matching ===\n");
  
  const referencePath = 'samples/hero-page.png';
  const targetPath = 'samples/mismatched-page.png';
  
  if (!fs.existsSync(referencePath) || !fs.existsSync(targetPath)) {
    console.log("⚠️  Sample files not found. Skipping example.");
    return;
  }

  const referenceBuffer = fs.readFileSync(referencePath);
  const targetBuffer = fs.readFileSync(targetPath);

  // Match target to reference
  const matched = await matchToReference(targetBuffer, referenceBuffer, {
    strength: 0.8
  });

  const outputPath = path.join('output', 'example3-matched.png');
  fs.writeFileSync(outputPath, matched);
  console.log(`✓ Saved: ${outputPath}`);
}

/**
 * Example 4: Full pipeline with matte compensation
 */
export async function example4_mattePipeline() {
  console.log("\n=== Example 4: Full Matte Stock Pipeline ===\n");
  
  const inputPath = 'samples/page-for-print.png';
  if (!fs.existsSync(inputPath)) {
    console.log("⚠️  Sample file not found. Skipping example.");
    return;
  }

  const imageBuffer = fs.readFileSync(inputPath);

  // Full color correction with matte compensation
  const corrected = await applyColorCorrection(imageBuffer, {
    removeCast: true,
    castStrength: 0.7,
    applyLevelsAdjust: true,
    whitePoint: 245,
    blackPoint: 12,
    applySaturation: true,
    applyLocalContrast: true,
    matteCompensation: true,
    midtoneLift: 6,
    addGrain: true,
    grainStrength: 0.03
  });

  const outputPath = path.join('output', 'example4-matte-ready.png');
  fs.writeFileSync(outputPath, corrected);
  console.log(`✓ Saved: ${outputPath}`);
}

/**
 * Example 5: CMYK conversion
 */
export async function example5_cmykConversion() {
  console.log("\n=== Example 5: CMYK Conversion ===\n");
  
  const inputPath = 'samples/rgb-page.png';
  if (!fs.existsSync(inputPath)) {
    console.log("⚠️  Sample file not found. Skipping example.");
    return;
  }

  const imageBuffer = fs.readFileSync(inputPath);

  // Convert to CMYK with GCR and TAC limiting
  const cmykData = await convertToCmyk(imageBuffer, {
    gcrStrength: 0.8,
    tacLimit: 300,
    applyRichBlack: true,
    forceLineArtToK: true,
    compensateDotGainValue: true,
    dotGainAmount: 15
  });

  // Export CMYK separations for inspection
  await exportCmykChannels(cmykData, path.join('output', 'example5-separations'));

  // Convert back to RGB for preview
  const rgbPreview = await cmykToRgbBuffer(cmykData);
  fs.writeFileSync(path.join('output', 'example5-cmyk-preview.png'), rgbPreview);

  console.log(`✓ Saved CMYK separations and preview`);
}

/**
 * Example 6: Quality assurance checks
 */
export async function example6_qaChecks() {
  console.log("\n=== Example 6: QA Checks ===\n");
  
  const originalPath = 'samples/original.png';
  const processedPath = 'samples/processed.png';
  
  if (!fs.existsSync(originalPath) || !fs.existsSync(processedPath)) {
    console.log("⚠️  Sample files not found. Skipping example.");
    return;
  }

  const originalBuffer = fs.readFileSync(originalPath);
  const processedBuffer = fs.readFileSync(processedPath);

  // Run full QA suite
  const qa = await runFullQA(processedBuffer, originalBuffer, {
    checkClipping: true,
    clippingThreshold: 0.005,
    checkSSIM: true,
    minSSIM: 0.92,
    checkEdges: true,
    maxEdgeDensity: 0.25,
    checkTint: true,
    checkContrast: true
  });

  console.log(`\n--- QA Report ---`);
  console.log(`Overall: ${qa.passed ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`Warnings: ${qa.warnings.length}`);
  
  if (qa.warnings.length > 0) {
    console.log(`\nDetails:`);
    qa.warnings.forEach(w => console.log(`  ${w}`));
  }

  console.log(`\nMetrics:`);
  console.log(`  SSIM: ${qa.metrics.ssim?.toFixed(4) || 'N/A'}`);
  console.log(`  Edge density: ${(qa.metrics.edgeDensity * 100).toFixed(2)}%`);
  console.log(`  Sharpness: ${qa.metrics.sharpness.toFixed(2)}`);
}

/**
 * Example 7: Batch processing with reference matching
 */
export async function example7_batchWithReference() {
  console.log("\n=== Example 7: Batch Processing with Reference ===\n");
  
  const samplesDir = 'samples/batch';
  if (!fs.existsSync(samplesDir)) {
    console.log("⚠️  Sample directory not found. Skipping example.");
    return;
  }

  const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.png'));
  if (files.length === 0) {
    console.log("⚠️  No PNG files found. Skipping example.");
    return;
  }

  // Use first file as reference
  const referencePath = path.join(samplesDir, files[0]);
  const referenceBuffer = fs.readFileSync(referencePath);

  console.log(`Using ${files[0]} as reference...`);

  // Process all other files
  for (let i = 1; i < files.length; i++) {
    const file = files[i];
    const inputPath = path.join(samplesDir, file);
    const imageBuffer = fs.readFileSync(inputPath);

    console.log(`\nProcessing ${file}...`);

    // Apply color correction with reference matching
    const corrected = await applyColorCorrection(imageBuffer, {
      removeCast: true,
      applyLevelsAdjust: true,
      applySaturation: true,
      applyLocalContrast: true,
      referenceImage: referenceBuffer
    });

    const outputPath = path.join('output', `batch-${file}`);
    fs.writeFileSync(outputPath, corrected);
    console.log(`  ✓ Saved: ${outputPath}`);
  }

  console.log(`\n✓ Batch processing complete!`);
}

/**
 * Example 8: Complete restoration workflow
 */
export async function example8_completeWorkflow() {
  console.log("\n=== Example 8: Complete Restoration Workflow ===\n");
  
  const inputPath = 'samples/damaged-page.png';
  if (!fs.existsSync(inputPath)) {
    console.log("⚠️  Sample file not found. Skipping example.");
    return;
  }

  const imageBuffer = fs.readFileSync(inputPath);
  const originalBuffer = imageBuffer; // Save for comparison

  // Step 1: Color correction
  console.log("\n1. Applying color correction...");
  let result = await applyColorCorrection(imageBuffer, {
    removeCast: true,
    castStrength: 0.7,
    applyLevelsAdjust: true,
    whitePoint: 245,
    blackPoint: 12,
    applySaturation: true,
    applyLocalContrast: true
  });

  // Step 2: Matte compensation
  console.log("\n2. Applying matte stock compensation...");
  const { applyMatteCompensation } = await import('./src/color-correction.js');
  result = await applyMatteCompensation(result, {
    midtoneLift: 6,
    shadowCompress: 0.95,
    saturateReduce: 0.96
  });

  // Step 3: Add subtle grain
  console.log("\n3. Adding paper grain...");
  const { addPaperGrain } = await import('./src/color-correction.js');
  result = await addPaperGrain(result, {
    strength: 0.03
  });

  // Step 4: QA checks
  console.log("\n4. Running QA checks...");
  const qa = await runFullQA(result, originalBuffer, {
    checkClipping: true,
    checkSSIM: true,
    checkEdges: true,
    checkTint: true,
    checkContrast: true
  });

  // Step 5: Save result
  const outputPath = path.join('output', 'example8-complete.png');
  fs.writeFileSync(outputPath, result);
  console.log(`\n✓ Complete workflow finished!`);
  console.log(`✓ Saved: ${outputPath}`);
  console.log(`✓ QA: ${qa.passed ? 'PASSED' : 'FAILED'} (${qa.warnings.length} warnings)`);
}

// Run examples if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const examples = {
    '1': example1_basicCorrection,
    '2': example2_removeYellowing,
    '3': example3_referenceMatching,
    '4': example4_mattePipeline,
    '5': example5_cmykConversion,
    '6': example6_qaChecks,
    '7': example7_batchWithReference,
    '8': example8_completeWorkflow,
    'all': async () => {
      await example1_basicCorrection();
      await example2_removeYellowing();
      await example3_referenceMatching();
      await example4_mattePipeline();
      await example5_cmykConversion();
      await example6_qaChecks();
      await example7_batchWithReference();
      await example8_completeWorkflow();
    }
  };

  const arg = process.argv[2] || 'all';

  if (examples[arg]) {
    console.log("Color Correction Examples");
    console.log("=".repeat(60));
    
    examples[arg]().then(() => {
      console.log("\n" + "=".repeat(60));
      console.log("✓ Examples complete!");
    }).catch(error => {
      console.error("\n✗ Error running examples:", error);
      process.exit(1);
    });
  } else {
    console.log("Usage: node examples-color.js [1-8|all]");
    console.log("\nAvailable examples:");
    console.log("  1 - Basic color correction");
    console.log("  2 - Remove heavy yellowing");
    console.log("  3 - Reference page matching");
    console.log("  4 - Full matte stock pipeline");
    console.log("  5 - CMYK conversion");
    console.log("  6 - Quality assurance checks");
    console.log("  7 - Batch processing with reference");
    console.log("  8 - Complete restoration workflow");
    console.log("  all - Run all examples");
  }
}

export default {
  example1_basicCorrection,
  example2_removeYellowing,
  example3_referenceMatching,
  example4_mattePipeline,
  example5_cmykConversion,
  example6_qaChecks,
  example7_batchWithReference,
  example8_completeWorkflow
};
