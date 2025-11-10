# Comic Restoration Pipeline

Professional public-domain comic scan restoration using Replicate AI models, with print-ready PDF export featuring proper bleed margins for matte paper printing.

## Features

- **🌐 Web Interface**: Beautiful drag & drop UI with real-time progress tracking
- **💾 Preset Management**: Save & load custom restoration presets
  - 4 built-in era presets (Golden Age, Silver Age, Bronze Age, Modern Age)
  - Custom preset creation with metadata (name, description, era type)
  - One-click preset application for consistent batch processing
- **🔄 Before/After Comparison**: Interactive comparison viewer
  - Split view with draggable slider for precise comparisons
  - Side-by-side mode with synchronized zoom & pan
  - Perfect for quality checking and fine-tuning settings
- **🤖 AI Damage Restoration**: Automatic damage removal with Google Nano Banana
  - Auto-detect and remove scratches, dust, tears, and stains
  - Preserve logos, titles, and artist signatures
  - Modern remaster styling with vintage preservation options
  - No manual mask creation required!
- **AI-Powered Restoration**: Real-ESRGAN for upscaling/cleanup, LaMa for damage removal
- **✨ Premium Lighting Effects**: Add depth, dynamic highlights & rim lighting for modern reprint quality
  - 4 professional presets (Modern Reprint, Dramatic, Subtle, Vintage Enhanced)
  - Directional depth lighting with customizable light source
  - Dynamic highlights & specular reflections
  - Rim lighting for edge separation (warm golden glow)
  - Ambient occlusion for realistic shadows
  - Local clarity enhancement & micro-contrast
  - Makes flat scans look like $50 variant covers!
- **🎨 Color Correction**: Professional-grade tone mapping & cast removal for vintage comics
  - Neutral paper & yellowing removal
  - Levels/curves with guardrails (prevent clipping on matte)
  - Selective saturation (boost reds/yellows, reduce neon blues)
  - Local contrast enhancement (clarity without AI gloss)
  - Reference page matching for consistent batches
- **🖨️ Prepress Features**: CMYK conversion with TAC limits for offset printing
  - GCR (Gray Component Replacement) for cleaner neutrals
  - TAC limiting (280-340%) for matte/gloss stock
  - Rich black handling & line art detection
  - Dot gain compensation
- **✅ Quality Assurance**: Comprehensive automated checks
  - Histogram clipping detection (<0.5% threshold)
  - SSIM comparison to prevent overprocessing
  - Edge density analysis (detect oversharpening)
  - Color tint detection (spot weird casts)
  - Text contrast check (WCAG readability)
  - Perceptual hash (outlier detection in batches)
- **Optional Enhancements**: GFPGAN/CodeFormer for faces, OCR for balloon text extraction
- **Print-Ready Export**: PDF generation with configurable bleed, DPI, and matte paper compensation
- **Era-Faithful**: Conservative restoration preserving vintage comic aesthetics
- **Batch Processing**: Queue-based processing for multiple pages
- **CLI + Web UI**: Choose command-line or browser interface

## Quick Start

### Option 1: Web Interface (Recommended)

```bash
npm install
npm run web
```

Then open http://localhost:3000 in your browser!

- 📤 Drag & drop file uploads
- ⚙️ Easy settings controls  
- 📊 Real-time progress tracking
- 📥 One-click PDF downloads

See **[WEB_UI_GUIDE.md](WEB_UI_GUIDE.md)** for details.

### Option 2: Deploy to Convex ☁️ (Recommended)

Deploy to Convex for unlimited background processing and built-in file storage:

```bash
npm install
npx convex dev
```

- ♾️ **No timeout limits** - AI processing takes as long as needed
- 📁 **Built-in file storage** - No external S3 needed
- 🆓 **Generous free tier** - 1M function calls/month
- ⚡ **Real-time updates** - Better than WebSockets

See **[CONVEX_DEPLOYMENT.md](CONVEX_DEPLOYMENT.md)** for complete setup guide.

### Option 3: Deploy to Vercel ☁️

Deploy to Vercel for quick hosting (limited by timeouts):

1. Click deploy or follow **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)**
2. Add your `REPLICATE_API_TOKEN` in environment variables
3. Your comic restoration tool is now online!

**Note**: Vercel Hobby plan has 10s timeout. Convex recommended for full features.

### Option 4: Command Line

```bash
npm install
```

Single page:
```bash
npm start -- -i samples/page01.jpg -o output/page01_restored.pdf
```

Batch processing:
```bash
npm start -- -b -i samples/ -o output/ --combine
```

See **[QUICKSTART.md](QUICKSTART.md)** for full CLI guide.

### Advanced Options

```bash
npm start -- \
  -i input.jpg \
  -o output.pdf \
  --scale 2 \
  --dpi 300 \
  --width 6.625 \
  --height 10.25 \
  --bleed 0.125 \
  --face-enhance \
  --ocr \
  --matte-compensation 5
```

## Configuration

Create a `config.json` file for default settings:

```json
{
  "upscale": {
    "scale": 2,
    "faceEnhance": false
  },
  "pdf": {
    "widthIn": 6.625,
    "heightIn": 10.25,
    "dpi": 300,
    "bleedIn": 0.125
  },
  "matteCompensation": 5,
  "qa": {
    "checkHistogram": true,
    "clippingThreshold": 0.01
  }
}
```

## Models Used

