/**
 * Web server for Comic Restoration Pipeline
 * Provides REST API and web interface for comic restoration
 */

import express from "express";
import multer from "multer";
import cors from "cors";
import { WebSocketServer } from "ws";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import sharp from "sharp";

import { restorePage } from "./restore.js";
import { analyzeQuality, checkPrintReadiness } from "./qa-checks.js";
import { loadConfig } from "./config.js";
import { batchProcess } from "./batch-processor.js";
import { createMultiPagePDF } from "./pdf-export.js";
import { AIDamageRestoration } from "./ai-damage-restoration.js";

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment from project root
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Create directories
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const OUTPUT_DIR = path.join(__dirname, "..", "output");
const TEMP_DIR = path.join(__dirname, "..", "temp");

[UPLOAD_DIR, OUTPUT_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|tiff|tif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, TIFF) are allowed"));
    }
  }
});

// Job storage
const jobs = new Map();
let jobIdCounter = 1;

// WebSocket clients
let wsClients = new Set();

/**
 * Broadcast message to all WebSocket clients
 */
function broadcast(message) {
  const data = JSON.stringify(message);
  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(data);
    }
  });
}

/**
 * Update job status and notify clients
 */
function updateJobStatus(jobId, updates) {
  const job = jobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
    broadcast({
      type: "job-update",
      jobId,
      job
    });
  }
}

/**
 * Process restoration job
 */
async function processJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    updateJobStatus(jobId, { status: "processing", progress: 10 });

    // Load configuration
    const config = loadConfig(job.options);

    // Debug logging
    console.log('\n🔍 DEBUG: Job Options:', {
      enableAIRestore: job.options.enableAIRestore,
      aiStrength: job.options.aiStrength,
      aiPreserveLogo: job.options.aiPreserveLogo,
      aiPreserveSignature: job.options.aiPreserveSignature,
      aiModernStyle: job.options.aiModernStyle
    });

    let restoredBuffer;
    
    // Check if AI damage restoration is enabled
    if (job.options.enableAIRestore) {
      console.log('✅ AI Damage Restoration ENABLED - Running Google Nano Banana...');
      
      // Step 1: AI Damage Restoration
      updateJobStatus(jobId, { status: "processing", stage: "ai-damage-restoration", progress: 20 });
      
      const restorer = new AIDamageRestoration();
      const basename = path.basename(job.inputPath, path.extname(job.inputPath));
      const aiOutputPath = path.join(TEMP_DIR, `${basename}_ai_restored.jpg`);
      
      const aiOptions = {
        preserveLogo: job.options.aiPreserveLogo !== false,
        preserveSignature: job.options.aiPreserveSignature !== false,
        modernStyle: job.options.aiModernStyle !== false,
        strength: job.options.aiStrength || 0.8,
      };
      
      await restorer.restoreDamage(job.inputPath, aiOutputPath, aiOptions);
      
      // Use AI-restored image as input for next step
      updateJobStatus(jobId, { status: "processing", stage: "upscaling", progress: 50 });
      
      restoredBuffer = await restorePage(aiOutputPath, {
        maskPath: job.maskPath,
        scale: job.options.scale || config.upscale.scale,
        faceEnhance: job.options.faceEnhance || config.upscale.faceEnhance,
        useFaceRestore: job.options.useFaceRestore || config.faceRestore.enabled,
        extractOCR: job.options.extractOCR || config.ocr.enabled,
        applyLighting: job.options.lightingPreset !== 'none',
        lightingPreset: job.options.lightingPreset || 'modern-reprint'
      });
      
      // Clean up temp file
      if (fs.existsSync(aiOutputPath)) {
        fs.unlinkSync(aiOutputPath);
      }
    } else {
      console.log('⚠️  AI Damage Restoration DISABLED - Skipping Nano Banana, going straight to upscaling');
      
      // Step 1: Standard Upscaling (without AI damage restoration)
      updateJobStatus(jobId, { status: "processing", stage: "upscaling", progress: 20 });
      
      restoredBuffer = await restorePage(job.inputPath, {
        maskPath: job.maskPath,
        scale: job.options.scale || config.upscale.scale,
        faceEnhance: job.options.faceEnhance || config.upscale.faceEnhance,
        useFaceRestore: job.options.useFaceRestore || config.faceRestore.enabled,
        extractOCR: job.options.extractOCR || config.ocr.enabled,
        applyLighting: job.options.lightingPreset !== 'none',
        lightingPreset: job.options.lightingPreset || 'modern-reprint'
      });
    }

    // Step 2: Quality checks
    updateJobStatus(jobId, { status: "processing", stage: "quality-check", progress: 70 });
    
    if (job.options.runQA !== false) {
      const originalBuffer = fs.readFileSync(job.inputPath);
      const qaResults = await analyzeQuality(restoredBuffer, originalBuffer);
      job.qaResults = qaResults;

      if (job.options.checkPrintReadiness !== false) {
        const printCheck = await checkPrintReadiness(restoredBuffer);
        job.printCheck = printCheck;
      }
    }

    // Step 3: Save restored image with proper DPI
    updateJobStatus(jobId, { status: "processing", stage: "saving", progress: 85 });
    
    const outputFilename = path.basename(job.inputPath, path.extname(job.inputPath)) + "_restored.png";
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    // Save as PNG with DPI metadata
    const dpi = job.options.dpi || config.pdf.dpi;
    await sharp(restoredBuffer)
      .withMetadata({ density: dpi })
      .png({ compressionLevel: 9, quality: 100 })
      .toFile(outputPath);

    console.log(`✓ Saved: ${outputPath} @ ${dpi} DPI`);

    // Success!
    updateJobStatus(jobId, {
      status: "completed",
      progress: 100,
      outputPath,
      outputFilename,
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    
    // Enhanced error messages
    let errorMessage = error.message;
    let errorDetail = '';
    
    if (error.message.includes('402') || error.message.includes('Insufficient credit')) {
      errorMessage = 'Insufficient Replicate credits';
      errorDetail = 'Credits purchased? Please wait 2-5 minutes for activation, then try again.';
    } else if (error.message.includes('401') || error.message.includes('Unauthenticated')) {
      errorMessage = 'API authentication failed';
      errorDetail = 'Check your REPLICATE_API_TOKEN in .env file';
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorMessage = 'API rate limit reached';
      errorDetail = 'Please wait a few minutes before trying again';
    }
    
    updateJobStatus(jobId, {
      status: "failed",
      error: errorMessage,
      errorDetail: errorDetail,
      failedAt: new Date().toISOString()
    });
  }
}

