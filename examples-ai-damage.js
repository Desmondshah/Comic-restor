#!/usr/bin/env node

/**
 * AI Damage Restoration Examples
 * Demonstrates various use cases of the Google Nano Banana AI restoration
 */

import { AIDamageRestoration } from './src/ai-damage-restoration.js';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = './output/ai-restored-examples';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const restorer = new AIDamageRestoration();

/**
 * Example 1: Basic Damage Removal
 */
async function example1_basicRestoration() {
  console.log('\n📘 Example 1: Basic Damage Removal\n');
  console.log('Automatically removes scratches, dust, and tears');
  console.log('Perfect for: Most vintage comic scans');
  console.log('━'.repeat(50));

  // Assumes you have a sample image in samples/
  const inputPath = './samples/page01.jpg';
  
  if (!fs.existsSync(inputPath)) {
    console.log('⚠️  Sample image not found. Place a comic scan in samples/page01.jpg');
    return;
  }

  const outputPath = path.join(OUTPUT_DIR, 'example1_basic_restoration.jpg');

  await restorer.restoreDamage(inputPath, outputPath, {
    preserveLogo: true,
    preserveSignature: true,
    modernStyle: true,
    strength: 0.8
  });

  console.log(`\n✅ Saved: ${outputPath}\n`);
}

/**
 * Example 2: Heavy Damage (Golden Age Comics)
 */
async function example2_heavyDamage() {
  console.log('\n📘 Example 2: Heavy Damage Restoration\n');
  console.log('Aggressive restoration for severely damaged scans');
  console.log('Perfect for: Golden Age (1938-1956) comics with tears, stains, missing pieces');
  console.log('━'.repeat(50));

  const inputPath = './samples/page01.jpg';
  
  if (!fs.existsSync(inputPath)) {
    console.log('⚠️  Sample image not found.');
    return;
  }

  const outputPath = path.join(OUTPUT_DIR, 'example2_heavy_damage.jpg');

  await restorer.restoreDamage(inputPath, outputPath, {
    preserveLogo: true,
    preserveSignature: true,
    modernStyle: true,
    strength: 0.95, // More aggressive
    customInstructions: 'Remove all tears, creases, and missing corners. Reconstruct damaged areas.'
  });

  console.log(`\n✅ Saved: ${outputPath}\n`);
}

/**
 * Example 3: Subtle Enhancement (Modern Comics)
 */
async function example3_subtleEnhancement() {
  console.log('\n📘 Example 3: Subtle Enhancement\n');
  console.log('Light touch for modern comics with minor scan artifacts');
  console.log('Perfect for: Modern Age (1985+) comics, clean scans with JPEG artifacts');
  console.log('━'.repeat(50));

  const inputPath = './samples/page01.jpg';
  
  if (!fs.existsSync(inputPath)) {
    console.log('⚠️  Sample image not found.');
    return;
  }

  const outputPath = path.join(OUTPUT_DIR, 'example3_subtle.jpg');

  await restorer.restoreDamage(inputPath, outputPath, {
    preserveLogo: true,
    preserveSignature: true,
    modernStyle: false, // Keep vintage look
    strength: 0.5, // Light touch
    customInstructions: 'Remove scan artifacts and compression noise only. Preserve original colors and style.'
  });

  console.log(`\n✅ Saved: ${outputPath}\n`);
}

/**
 * Example 4: With Before/After Comparison
 */
async function example4_withComparison() {
  console.log('\n📘 Example 4: Restoration with Comparison\n');
  console.log('Generate side-by-side before/after images');
  console.log('Perfect for: Quality checking and client presentations');
  console.log('━'.repeat(50));

  const inputPath = './samples/page01.jpg';
  
  if (!fs.existsSync(inputPath)) {
    console.log('⚠️  Sample image not found.');
    return;
  }

  const result = await restorer.restoreWithComparison(inputPath, OUTPUT_DIR, {
    preserveLogo: true,
    preserveSignature: true,
    modernStyle: true,
    strength: 0.8
  });

  console.log(`\n✅ Restored: ${result.outputPath}`);
  console.log(`✅ Comparison: ${result.comparisonPath}\n`);
}

/**
 * Example 5: Batch Processing
 */
