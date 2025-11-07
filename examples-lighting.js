/**
 * Premium Lighting Effects Examples
 * Demonstrates all lighting presets
 */

import { applyLightingPreset, applyPremiumLighting } from './src/lighting-effects.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Apply all lighting presets to an image for comparison
 */
async function demonstrateLightingPresets(inputPath) {
  console.log('\n✨ Premium Lighting Effects Demo\n');
  console.log(`Input: ${inputPath}\n`);

  const imageBuffer = fs.readFileSync(inputPath);
  const basename = path.basename(inputPath, path.extname(inputPath));
  const outputDir = './output/lighting-examples';

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const presets = [
    'modern-reprint',
    'dramatic',
    'subtle',
    'vintage-enhanced'
  ];

  console.log('Applying presets...\n');

  for (const preset of presets) {
    console.log(`🎨 Processing: ${preset}`);
    
    try {
      const enhanced = await applyLightingPreset(imageBuffer, preset);
      const outputPath = path.join(outputDir, `${basename}_${preset}.png`);
      
      fs.writeFileSync(outputPath, enhanced);
      console.log(`   ✓ Saved: ${outputPath}\n`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('✨ Demo complete! Check the output/lighting-examples folder.\n');
}

/**
 * Custom lighting example
 */
async function customLightingExample(inputPath) {
  console.log('\n🎛️ Custom Lighting Example\n');

  const imageBuffer = fs.readFileSync(inputPath);
  const basename = path.basename(inputPath, path.extname(inputPath));
  const outputDir = './output/lighting-examples';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Applying custom lighting settings...\n');

  const customSettings = {
    // Strong dramatic lighting
    addDepth: true,
    depthStrength: 0.5,
    lightDirection: 'top-left',
    
    // Bright highlights
    addHighlights: true,
    highlightIntensity: 0.4,
    highlightThreshold: 180,
    
    // Strong rim light (cool blue instead of warm)
    addRimLight: true,
    rimLightColor: [200, 220, 255], // Cool blue rim light
    rimLightStrength: 0.35,
    
    // Deep shadows
    addAO: true,
    aoStrength: 0.3,
    
    // High clarity
    clarity: 0.4,
    
    // Strong contrast
    contrastBoost: 1.2,
    vibrance: 1.15,
    
    // Cinematic vignette
    addVignette: true,
    vignetteStrength: 0.25,
    
    // Full effect
    effectOpacity: 0.85
  };

  try {
    const enhanced = await applyPremiumLighting(imageBuffer, customSettings);
    const outputPath = path.join(outputDir, `${basename}_custom.png`);
    
    fs.writeFileSync(outputPath, enhanced);
    console.log(`✓ Saved: ${outputPath}\n`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }
}

// ============ RUN EXAMPLES ============

// Check for command line argument
const inputPath = process.argv[2];

if (!inputPath) {
  console.log(`
Usage:
  node examples-lighting.js <input-image.jpg>

Examples:
  node examples-lighting.js samples/vintage-comic.jpg
  node examples-lighting.js samples/superhero-cover.jpg

This will create multiple versions with different lighting presets
in the output/lighting-examples folder.
  `);
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`❌ File not found: ${inputPath}`);
  process.exit(1);
}

// Run demonstrations
(async () => {
  await demonstrateLightingPresets(inputPath);
  await customLightingExample(inputPath);
  
  console.log('🎉 All examples complete!\n');
  console.log('Compare the results:');
  console.log('  • modern-reprint  - Balanced, professional');
  console.log('  • dramatic        - High contrast, bold');
  console.log('  • subtle          - Gentle enhancement');
  console.log('  • vintage-enhanced- Classic warm look');
  console.log('  • custom          - Cool blue rim, strong contrast\n');
})();
