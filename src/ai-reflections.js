import { writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import Replicate from "replicate";
import sharp from "sharp";

/**
 * AI-Powered Reflections & Shadows Enhancement
 * Uses depth-aware models to add realistic reflections, shadows, and lighting
 * Similar to RTX ray-tracing but for 2D comic art
 */

export class AIReflectionsEnhancer {
  constructor(apiToken = null) {
    this.replicate = new Replicate({
      auth: apiToken || process.env.REPLICATE_API_TOKEN,
    });
    
    // Using Stable Diffusion with ControlNet for depth-aware enhancements
    // Alternative: "jagilley/controlnet-depth2img" or "fofr/sdxl-controlnet"
    this.depthModel = "jagilley/controlnet-depth2img:9f0014c2ad08d668cbb076da04a1b19e16eb1a62e41b42fb3f2b4db651e3bbc4";
  }

  /**
   * Generate enhancement prompt for reflections and shadows
   */
  generatePrompt(options = {}) {
    const {
      addReflections = true,
      addShadows = true,
      addSpecular = true,
      intensityLevel = 'medium', // 'subtle', 'medium', 'dramatic'
      customInstructions = "",
    } = options;

    let prompt = "High-quality comic book art with professional rendering.\n\n";
    
    if (addReflections) {
      prompt += "Add realistic reflections on shiny surfaces like metal armor, glass, and water. ";
    }
    
    if (addShadows) {
      prompt += "Add depth with contact shadows where objects meet surfaces and cast shadows based on the scene's lighting direction. ";
    }
    
    if (addSpecular) {
      prompt += "Add specular highlights on metallic and glossy surfaces for a polished, modern look. ";
    }

    // Intensity-based guidance
    const intensityText = {
      'subtle': 'Subtle, natural-looking enhancements that preserve the original art style.',
      'medium': 'Noticeable depth and lighting improvements while maintaining comic art aesthetics.',
      'dramatic': 'Bold, cinematic lighting with strong reflections and shadows for maximum impact.'
    };
    
    prompt += intensityText[intensityLevel] || intensityText['medium'];
    
    if (customInstructions) {
      prompt += ` ${customInstructions}`;
    }

    prompt += "\n\nMaintain the original composition, colors, and comic book style. Focus only on adding depth through reflections, shadows, and highlights.";

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
   * Enhance a single image with AI reflections and shadows
   */
  async enhanceReflections(inputPath, outputPath, options = {}) {
    try {
      console.log(`✨ Processing ${path.basename(inputPath)} with AI reflections & shadows...`);
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

      // Convert to data URL
      const imageInput = await this.fileToDataURL(inputPath);

      // Generate prompt
      const prompt = this.generatePrompt(options);
      console.log(`📝 Using prompt:\n${prompt}`);

      // Prepare ControlNet depth input
      const replicateInput = {
        prompt: prompt,
        image: imageInput,
        structure: "depth", // Use depth map for structure preservation
        num_inference_steps: options.num_inference_steps || 20,
        guidance_scale: options.guidance_scale || 7.5,
        scheduler: "DPMSolverMultistep",
      };

      // Add optional parameters
      if (options.strength !== undefined) {
        replicateInput.prompt_strength = options.strength; // How much to transform (0-1)
        console.log(`🎚️  Strength: ${options.strength}`);
      }
      
      if (options.seed !== undefined) {
        replicateInput.seed = options.seed;
        console.log(`🌱 Seed: ${options.seed}`);
      }

      // Negative prompt to avoid unwanted changes
      replicateInput.negative_prompt = "blurry, low quality, distorted, deformed, ugly, bad anatomy, disfigured, poorly drawn, mutated, extra limbs, missing limbs, text changes, logo changes";

      // Run the model
      console.log(`🚀 Sending to Replicate API (Model: depth-aware ControlNet)...`);
      const output = await this.replicate.run(this.depthModel, { 
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

      // Resize to original dimensions if needed
      const enhancedMetadata = await sharp(buffer).metadata();
      if (enhancedMetadata.width !== originalWidth || enhancedMetadata.height !== originalHeight) {
        console.log(`⚠️  AI changed dimensions - resizing to original ${originalWidth}x${originalHeight}...`);
        buffer = await sharp(buffer)
          .resize(originalWidth, originalHeight, {
            fit: 'fill',
            kernel: 'lanczos3'
          })
          .toBuffer();
      }

      // Save with high quality
      await sharp(buffer)
        .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
        .toFile(outputPath);

      console.log(`✅ AI reflections & shadows complete: ${outputPath}`);

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
   * Batch process multiple images
   */
  async enhanceBatch(inputPaths, outputDir, options = {}) {
    const results = [];
    
    for (let i = 0; i < inputPaths.length; i++) {
      const inputPath = inputPaths[i];
      const basename = path.basename(inputPath, path.extname(inputPath));
      const outputPath = path.join(outputDir, `${basename}_reflections.jpg`);

      try {
        const result = await this.enhanceReflections(inputPath, outputPath, options);
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
  async enhanceWithComparison(inputPath, outputDir, options = {}) {
    const basename = path.basename(inputPath, path.extname(inputPath));
    const enhancedPath = path.join(outputDir, `${basename}_reflections.jpg`);
    const comparisonPath = path.join(outputDir, `${basename}_reflection_comparison.jpg`);

    // Enhance the image
    const result = await this.enhanceReflections(inputPath, enhancedPath, options);

    // Create side-by-side comparison
    const original = await sharp(inputPath).resize(1024, null, { 
      fit: 'inside',
      withoutEnlargement: false 
    }).toBuffer();
    
    const enhanced = await sharp(enhancedPath).resize(1024, null, { 
      fit: 'inside',
      withoutEnlargement: false 
    }).toBuffer();

    const originalMeta = await sharp(original).metadata();
    const enhancedMeta = await sharp(enhanced).metadata();

    const height = Math.max(originalMeta.height, enhancedMeta.height);

    await sharp({
      create: {
        width: originalMeta.width + enhancedMeta.width,
        height: height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([
      { input: original, top: 0, left: 0 },
      { input: enhanced, top: 0, left: originalMeta.width }
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
 * Convenience function for quick enhancement
 */
export async function enhanceReflections(inputPath, outputPath, options = {}) {
  const enhancer = new AIReflectionsEnhancer();
  return await enhancer.enhanceReflections(inputPath, outputPath, options);
}

export default AIReflectionsEnhancer;