/**
 * Process batch restoration job
 */
async function processBatchJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    updateJobStatus(jobId, { status: "processing", progress: 5 });

    // Load configuration
    const config = loadConfig(job.options);

    const restoredBuffers = [];
    const failedFiles = [];
    const totalFiles = job.inputPaths.length;

    // Process each file
    for (let i = 0; i < job.inputPaths.length; i++) {
      const inputPath = job.inputPaths[i];
      const filename = path.basename(inputPath);
      
      try {
        updateJobStatus(jobId, {
          status: "processing",
          stage: `Processing ${i + 1}/${totalFiles}: ${filename}`,
          progress: Math.round(10 + (i / totalFiles) * 70),
          processedCount: i
        });

        console.log(`[Batch ${jobId}] Processing ${i + 1}/${totalFiles}: ${filename}`);

        // Validate image format first
        try {
          const metadata = await sharp(inputPath).metadata();
          console.log(`  Image format: ${metadata.format}, size: ${metadata.width}x${metadata.height}`);
          
          // Convert to a standard format if needed
          let imageBuffer;
          if (metadata.format === 'jpeg' || metadata.format === 'jpg' || metadata.format === 'png') {
            imageBuffer = await sharp(inputPath).toBuffer();
          } else {
            // Convert unsupported formats to PNG first
            console.log(`  Converting ${metadata.format} to PNG...`);
            imageBuffer = await sharp(inputPath).png().toBuffer();
          }
          
          // Save validated image temporarily
          const tempPath = path.join(TEMP_DIR, `validated_${filename}.png`);
          await sharp(imageBuffer).png().toFile(tempPath);
          
          // Restore the page using validated image
          const restoredBuffer = await restorePage(tempPath, {
            maskPath: job.maskPath,
            scale: job.options.scale || config.upscale.scale,
            faceEnhance: job.options.faceEnhance || config.upscale.faceEnhance,
            useFaceRestore: job.options.useFaceRestore || config.faceRestore.enabled,
            extractOCR: job.options.extractOCR || config.ocr.enabled,
            // Lighting options
            applyLighting: job.options.lightingPreset !== 'none',
            lightingPreset: job.options.lightingPreset || 'modern-reprint'
          });

          console.log(`  Restored buffer size: ${restoredBuffer.length} bytes`);
          
          // Verify the restored buffer is valid
          const restoredMetadata = await sharp(restoredBuffer).metadata();
          console.log(`  Restored format: ${restoredMetadata.format}, ${restoredMetadata.width}x${restoredMetadata.height}`);

          restoredBuffers.push(restoredBuffer);

          // Save individual restored image
          const outputFilename = path.basename(inputPath, path.extname(inputPath)) + "_restored.png";
          const outputPath = path.join(OUTPUT_DIR, outputFilename);

          const dpi = job.options.dpi || config.pdf.dpi;
          await sharp(restoredBuffer)
            .withMetadata({ density: dpi })
            .png({ compressionLevel: 9, quality: 100 })
            .toFile(outputPath);

          console.log(`✓ Saved: ${outputPath} @ ${dpi} DPI`);
          
          // Clean up temp file
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          
        } catch (validationError) {
          throw new Error(`Image validation failed: ${validationError.message}`);
        }

      } catch (error) {
        console.error(`✗ Error processing ${filename}:`, error.message);
        failedFiles.push({ filename, error: error.message });
        // Continue with other files even if one fails
      }
    }

    // Create PDF if requested
    let pdfPath = null;
    let pdfFilename = null;

    if (job.options.exportPDF && restoredBuffers.length > 0) {
      updateJobStatus(jobId, {
        status: "processing",
        stage: "Creating PDF",
        progress: 85,
        processedCount: totalFiles
      });

      console.log(`\n[Batch ${jobId}] Creating multi-page PDF with ${restoredBuffers.length} pages...`);
      console.log(`Buffers ready for PDF:`);
      for (let i = 0; i < restoredBuffers.length; i++) {
        console.log(`  Page ${i + 1}: ${restoredBuffers[i].length} bytes, isBuffer: ${Buffer.isBuffer(restoredBuffers[i])}`);
      }

      pdfFilename = `batch_${jobId}_restored.pdf`;
      pdfPath = path.join(OUTPUT_DIR, pdfFilename);

      try {
        await createMultiPagePDF(restoredBuffers, pdfPath, {
          widthIn: 6.625,
          heightIn: 10.25,
          dpi: job.options.dpi || config.pdf.dpi,
          bleedIn: job.options.bleedIn || config.pdf.bleed,
          matteCompensation: job.options.matteCompensation || 5,
          title: "Restored Comic Book - Batch " + jobId,
          author: ""
        });

        console.log(`✓ PDF created: ${pdfPath}`);
      } catch (pdfError) {
        console.error(`❌ PDF creation failed:`, pdfError.message);
        console.error(`Stack trace:`, pdfError.stack);
        throw new Error(`PDF export failed: ${pdfError.message}`);
      }
    }

    // Success!
    updateJobStatus(jobId, {
      status: "completed",
      progress: 100,
      processedCount: totalFiles,
      successCount: restoredBuffers.length,
      failedCount: totalFiles - restoredBuffers.length,
      failedFiles: failedFiles.length > 0 ? failedFiles : undefined,
      outputPath: pdfPath,
      outputFilename: pdfFilename,
      completedAt: new Date().toISOString()
    });

    console.log(`✓ Batch job ${jobId} completed: ${restoredBuffers.length}/${totalFiles} successful`);
    if (failedFiles.length > 0) {
      console.log(`  Failed files:`);
      failedFiles.forEach(f => console.log(`    - ${f.filename}: ${f.error}`));
    }

  } catch (error) {
    console.error(`Batch job ${jobId} failed:`, error);
    
    // Enhanced error messages
    let errorMessage = error.message;
    let errorDetail = '';
    
    if (error.message.includes('402') || error.message.includes('Insufficient credit')) {
      errorMessage = 'Insufficient Replicate credits';
      errorDetail = 'Credits purchased? Please wait 2-5 minutes for activation, then try again.';
    } else if (error.message.includes('401') || error.message.includes('Unauthenticated')) {
      errorMessage = 'API authentication failed';
      errorDetail = 'Check your REPLICATE_API_TOKEN in .env file';
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorMessage = 'API rate limit reached';
      errorDetail = 'Please wait a few minutes before trying again';
    }
    
    updateJobStatus(jobId, {
      status: "failed",
      error: errorMessage,
      errorDetail: errorDetail,
      failedAt: new Date().toISOString()
    });
  }
}

