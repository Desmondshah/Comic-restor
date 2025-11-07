#!/usr/bin/env node

/**
 * Command-line interface for comic restoration pipeline
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { restorePage } from "./restore.js";
import { createPrintPDF } from "./pdf-export.js";
import { processDirectory, batchProcess } from "./batch-processor.js";
import { loadConfig, validateConfig, createExampleConfig } from "./config.js";

const program = new Command();

// Package info
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
);

program
  .name("comic-restore")
  .description("Professional comic scan restoration with AI models")
  .version(packageJson.version);

// Single file restoration
program
  .command("restore")
  .description("Restore a single comic page")
  .requiredOption("-i, --input <path>", "Input image file")
  .option("-o, --output <path>", "Output PDF file")
  .option("-m, --mask <path>", "Mask file for damage inpainting")
  .option("--scale <number>", "Upscale factor (1-4)", parseFloat, 2)
  .option("--face-enhance", "Enable face enhancement in upscaling")
  .option("--face-restore", "Use GFPGAN for face restoration (use sparingly)")
  .option("--ocr", "Extract text with OCR")
  .option("--dpi <number>", "Output DPI", parseFloat, 300)
  .option("--width <number>", "Page width in inches", parseFloat, 6.625)
  .option("--height <number>", "Page height in inches", parseFloat, 10.25)
  .option("--bleed <number>", "Bleed in inches", parseFloat, 0.125)
  .option("--matte-compensation <number>", "Matte paper midtone lift", parseFloat, 5)
  .option("--config <path>", "Config file path")
  .action(async (options) => {
    await runSingleRestore(options);
  });

// Batch processing
program
  .command("batch")
  .description("Batch process multiple comic pages")
  .requiredOption("-i, --input <path>", "Input directory")
  .option("-o, --output <path>", "Output directory", "output")
  .option("--combine", "Combine all pages into single PDF")
  .option("--scale <number>", "Upscale factor (1-4)", parseFloat, 2)
  .option("--face-enhance", "Enable face enhancement in upscaling")
  .option("--face-restore", "Use GFPGAN for face restoration (use sparingly)")
  .option("--ocr", "Extract text with OCR")
  .option("--dpi <number>", "Output DPI", parseFloat, 300)
  .option("--width <number>", "Page width in inches", parseFloat, 6.625)
  .option("--height <number>", "Page height in inches", parseFloat, 10.25)
  .option("--bleed <number>", "Bleed in inches", parseFloat, 0.125)
  .option("--matte-compensation <number>", "Matte paper midtone lift", parseFloat, 5)
  .option("--concurrency <number>", "Number of concurrent jobs", parseFloat, 1)
  .option("--config <path>", "Config file path")
  .action(async (options) => {
    await runBatchRestore(options);
  });

// Generate example config
program
  .command("init")
  .description("Create example configuration file")
  .option("-o, --output <path>", "Output config file", "config.json")
  .action((options) => {
    createExampleConfig(options.output);
  });

// Default command (shorthand for restore)
program
  .option("-i, --input <path>", "Input image file or directory")
  .option("-o, --output <path>", "Output PDF file or directory")
  .option("-b, --batch", "Batch mode (process directory)")
  .option("-m, --mask <path>", "Mask file for damage inpainting")
  .option("--scale <number>", "Upscale factor (1-4)", parseFloat)
  .option("--face-enhance", "Enable face enhancement")
  .option("--face-restore", "Use GFPGAN for face restoration")
  .option("--ocr", "Extract text with OCR")
  .option("--dpi <number>", "Output DPI", parseFloat)
  .option("--width <number>", "Page width in inches", parseFloat)
  .option("--height <number>", "Page height in inches", parseFloat)
  .option("--bleed <number>", "Bleed in inches", parseFloat)
  .option("--matte-compensation <number>", "Matte paper midtone lift", parseFloat)
  .option("--combine", "Combine pages into single PDF")
  .option("--config <path>", "Config file path")
  .action(async (options) => {
    if (options.input) {
      if (options.batch || fs.lstatSync(options.input).isDirectory()) {
        await runBatchRestore({
          ...options,
          output: options.output || "output"
        });
      } else {
        await runSingleRestore(options);
      }
    } else {
      program.help();
    }
  });

/**
 * Run single file restoration
 */
