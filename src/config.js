/**
 * Configuration management
 * Loads and merges config from file, environment, and CLI args
 */

import fs from "node:fs";
import path from "node:path";

const DEFAULT_CONFIG = {
  upscale: {
    scale: 2,
    faceEnhance: false
  },
  inpainting: {
    autoDetectMask: true
  },
  faceRestore: {
    enabled: false,
    version: "v1.4"
  },
  ocr: {
    enabled: false,
    saveText: true
  },
  // Color correction & tone mapping
  colorCorrection: {
    enabled: true,
    removeCast: true,
    castStrength: 0.5,
    applyLevels: true,
    whitePoint: 235,      // Lift whites (reduced to preserve colors)
    blackPoint: 15,       // Deepen blacks (increased to preserve shadows)
    applySaturation: true,
    redYellowBoost: 1.1,
    blueGreenReduce: 0.92,
    applyClarity: true,
    clarityRadius: 2,
    clarityAmount: 0.5,
    addGrain: false,
    grainStrength: 0.03
  },
  // Matte stock prepress
  matteStock: {
    enabled: true,
    midtoneLift: 6,       // +5-8 midtone lift
    shadowCompress: 0.95,
    saturateReduce: 0.96
  },
  // CMYK conversion
  cmyk: {
    enabled: false,       // Enable for print workflow
    gcrStrength: 0.8,     // Gray Component Replacement
    tacLimit: 300,        // Total Area Coverage limit (280-340%)
    applyRichBlack: true,
    forceLineArtToK: true,
    compensateDotGain: true,
    dotGainAmount: 15     // Expected dot gain % on matte
  },
  // Reference page matching
  referenceMatching: {
    enabled: false,
    referencePage: null,  // Path to hero page
    matchStrength: 0.8
  },
  pdf: {
    widthIn: 6.625,       // Standard comic width
    heightIn: 10.25,      // Standard comic height
    dpi: 300,             // Print resolution
    bleedIn: 0.125        // 1/8" bleed
  },
  // Quality assurance
  qa: {
    enabled: true,
    checkHistogram: true,
    clippingThreshold: 0.005,  // 0.5%
    checkSSIM: true,
    minSSIM: 0.92,
    checkEdges: true,
    maxEdgeDensity: 0.25,      // Warn if >25% edges
    checkTint: true,
    checkContrast: true,
    minContrast: 7.0,          // WCAG AAA standard
    checkPrintReadiness: true,
    minDPI: 300,
    minSharpness: 100
  },
  batch: {
    concurrency: 1,       // Sequential processing (API limits)
    createSinglePDF: false
  },
  output: {
    directory: "output",
    author: "",
    saveCMYKChannels: false  // Export CMYK separations for inspection
  }
};

/**
 * Load config from JSON file
 * @param {string} configPath - Path to config file
 * @returns {Object} Config object or null
 */