async function example5_batchProcessing() {
  console.log('\n📘 Example 5: Batch Processing\n');
  console.log('Process multiple pages with consistent settings');
  console.log('Perfect for: Complete comic issues or archival projects');
  console.log('━'.repeat(50));

  // Find all images in samples directory
  const samplesDir = './samples';
  
  if (!fs.existsSync(samplesDir)) {
    console.log('⚠️  Samples directory not found.');
    return;
  }

  const files = fs.readdirSync(samplesDir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .map(f => path.join(samplesDir, f));

  if (files.length === 0) {
    console.log('⚠️  No image files found in samples/');
    return;
  }

  console.log(`Found ${files.length} image(s)\n`);

  const results = await restorer.restoreBatch(files, OUTPUT_DIR, {
    preserveLogo: true,
    preserveSignature: true,
    modernStyle: true,
    strength: 0.8
  });

  const successful = results.filter(r => r.success).length;
  console.log(`\n✅ Batch complete: ${successful}/${files.length} successful\n`);
}

/**
 * Example 6: Vintage Preservation
 */
async function example6_vintagePreservation() {
  console.log('\n📘 Example 6: Vintage Preservation Mode\n');
  console.log('Remove damage while preserving authentic vintage aesthetic');
  console.log('Perfect for: Archival projects, vintage collectors');
  console.log('━'.repeat(50));

  const inputPath = './samples/page01.jpg';
  
  if (!fs.existsSync(inputPath)) {
    console.log('⚠️  Sample image not found.');
    return;
  }

  const outputPath = path.join(OUTPUT_DIR, 'example6_vintage.jpg');

  await restorer.restoreDamage(inputPath, outputPath, {
    preserveLogo: true,
    preserveSignature: true,
    modernStyle: false, // No modern remaster
    strength: 0.7,
    customInstructions: 'Preserve halftone dot patterns and vintage color palette. Only remove physical damage.'
  });

  console.log(`\n✅ Saved: ${outputPath}\n`);
}

/**
 * Example 7: Custom Prompt Engineering
 */
async function example7_customPrompt() {
  console.log('\n📘 Example 7: Custom Prompt Engineering\n');
  console.log('Use specific instructions for unique restoration needs');
  console.log('Perfect for: Special cases requiring precise control');
  console.log('━'.repeat(50));

  const inputPath = './samples/page01.jpg';
  
  if (!fs.existsSync(inputPath)) {
    console.log('⚠️  Sample image not found.');
    return;
  }

  const outputPath = path.join(OUTPUT_DIR, 'example7_custom.jpg');

  await restorer.restoreDamage(inputPath, outputPath, {
    preserveLogo: true,
    preserveSignature: true,
    modernStyle: true,
    strength: 0.8,
    customInstructions: 'Focus on removing water stains and mildew spots. Preserve the original line weight and ink quality. Keep the newsprint texture visible.'
  });

  console.log(`\n✅ Saved: ${outputPath}\n`);
}

/**
 * Main menu
 */
async function main() {
  const example = process.argv[2];

  console.log('\n🤖 AI Damage Restoration Examples\n');
  console.log('Using Google Nano Banana via Replicate\n');

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ Error: REPLICATE_API_TOKEN not found in environment');
    console.error('   Set it in .env file or environment variables');
    console.error('   Get your token from: https://replicate.com/account/api-tokens');
    process.exit(1);
  }

  try {
    switch (example) {
      case '1':
        await example1_basicRestoration();
        break;
      case '2':
        await example2_heavyDamage();
        break;
      case '3':
        await example3_subtleEnhancement();
        break;
      case '4':
        await example4_withComparison();
        break;
      case '5':
        await example5_batchProcessing();
        break;
      case '6':
        await example6_vintagePreservation();
        break;
      case '7':
        await example7_customPrompt();
        break;
      case 'all':
        await example1_basicRestoration();
        await example2_heavyDamage();
        await example3_subtleEnhancement();
        await example4_withComparison();
        await example6_vintagePreservation();
        await example7_customPrompt();
        // Skip example5 (batch) in 'all' mode
        break;
      default:
        console.log('Available examples:\n');
        console.log('  1 - Basic Damage Removal (recommended starting point)');
        console.log('  2 - Heavy Damage (Golden Age comics)');
        console.log('  3 - Subtle Enhancement (Modern comics)');
        console.log('  4 - With Before/After Comparison');
        console.log('  5 - Batch Processing');
        console.log('  6 - Vintage Preservation Mode');
        console.log('  7 - Custom Prompt Engineering');
        console.log('  all - Run all examples (except batch)\n');
        console.log('Usage: node examples-ai-damage.js <number>\n');
        console.log('Example: node examples-ai-damage.js 1\n');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
