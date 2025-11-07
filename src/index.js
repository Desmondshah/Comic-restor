/**
 * Main entry point for programmatic usage
 */

export { restorePage, upscale, inpaint, faceRestore, extractText } from "./restore.js";
export { createPrintPDF, createMultiPagePDF, prepareForPrint } from "./pdf-export.js";
export { processDirectory, batchProcess, processSinglePage } from "./batch-processor.js";
export { analyzeQuality, checkPrintReadiness, checkHistogramClipping } from "./qa-checks.js";
export { loadConfig, validateConfig } from "./config.js";

// Default export for convenience
import { restorePage } from "./restore.js";
import { createPrintPDF } from "./pdf-export.js";
import { processDirectory } from "./batch-processor.js";

export default {
  restorePage,
  createPrintPDF,
  processDirectory
};