export function loadConfigFile(configPath) {
  if (!configPath || !fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Warning: Failed to load config from ${configPath}:`, error.message);
    return null;
  }
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Load and merge configuration from multiple sources
 * Priority: CLI args > config file > defaults
 * @param {Object} cliOptions - Options from CLI
 * @param {string} configPath - Path to config file (optional)
 * @returns {Object} Final merged config
 */
export function loadConfig(cliOptions = {}, configPath = null) {
  // Start with defaults
  let config = { ...DEFAULT_CONFIG };

  // Try to load from default locations if not specified
  if (!configPath) {
    const defaultPaths = [
      'config.json',
      '.comic-restore.json',
      path.join(process.env.HOME || process.env.USERPROFILE || '', '.comic-restore.json')
    ];

    for (const defaultPath of defaultPaths) {
      if (fs.existsSync(defaultPath)) {
        configPath = defaultPath;
        break;
      }
    }
  }

  // Merge config file if found
  if (configPath) {
    const fileConfig = loadConfigFile(configPath);
    if (fileConfig) {
      console.log(`Loaded config from: ${configPath}`);
      config = deepMerge(config, fileConfig);
    }
  }

  // Merge CLI options (highest priority)
  if (cliOptions.scale !== undefined) {
    config.upscale.scale = cliOptions.scale;
  }
  if (cliOptions.faceEnhance !== undefined) {
    config.upscale.faceEnhance = cliOptions.faceEnhance;
  }
  if (cliOptions.useFaceRestore !== undefined) {
    config.faceRestore.enabled = cliOptions.useFaceRestore;
  }
  if (cliOptions.extractOCR !== undefined) {
    config.ocr.enabled = cliOptions.extractOCR;
  }
  if (cliOptions.widthIn !== undefined) {
    config.pdf.widthIn = cliOptions.widthIn;
  }
  if (cliOptions.heightIn !== undefined) {
    config.pdf.heightIn = cliOptions.heightIn;
  }
  if (cliOptions.dpi !== undefined) {
    config.pdf.dpi = cliOptions.dpi;
  }
  if (cliOptions.bleedIn !== undefined) {
    config.pdf.bleedIn = cliOptions.bleedIn;
  }
  if (cliOptions.matteCompensation !== undefined) {
    config.matteCompensation = cliOptions.matteCompensation;
  }
  if (cliOptions.concurrency !== undefined) {
    config.batch.concurrency = cliOptions.concurrency;
  }
  if (cliOptions.combinePDF !== undefined) {
    config.batch.createSinglePDF = cliOptions.combinePDF;
  }
  if (cliOptions.author !== undefined) {
    config.output.author = cliOptions.author;
  }

  return config;
}

/**
 * Create example config file
 * @param {string} outputPath - Where to save example config
 */
export function createExampleConfig(outputPath = 'config.example.json') {
  const exampleConfig = {
    ...DEFAULT_CONFIG,
    _comments: {
      upscale: "Real-ESRGAN upscaling settings",
      scale: "2x is usually enough for print, 4x for extreme detail",
      faceEnhance: "Keep false for stylized comic art",
      matteCompensation: "Lift midtones by 5-8 to prevent darkening on matte paper",
      pdf: "Print-ready PDF specifications",
      dpi: "300 minimum for print, 600 for highest quality",
      bleedIn: "0.125 inch (1/8\") is standard bleed",
      qa: "Quality assurance checks",
      batch: "Batch processing settings - keep concurrency at 1 for API limits"
    }
  };

  fs.writeFileSync(outputPath, JSON.stringify(exampleConfig, null, 2));
  console.log(`Example config created: ${outputPath}`);
}

/**
 * Validate configuration
 * @param {Object} config - Config to validate
 * @returns {Object} Validation result
 */
export function validateConfig(config) {
  const errors = [];
  const warnings = [];

  // Validate scale
  if (config.upscale.scale < 1 || config.upscale.scale > 4) {
    warnings.push("Scale should be between 1 and 4");
  }

  // Validate DPI
  if (config.pdf.dpi < 150) {
    warnings.push("DPI below 150 may result in poor print quality");
  }
  if (config.pdf.dpi < 300) {
    warnings.push("DPI below 300 may not meet professional print standards");
  }

  // Validate dimensions
  if (config.pdf.widthIn <= 0 || config.pdf.heightIn <= 0) {
    errors.push("PDF dimensions must be positive");
  }

  // Validate bleed
  if (config.pdf.bleedIn < 0) {
    errors.push("Bleed cannot be negative");
  }
  if (config.pdf.bleedIn > 0.5) {
    warnings.push("Bleed over 0.5 inches is unusually large");
  }

  // Validate concurrency
  if (config.batch.concurrency > 2) {
    warnings.push("High concurrency may hit Replicate API rate limits");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export default {
  DEFAULT_CONFIG,
  loadConfigFile,
  loadConfig,
  createExampleConfig,
  validateConfig
};