async function runSingleRestore(options) {
  // Check API token
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error(chalk.red("✗ REPLICATE_API_TOKEN not found in environment"));
    console.error("  Set it in .env file or environment variables");
    console.error("  Get your token from: https://replicate.com/account/api-tokens");
    process.exit(1);
  }

  // Load config
  const config = loadConfig(options, options.config);

  // Validate config
  const validation = validateConfig(config);
  if (validation.warnings.length > 0) {
    validation.warnings.forEach(w => console.warn(chalk.yellow(`⚠️  ${w}`)));
  }
  if (!validation.valid) {
    validation.errors.forEach(e => console.error(chalk.red(`✗ ${e}`)));
    process.exit(1);
  }

  // Check input file
  if (!fs.existsSync(options.input)) {
    console.error(chalk.red(`✗ Input file not found: ${options.input}`));
    process.exit(1);
  }

  console.log(chalk.bold.blue("\n📘 Comic Restoration Pipeline"));
  console.log(chalk.gray("━".repeat(50)));
  console.log(`Input:  ${options.input}`);

  const spinner = ora("Initializing restoration...").start();

  try {
    // Restore page
    spinner.text = "Restoring comic page (this may take a few minutes)...";
    
    const restoredBuffer = await restorePage(options.input, {
      maskPath: options.mask,
      scale: config.upscale.scale,
      faceEnhance: config.upscale.faceEnhance,
      useFaceRestore: config.faceRestore.enabled,
      extractOCR: config.ocr.enabled
    });

    // Generate output path
    const outputPath = options.output || options.input.replace(
      /\.(jpg|jpeg|png|tif|tiff)$/i,
      "_restored.pdf"
    );

    // Export to PDF
    spinner.text = "Generating print-ready PDF...";
    
    await createPrintPDF(restoredBuffer, outputPath, {
      widthIn: config.pdf.widthIn,
      heightIn: config.pdf.heightIn,
      dpi: config.pdf.dpi,
      bleedIn: config.pdf.bleedIn,
      matteCompensation: config.matteCompensation,
      title: path.basename(options.input, path.extname(options.input)),
      author: config.output.author
    });

    spinner.succeed(chalk.green(`✓ Restoration complete!`));
    console.log(`Output: ${outputPath}`);

  } catch (error) {
    spinner.fail(chalk.red("✗ Restoration failed"));
    console.error(chalk.red(error.message));
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Run batch restoration
 */
async function runBatchRestore(options) {
  // Check API token
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error(chalk.red("✗ REPLICATE_API_TOKEN not found in environment"));
    console.error("  Set it in .env file or environment variables");
    console.error("  Get your token from: https://replicate.com/account/api-tokens");
    process.exit(1);
  }

  // Load config
  const config = loadConfig(options, options.config);

  // Validate config
  const validation = validateConfig(config);
  if (validation.warnings.length > 0) {
    validation.warnings.forEach(w => console.warn(chalk.yellow(`⚠️  ${w}`)));
  }
  if (!validation.valid) {
    validation.errors.forEach(e => console.error(chalk.red(`✗ ${e}`)));
    process.exit(1);
  }

  // Check input directory
  if (!fs.existsSync(options.input)) {
    console.error(chalk.red(`✗ Input directory not found: ${options.input}`));
    process.exit(1);
  }

  console.log(chalk.bold.blue("\n📚 Comic Restoration Pipeline - Batch Mode"));
  console.log(chalk.gray("━".repeat(50)));
  console.log(`Input:  ${options.input}`);
  console.log(`Output: ${options.output}`);
  console.log(chalk.gray("━".repeat(50)) + "\n");

  try {
    const results = await processDirectory(options.input, options.output, {
      scale: config.upscale.scale,
      faceEnhance: config.upscale.faceEnhance,
      useFaceRestore: config.faceRestore.enabled,
      extractOCR: config.ocr.enabled,
      widthIn: config.pdf.widthIn,
      heightIn: config.pdf.heightIn,
      dpi: config.pdf.dpi,
      bleedIn: config.pdf.bleedIn,
      matteCompensation: config.matteCompensation,
      concurrency: config.batch.concurrency,
      createSinglePDF: options.combine || config.batch.createSinglePDF,
      runQA: config.qa.enabled,
      checkPrintReadiness: config.qa.checkPrintReadiness,
      author: config.output.author
    });

    console.log(chalk.green("\n✓ Batch restoration complete!"));
    console.log(`  Completed: ${results.completed}`);
    console.log(`  Failed: ${results.failed}`);
    
    if (results.combinedPDF) {
      console.log(`  Combined PDF: ${results.combinedPDF}`);
    }

  } catch (error) {
    console.error(chalk.red("\n✗ Batch restoration failed"));
    console.error(chalk.red(error.message));
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Parse CLI arguments
program.parse();