// ============ API ROUTES ============

/**
 * GET / - Serve web interface
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

/**
 * GET /api/health - Health check
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    hasApiToken: !!process.env.REPLICATE_API_TOKEN,
    version: "1.0.0"
  });
});

/**
 * GET /api/config - Get default configuration
 */
app.get("/api/config", (req, res) => {
  const config = loadConfig();
  res.json(config);
});

/**
 * POST /api/upload - Upload image file
 */
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({
    success: true,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    path: req.file.path
  });
});

/**
 * POST /api/upload-mask - Upload mask file
 */
app.post("/api/upload-mask", upload.single("mask"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({
    success: true,
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path
  });
});

/**
 * POST /api/restore - Start restoration job
 */
app.post("/api/restore", async (req, res) => {
  if (!process.env.REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "REPLICATE_API_TOKEN not configured" });
  }

  const { filename, maskFilename, options = {} } = req.body;

  if (!filename) {
    return res.status(400).json({ error: "No filename provided" });
  }

  const inputPath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(inputPath)) {
    return res.status(404).json({ error: "File not found" });
  }

  // Create job
  const jobId = jobIdCounter++;
  const job = {
    id: jobId,
    filename,
    inputPath,
    maskPath: maskFilename ? path.join(UPLOAD_DIR, maskFilename) : null,
    options,
    status: "queued",
    progress: 0,
    createdAt: new Date().toISOString()
  };

  jobs.set(jobId, job);

  // Start processing (async)
  processJob(jobId);

  res.json({
    success: true,
    jobId,
    job
  });
});

