/**
 * Simple Story Recap (No Video Creation)
 * Just extracts story analysis and identifies key panels
 */

import path from 'path';
import fs from 'fs/promises';
import { getPdfPageCount } from './pdf-to-images.js';
import { analyzeStory, generateRecapScript, selectKeyPages } from './story-understanding.js';
import Replicate from 'replicate';

/**
 * Create story recap without video generation
 * @param {string} pdfPath - Path to restored PDF file
 * @param {Object} options - Pipeline options
 * @returns {Promise<Object>} Result with story recap and key panel info
 */
export async function createStoryRecap(pdfPath, options = {}) {
  const startTime = Date.now();

  const {
    targetDuration = 25,
    outputDir = path.join(process.cwd(), 'output', 'video-recaps')
  } = options;

  console.log('🚀 Starting Story Recap Pipeline (Simplified)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📄 Input PDF: ${path.basename(pdfPath)}`);
  console.log(`⏱️  Target Duration: ${targetDuration}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Validate input
    const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);
    if (!pdfExists) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
    console.log('✅ Input validation passed\n');

    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });

    const baseName = path.basename(pdfPath, '.pdf');
    const timestamp = Date.now();

    // Step 1: Get PDF metadata
    console.log('📖 STEP 1: Reading PDF');
    console.log('─────────────────────────────────────');
    const pageCount = await getPdfPageCount(pdfPath);
    console.log(`✅ Found ${pageCount} pages\n`);

    // Step 2: Generate simple story analysis without OCR
    console.log('📚 STEP 2: Analyzing Story Structure');
    console.log('─────────────────────────────────────');
    
    // Create basic story analysis based on page count
    const pagesText = `This is a ${pageCount}-page comic book.`;
    
    const storyAnalysis = await analyzeStory(pagesText, pageCount);
    console.log(`✅ Story analysis complete\n`);

    // Step 3: Generate recap script
    console.log('📝 STEP 3: Generating Recap Script');
    console.log('─────────────────────────────────────');
    const recapScript = await generateRecapScript(storyAnalysis, targetDuration);
    console.log(`✅ Generated ${targetDuration}s recap script\n`);

    // Step 4: Select key pages
    console.log('🎯 STEP 4: Selecting Key Pages for Video');
    console.log('─────────────────────────────────────');
    
    // Create page data structure
    const pageData = Array.from({ length: pageCount }, (_, i) => ({
      pageNumber: i + 1,
      text: '', // No OCR text
      importance: i === 0 || i === pageCount - 1 ? 10 : 5 // Prioritize first and last pages
    }));
    
    const keyPages = selectKeyPages(pageData, recapScript, targetDuration);
    console.log(`✅ Selected ${keyPages.length} key pages\n`);

    // Save recap data
    const recapFileName = `${baseName}-recap-${timestamp}.json`;
    const recapPath = path.join(outputDir, recapFileName);
    
    const recap = {
      pdfName: path.basename(pdfPath),
      totalPages: pageCount,
      summary: storyAnalysis.summary,
      themes: storyAnalysis.themes || [],
      characters: storyAnalysis.characters || [],
      recapScript: recapScript.script,
      keyPages: keyPages.map(kp => ({
        pageNumber: kp.pageNumber,
        timing: kp.timing,
        description: kp.description || `Page ${kp.pageNumber}`
      })),
      metadata: {
        targetDuration: `${targetDuration}s`,
        processingTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
        createdAt: new Date().toISOString()
      }
    };

    await fs.writeFile(recapPath, JSON.stringify(recap, null, 2));
    console.log(`💾 Saved recap: ${recapFileName}\n`);

    // Save readable text version
    const textFileName = `${baseName}-recap-${timestamp}.txt`;
    const textPath = path.join(outputDir, textFileName);
    
    let textContent = `COMIC STORY RECAP\n`;
    textContent += `═══════════════════════════════════════════════════\n\n`;
    textContent += `PDF: ${path.basename(pdfPath)}\n`;
    textContent += `Total Pages: ${pageCount}\n`;
    textContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    textContent += `SUMMARY\n`;
    textContent += `───────────────────────────────────────────────────\n`;
    textContent += `${recap.summary}\n\n`;
    
    if (recap.characters && recap.characters.length > 0) {
      textContent += `CHARACTERS\n`;
      textContent += `───────────────────────────────────────────────────\n`;
      recap.characters.forEach(char => {
        textContent += `• ${char}\n`;
      });
      textContent += `\n`;
    }
    
    if (recap.themes && recap.themes.length > 0) {
      textContent += `THEMES\n`;
      textContent += `───────────────────────────────────────────────────\n`;
      recap.themes.forEach(theme => {
        textContent += `• ${theme}\n`;
      });
      textContent += `\n`;
    }
    
    textContent += `RECAP SCRIPT (${targetDuration}s)\n`;
    textContent += `───────────────────────────────────────────────────\n`;
    textContent += `${recap.recapScript}\n\n`;
    
    textContent += `KEY PANELS FOR VIDEO\n`;
    textContent += `───────────────────────────────────────────────────\n`;
    textContent += `These pages should be used to create the video:\n\n`;
    recap.keyPages.forEach((page, i) => {
      textContent += `${i + 1}. Page ${page.pageNumber} (shown for ${page.timing}s)\n`;
      if (page.description) {
        textContent += `   ${page.description}\n`;
      }
    });
    textContent += `\n`;
    textContent += `INSTRUCTIONS:\n`;
    textContent += `To create the video, extract these pages as images from the PDF\n`;
    textContent += `and use them in the order shown above with the timing specified.\n`;
    
    await fs.writeFile(textPath, textContent);
    console.log(`📄 Saved readable version: ${textFileName}\n`);

    // Calculate processing time
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

    // Prepare result
    const result = {
      success: true,
      recapPath,
      textPath,
      metadata: {
        pdfName: path.basename(pdfPath),
        totalPages: pageCount,
        keyPagesCount: recap.keyPages.length,
        targetDuration: targetDuration,
        summary: recap.summary,
        script: recap.recapScript,
        keyPages: recap.keyPages,
        processingTime: `${processingTime}s`,
        createdAt: new Date().toISOString()
      }
    };

    // Print success summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ STORY RECAP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 JSON: ${path.basename(recapPath)}`);
    console.log(`📝 Text: ${path.basename(textPath)}`);
    console.log(`📊 Pages: ${pageCount} → ${recap.keyPages.length} key pages selected`);
    console.log(`⏱️  Target Duration: ${targetDuration}s`);
    console.log(`⚡ Processing Time: ${processingTime}s`);
    console.log('\n📋 SUMMARY:');
    console.log(`${recap.summary.slice(0, 200)}${recap.summary.length > 200 ? '...' : ''}`);
    console.log('\n🎬 KEY PANELS:');
    recap.keyPages.slice(0, 5).forEach((page, i) => {
      console.log(`   ${i + 1}. Page ${page.pageNumber} (${page.timing}s)`);
    });
    if (recap.keyPages.length > 5) {
      console.log(`   ... and ${recap.keyPages.length - 5} more`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return result;

  } catch (error) {
    console.error('\n❌ Pipeline failed:', error.message);
    throw error;
  }
}

export default {
  createStoryRecap
};