- **Real-ESRGAN** (nightmareai/real-esrgan): Upscaling & JPEG artifact removal
- **Google Nano Banana** (google/nano-banana): AI-powered damage detection & restoration
- **LaMa** (zylim0702/remove-object): Scratch/tear inpainting (legacy)
- **GFPGAN** (tencentarc/gfpgan): Optional face restoration (use sparingly)
- **OCR** (abiruyt/text-extract-ocr): Text extraction from balloons

## Tips for Best Results

1. **AI Damage Restoration**: Enable for automatic scratch/dust/tear removal - no manual work needed!
2. **Era-Faithful**: Adjust AI strength (0.5-1.0) based on damage severity
3. **Preservation Options**: Keep logos, signatures, and text intact with smart AI preservation
4. **Matte Paper**: Enable matte compensation (+5-8 midtones) to prevent darkening
5. **Face Enhancement**: Only enable for realistic comic styles, not manga/cartoons
6. **Batch Processing**: Process sequentially to respect API rate limits
7. **Quality Check**: Review histogram warnings for clipping issues

See **[AI_DAMAGE_RESTORATION_GUIDE.md](AI_DAMAGE_RESTORATION_GUIDE.md)** for comprehensive AI restoration guide.

## Project Structure

```
comic-restoration-pipeline/
├── src/
│   ├── cli.js                    # Command-line interface
│   ├── restore.js                # Core restoration functions
│   ├── color-correction.js       # ✨ NEW: Color & tone mapping
│   ├── cmyk-conversion.js        # ✨ NEW: CMYK prepress
│   ├── qa-checks.js              # ✨ Enhanced QA suite
│   ├── pdf-export.js             # PDF generation with bleed
│   ├── batch-processor.js        # Batch processing queue
│   ├── server.js                 # Web server
│   ├── config.js                 # Configuration management
│   └── setup-check.js            # Dependency verification
├── public/
│   ├── index.html                # Web UI
│   └── app.js                    # Frontend logic
├── examples-color.js             # ✨ NEW: Color correction examples
├── COLOR_CORRECTION_GUIDE.md     # ✨ NEW: Complete color guide
├── DAMAGE_MASK_GUIDE.md          # Mask editor tutorial
├── WEB_UI_GUIDE.md               # Web interface docs
├── QUICKSTART.md                 # Quick start guide
├── config.json                   # Your configuration
└── .env                          # API credentials
```

## Documentation

- **[LIGHTING_GUIDE.md](LIGHTING_GUIDE.md)** - ✨ NEW: Premium lighting effects guide
- **[COLOR_CORRECTION_GUIDE.md](COLOR_CORRECTION_GUIDE.md)** - Complete color correction & CMYK guide
- **[DAMAGE_MASK_GUIDE.md](DAMAGE_MASK_GUIDE.md)** - Interactive mask editor tutorial
- **[WEB_UI_GUIDE.md](WEB_UI_GUIDE.md)** - Web interface documentation
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[WORKFLOW.md](WORKFLOW.md)** - Detailed workflow examples

## Examples

Run the lighting examples:

```bash
# Try all lighting presets on your image
node examples-lighting.js samples/your-comic.jpg
```

Run the color correction examples:

```bash
# Run all examples
node examples-color.js all

# Run specific example
node examples-color.js 1  # Basic color correction
node examples-color.js 5  # CMYK conversion
node examples-color.js 8  # Complete workflow
```

Available examples:
1. Basic color correction
2. Remove heavy yellowing
3. Reference page matching
4. Full matte stock pipeline
5. CMYK conversion
6. Quality assurance checks
7. Batch processing with reference
8. Complete restoration workflow
│   └── config.js           # Configuration management
├── samples/                # Sample input images
├── output/                 # Restored PDFs
└── config.json            # Optional configuration file
```

## Documentation

- **[CONVEX_DEPLOYMENT.md](CONVEX_DEPLOYMENT.md)** - ☁️ **Recommended** Deploy to Convex (no timeout limits!)
- **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** - ☁️ Deploy to Vercel (limited timeouts)
- **[AI_DAMAGE_RESTORATION_GUIDE.md](AI_DAMAGE_RESTORATION_GUIDE.md)** - ⭐ NEW: Complete AI damage restoration guide
- **[AI_DAMAGE_QUICK_REF.md](AI_DAMAGE_QUICK_REF.md)** - ⭐ NEW: Quick reference for AI restoration
- **[PRESET_COMPARISON_GUIDE.md](PRESET_COMPARISON_GUIDE.md)** - Complete guide to preset management and comparison features
- **[PRESET_QUICK_REFERENCE.md](PRESET_QUICK_REFERENCE.md)** - Quick reference card for presets and comparison
- **[UPDATE_GUIDE.md](UPDATE_GUIDE.md)** - What's new and how to migrate
- **[VISUAL_UI_GUIDE.md](VISUAL_UI_GUIDE.md)** - Visual guide to the UI
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Beginner setup guide
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[COLOR_CORRECTION_GUIDE.md](COLOR_CORRECTION_GUIDE.md)** - Color correction documentation
- **[PREMIUM_LIGHTING_GUIDE.md](PREMIUM_LIGHTING_GUIDE.md)** - Lighting effects guide
- **[DAMAGE_MASK_GUIDE.md](DAMAGE_MASK_GUIDE.md)** - Legacy damage mask editor guide

## License

MIT License - See LICENSE file for details

## Notes

- CodeFormer has non-commercial restrictions; use GFPGAN for commercial projects
- Process pages sequentially to avoid Replicate API rate limits
- Always work on copies; preserve original scans