/**
 * POST /api/restore-batch - Start batch restoration job
 */
app.post("/api/restore-batch", async (req, res) => {
  if (!process.env.REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "REPLICATE_API_TOKEN not configured" });
  }

  const { filenames, maskFilename, options = {} } = req.body;

  if (!filenames || !filenames.length) {
    return res.status(400).json({ error: "No filenames provided" });
  }

  // Verify all files exist
  const inputPaths = [];
  for (const filename of filenames) {
    const inputPath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: `File not found: ${filename}` });
    }
    inputPaths.push(inputPath);
  }

  // Create batch job
  const jobId = jobIdCounter++;
  const job = {
    id: jobId,
    filenames,
    inputPaths,
    maskPath: maskFilename ? path.join(UPLOAD_DIR, maskFilename) : null,
    options,
    isBatch: true,
    fileCount: filenames.length,
    status: "queued",
    progress: 0,
    processedCount: 0,
    createdAt: new Date().toISOString()
  };

  jobs.set(jobId, job);

  // Start batch processing (async)
  processBatchJob(jobId);

  res.json({
    success: true,
    jobId,
    job
  });
});

/**
 * GET /api/jobs/:id - Get job status
 */
app.get("/api/jobs/:id", (req, res) => {
  const jobId = parseInt(req.params.id);
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(job);
});

/**
 * GET /api/jobs - Get all jobs
 */
app.get("/api/jobs", (req, res) => {
  const allJobs = Array.from(jobs.values()).sort((a, b) => b.id - a.id);
  res.json(allJobs);
});

/**
 * DELETE /api/jobs/:id - Delete job
 */
app.delete("/api/jobs/:id", (req, res) => {
  const jobId = parseInt(req.params.id);
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  // Delete uploaded files
  try {
    if (fs.existsSync(job.inputPath)) {
      fs.unlinkSync(job.inputPath);
    }
    if (job.maskPath && fs.existsSync(job.maskPath)) {
      fs.unlinkSync(job.maskPath);
    }
  } catch (error) {
    console.error("Error deleting files:", error);
  }

  jobs.delete(jobId);

  res.json({ success: true });
});

/**
 * GET /api/download/:filename - Download output file
 */
app.get("/api/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(OUTPUT_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(filePath);
});

/**
 * GET /api/preview/:filename - Preview uploaded image
 */
app.get("/api/preview/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.sendFile(filePath);
});

// Start HTTP server (only when not in Vercel)
let server;
let wss;

if (process.env.VERCEL !== '1') {
  server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   📘 Comic Restoration Pipeline - Web Interface       ║
║                                                        ║
║   Server running on: http://localhost:${PORT}         ║
║                                                        ║
║   API Endpoints:                                      ║
║   • POST /api/upload         Upload image             ║
║   • POST /api/restore        Start restoration        ║
║   • GET  /api/jobs/:id       Check job status         ║
║   • GET  /api/download/:file Download PDF             ║
║                                                        ║
║   Press Ctrl+C to stop                                ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);

    if (!process.env.REPLICATE_API_TOKEN) {
      console.warn(`
⚠️  WARNING: REPLICATE_API_TOKEN not set!
   Token value: ${process.env.REPLICATE_API_TOKEN || '(empty)'}
   Add your token to .env file to enable restoration.
   Get token from: https://replicate.com/account/api-tokens
   
   Make sure .env file is in the project root with:
   REPLICATE_API_TOKEN=r8_your_token_here
    `);
    } else {
      console.log(`
✅ API Token loaded: ${process.env.REPLICATE_API_TOKEN.substring(0, 8)}...
    `);
    }
  });

  // Setup WebSocket server (only for local)
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    wsClients.add(ws);

    // Send current jobs on connect
    ws.send(JSON.stringify({
      type: "jobs-list",
      jobs: Array.from(jobs.values())
    }));

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      wsClients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      wsClients.delete(ws);
    });
  });

  // Cleanup on exit
  process.on("SIGINT", () => {
    console.log("\nShutting down server...");
    if (wss) wss.close();
    if (server) {
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    }
  });
}

export default app;
