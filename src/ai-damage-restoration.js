import { writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import Replicate from "replicate";
import sharp from "sharp";

/**
 * AI-Powered Damage Mask Restoration using Google Nano Banana
 * Automatically removes scratches, dust, folds, and other damage
 * while preserving original artwork and composition
 */

export class AIDamageRestoration {
  constructor(apiToken = null) {
    this.replicate = new Replicate({
      auth: apiToken || process.env.REPLICATE_API_TOKEN,
    });
    this.model = "google/nano-banana";
  }

  /**
   * Generate restoration prompt based on user preferences
   */
  generatePrompt(options = {}) {
    const {
      preserveLogo = true,
      preserveSignature = true,
      modernStyle = true,
      customInstructions = "",
    } = options;

    let prompt = "Enhance and modernize this classic comic cover while preserving its original composition and artistic intent.\n\nTasks:\n";
    
    prompt += "• Remove dust, scratches, and paper folds.\n";
    prompt += "• Fix torn edges and missing areas.\n";
    prompt += "• Clean up stains and discoloration.\n";
    
    if (preserveLogo) {
      prompt += "• Maintain original logo, title, and text exactly.\n";
    }
    
    if (preserveSignature) {
      prompt += "• Preserve artist signature exactly.\n";
    }
    
    if (modernStyle) {
      prompt += "• Apply modern Marvel remastered edition style.\n";
    }
    
    if (customInstructions) {
      prompt += `• ${customInstructions}\n`;
    }

    return prompt.trim();
  }

  /**
   * Convert local file path to data URL for Replicate API
   */
  async fileToDataURL(filePath) {
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }

    const buffer = await readFile(filePath);
    const mimeType = this.getMimeType(filePath);
    const base64 = buffer.toString("base64");
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Get MIME type from file extension
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    return mimeTypes[ext] || "image/jpeg";
  }

  /**
   * Process a single image with AI damage restoration
   */
  async restoreDamage(inputPath, outputPath, options = {}) {
    try {
      console.log(`🤖 Processing ${path.basename(inputPath)} with AI damage restoration...`);
      console.log(`📋 Options:`, JSON.stringify(options, null, 2));

      // Check if input file exists
      if (!existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      // Get original image dimensions
      const originalMetadata = await sharp(inputPath).metadata();
      const originalWidth = originalMetadata.width;
      const originalHeight = originalMetadata.height;
      console.log(`📐 Original dimensions: ${originalWidth}x${originalHeight}`);

      // Add padding to prevent cropping by the AI model
      // Padding helps preserve edge details
      const paddingPercent = 0.05; // 5% padding on each side
      const paddingX = Math.round(originalWidth * paddingPercent);
      const paddingY = Math.round(originalHeight * paddingPercent);
      
      console.log(`🔲 Adding ${paddingX}px horizontal and ${paddingY}px vertical padding to preserve edges...`);
      
      // Create padded image
      const paddedBuffer = await sharp(inputPath)
        .extend({
          top: paddingY,
          bottom: paddingY,
          left: paddingX,
          right: paddingX,
          background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
        })
        .toBuffer();
      
      const paddedWidth = originalWidth + (paddingX * 2);
      const paddedHeight = originalHeight + (paddingY * 2);
      console.log(`📐 Padded dimensions: ${paddedWidth}x${paddedHeight}`);

      // Convert padded image to data URL
      const base64Image = paddedBuffer.toString("base64");
      const imageInput = `data:image/jpeg;base64,${base64Image}`;

      // Generate prompt
      const prompt = this.generatePrompt(options);
      console.log(`📝 Using prompt:\n${prompt}`);

      // Prepare input for Replicate
      const replicateInput = {
        prompt: prompt,
        image_input: [imageInput],
      };

      // Add optional parameters
      if (options.strength !== undefined) {
        replicateInput.strength = options.strength; // 0-1, how much to transform
        console.log(`🎚️  Strength: ${options.strength}`);
      }
      if (options.guidance_scale !== undefined) {
        replicateInput.guidance_scale = options.guidance_scale; // How closely to follow prompt
        console.log(`🎯 Guidance Scale: ${options.guidance_scale}`);
      }

      // Run the model
      console.log(`🚀 Sending to Replicate API (Model: ${this.model})...`);
      const output = await this.replicate.run(this.model, { 
        input: replicateInput 
      });
      
      console.log(`✅ Replicate API call completed successfully`);

      // Handle output
      let imageUrl;
      if (typeof output === 'string') {
        imageUrl = output;
      } else if (output && output.url) {
        imageUrl = output.url();
      } else if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0];
      } else {
        throw new Error("Unexpected output format from Replicate");
      }

      console.log(`📥 Downloading result from ${imageUrl}...`);

      // Download the result
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download result: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      let buffer = Buffer.from(arrayBuffer);

      // Check dimensions of AI output
      const restoredMetadata = await sharp(buffer).metadata();
      console.log(`📐 AI output dimensions: ${restoredMetadata.width}x${restoredMetadata.height}`);

      // First, resize to padded dimensions if needed
      if (restoredMetadata.width !== paddedWidth || restoredMetadata.height !== paddedHeight) {
        console.log(`⚠️  AI changed dimensions - resizing to padded size ${paddedWidth}x${paddedHeight}...`);
        buffer = await sharp(buffer)
          .resize(paddedWidth, paddedHeight, {
            fit: 'fill',
            kernel: 'lanczos3'
          })
          .toBuffer();
      }

      // Now crop out the padding to get back to original dimensions
      console.log(`✂️  Removing padding - cropping to original ${originalWidth}x${originalHeight}...`);
      buffer = await sharp(buffer)
        .extract({
          left: paddingX,
          top: paddingY,
          width: originalWidth,
          height: originalHeight
        })
        .toBuffer();

      // Process and save with Sharp for quality optimization
      await sharp(buffer)
        .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
        .toFile(outputPath);

      console.log(`✅ AI restoration complete: ${outputPath}`);

      return {
        success: true,
        inputPath,
        outputPath,
        imageUrl,
      };

    } catch (error) {
      console.error(`❌ Error processing ${inputPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Process image buffer with AI damage restoration (no file I/O)
   * Perfect for serverless environments like Vercel
   */
  async restoreDamageBuffer(inputBuffer, options = {}) {
    try {
      console.log(`🤖 Processing image buffer with AI damage restoration...`);
      console.log(`📋 Options:`, JSON.stringify(options, null, 2));

      // Get original image dimensions
      const originalMetadata = await sharp(inputBuffer).metadata();
      const originalWidth = originalMetadata.width;
      const originalHeight = originalMetadata.height;
      console.log(`📐 Original dimensions: ${originalWidth}x${originalHeight}`);

      // Add padding to prevent cropping by the AI model
      const paddingPercent = 0.05; // 5% padding
      const paddingX = Math.round(originalWidth * paddingPercent);
      const paddingY = Math.round(originalHeight * paddingPercent);
      
      console.log(`🔲 Adding ${paddingX}px horizontal and ${paddingY}px vertical padding...`);
      
      // Create padded image
      const paddedBuffer = await sharp(inputBuffer)
        .extend({
          top: paddingY,
          bottom: paddingY,
          left: paddingX,
          right: paddingX,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toBuffer();
      
      const paddedWidth = originalWidth + (paddingX * 2);
      const paddedHeight = originalHeight + (paddingY * 2);
      console.log(`📐 Padded dimensions: ${paddedWidth}x${paddedHeight}`);

      // Convert to data URL
      const base64Image = paddedBuffer.toString("base64");
      const imageInput = `data:image/jpeg;base64,${base64Image}`;

      // Generate prompt
      const prompt = this.generatePrompt(options);
      console.log(`📝 Using prompt:\n${prompt}`);

      // Prepare input for Replicate
      const replicateInput = {
        prompt: prompt,
        image_input: [imageInput],
      };

      if (options.strength !== undefined) {
        replicateInput.strength = options.strength;
        console.log(`🎚️  Strength: ${options.strength}`);
      }
      if (options.guidance_scale !== undefined) {
        replicateInput.guidance_scale = options.guidance_scale;
        console.log(`🎯 Guidance Scale: ${options.guidance_scale}`);
      }

      // Run AI model
      console.log("🚀 Running Nano Banana model on Replicate...");
      console.log("⏱️  This typically takes 30-60 seconds...");

      const output = await this.replicate.run(this.model, {
        input: replicateInput,
      });

      if (!output || !output[0]) {
        throw new Error("No output received from Replicate");
      }

      const imageUrl = output[0];
      console.log(`📥 Downloading restored image from: ${imageUrl}`);

      // Download result
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download result: ${response.status}`);
      }

      let buffer = Buffer.from(await response.arrayBuffer());
      console.log(`✅ Downloaded: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);

      // Remove padding to return to original dimensions
      console.log(`✂️  Removing padding to restore original dimensions...`);
      buffer = await sharp(buffer)
        .extract({
          left: paddingX,
          top: paddingY,
          width: originalWidth,
          height: originalHeight
        })
        .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
        .toBuffer();

      console.log(`✅ AI restoration complete (buffer)`);

      return buffer;

    } catch (error) {
      console.error(`❌ Error processing buffer:`, error.message);
      throw error;
    }
  }

  /**
   * Batch process multiple images
   */
  async restoreBatch(inputPaths, outputDir, options = {}) {
    const results = [];
    
    for (let i = 0; i < inputPaths.length; i++) {
      const inputPath = inputPaths[i];
      const basename = path.basename(inputPath, path.extname(inputPath));
      const outputPath = path.join(outputDir, `${basename}_ai_restored.jpg`);

      try {
        const result = await this.restoreDamage(inputPath, outputPath, options);
        results.push(result);
        
        console.log(`\n📊 Progress: ${i + 1}/${inputPaths.length} images processed\n`);
      } catch (error) {
        results.push({
          success: false,
          inputPath,
          error: error.message,
        });
      }

      // Add delay to avoid rate limiting
      if (i < inputPaths.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  /**
   * Process with before/after comparison
   */
  async restoreWithComparison(inputPath, outputDir, options = {}) {
    const basename = path.basename(inputPath, path.extname(inputPath));
    const restoredPath = path.join(outputDir, `${basename}_restored.jpg`);
    const comparisonPath = path.join(outputDir, `${basename}_comparison.jpg`);

    // Restore the image
    const result = await this.restoreDamage(inputPath, restoredPath, options);

    // Create side-by-side comparison
    const original = await sharp(inputPath).resize(1024, null, { 
      fit: 'inside',
      withoutEnlargement: false 
    }).toBuffer();
    
    const restored = await sharp(restoredPath).resize(1024, null, { 
      fit: 'inside',
      withoutEnlargement: false 
    }).toBuffer();

    const originalMeta = await sharp(original).metadata();
    const restoredMeta = await sharp(restored).metadata();

    const height = Math.max(originalMeta.height, restoredMeta.height);

    await sharp({
      create: {
        width: originalMeta.width + restoredMeta.width,
        height: height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([
      { input: original, top: 0, left: 0 },
      { input: restored, top: 0, left: originalMeta.width }
    ])
    .jpeg({ quality: 90 })
    .toFile(comparisonPath);

    console.log(`📸 Comparison saved: ${comparisonPath}`);

    return {
      ...result,
      comparisonPath,
    };
  }
}

/**
 * Convenience function for quick restoration
 */
export async function restoreComicDamage(inputPath, outputPath, options = {}) {
  const restorer = new AIDamageRestoration();
  return await restorer.restoreDamage(inputPath, outputPath, options);
}

export default AIDamageRestoration;
