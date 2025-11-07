# Color Correction & Prepress Guide

Complete guide to the color correction, tone mapping, and CMYK prepress features in the Comic Restoration Pipeline.

---

## Table of Contents

1. [Overview](#overview)
2. [Color Correction Pipeline](#color-correction-pipeline)
3. [CMYK Conversion](#cmyk-conversion)
4. [Quality Assurance](#quality-assurance)
5. [Configuration](#configuration)
6. [Best Practices](#best-practices)

---

## Overview

The color correction system applies professional-grade adjustments **post-upscale, pre-PDF** to ensure vintage comics look their best in print on matte stock.

### Processing Order

```
Upscale (Real-ESRGAN)
    ↓
Inpainting (optional)
    ↓
Color Correction & Tone Mapping ← YOU ARE HERE
    ├─ Paper cast removal
    ├─ Levels with guardrails
    ├─ Selective saturation
    ├─ Local contrast (clarity)
    ├─ Reference page matching
    └─ Paper grain overlay
    ↓
Matte Stock Compensation
    ├─ Midtone lift
    ├─ Shadow compression
    └─ Saturation reduction
    ↓
CMYK Conversion (optional)
    ├─ GCR (Gray Component Replacement)
    ├─ TAC limiting
    ├─ Dot gain compensation
    └─ Rich black handling
    ↓
Quality Assurance Checks
    ↓
PDF Export
```

---

## Color Correction Pipeline

### 1. Neutral Paper & Cast Removal

**Goal:** Remove yellow/green paper tint without bleaching inks.

**How it works:**
- Samples "paper-only" pixels from margins (outer 5% of image)
- Computes average paper color
- Calculates per-channel correction multipliers
- Applies low-strength correction to avoid bleaching inks
- Protects dark pixels (ink) from excessive correction

**Configuration:**
```json
{
  "colorCorrection": {
    "removeCast": true,
    "castStrength": 0.7
  }
}
```

**Parameters:**
- `castStrength` (0-1): Correction intensity
  - 0.5 = subtle correction
  - 0.7 = standard (recommended)
  - 1.0 = full correction

**Tips:**
- Use strength 0.5-0.7 for vintage halftone
- Use strength 0.8-1.0 for severe yellowing
- Dark pixels automatically protected

---

### 2. Levels/Curves with Guardrails

**Goal:** Lift whites to clean, deepen blacks slightly, protect mid-tones.

**How it works:**
- Applies levels adjustment with black/white point guardrails
- Uses lookup table (LUT) for fast processing
- Prevents highlight clipping at ~98% (245/255)
- Prevents shadow crushing below ~4-6% (12/255)
- Optional gamma (midtone) adjustment

**Configuration:**
```json
{
  "colorCorrection": {
    "applyLevels": true,
    "whitePoint": 245,
    "blackPoint": 12
  }
}
```

**Guardrails:**
- **Highlight cap:** ~98% (245/255) prevents blown whites on matte
- **Shadow floor:** ~4-6% (12/255) prevents crushed blacks on matte

**Tips:**
- Don't touch these unless you know your printer
- Matte stock needs gentler curves than gloss

---

### 3. Selective Saturation

**Goal:** Boost reds/yellows; rein in neon blues/greens; protect skin tones.

**How it works:**
- Converts RGB → HSV for hue-based adjustments
- Boosts warm colors (red/yellow: 0-60°)
- Reduces cool colors (blue/green: 180-270°)
- Protects skin tones (25-45° on HSV wheel)
- Converts back to RGB

**Configuration:**
```json
{
  "colorCorrection": {
    "applySaturation": true,
    "redYellowBoost": 1.1,
    "blueGreenReduce": 0.92
  }
}
```

**Parameters:**
- `redYellowBoost` (0.8-1.3): Warm color multiplier
- `blueGreenReduce` (0.8-1.0): Cool color multiplier

**Tips:**
- Subtle is better: 1.1x boost is usually enough
- Skin tones automatically protected
- Test on pages with faces

---

### 4. Local Contrast ("Clarity")

**Goal:** Low-radius, low-amount unsharp mask—just enough snap, not "AI gloss."

**How it works:**
- Applies unsharp mask with small radius
- Enhances local contrast without halo artifacts
- Restores "snap" lost in scanning/upscaling

**Configuration:**
```json
{
  "colorCorrection": {
    "applyClarity": true,
    "clarityRadius": 2,
    "clarityAmount": 0.5
  }
}
```

**Parameters:**
- `clarityRadius` (1-5): Smaller = finer detail
- `clarityAmount` (0.3-1.0): Strength of effect

**Tips:**
- Keep radius low (2-3) for comics
- Keep amount subtle (0.4-0.6)
- Over-sharpening destroys halftone

---

### 5. Halftone Preservation

**Goal:** Avoid "plastic look" on descreened comics.

**Features:**
- Optional paper grain overlay (2-4% Multiply)
- Prevents over-smooth "AI gloss"
- Simulates natural paper texture

**Configuration:**
```json
{
  "colorCorrection": {
    "addGrain": true,
    "grainStrength": 0.03
  }
}
```

**Parameters:**
- `grainStrength` (0.02-0.05): Grain intensity
  - 0.02 = very subtle
  - 0.03 = standard (recommended)
  - 0.05 = heavy grain

**Tips:**
- Only use on descreened pages
- Skip if halftone is intact
- Test on different pages

---

### 6. Reference Page Matching

**Goal:** Match entire issue to 1-2 "hero" pages for consistency.

**How it works:**
- Calculates per-channel mean and standard deviation
- Computes gain and offset per channel
- Applies linear transform to match target statistics

**Configuration:**
```json
{
  "referenceMatching": {
    "enabled": true,
    "referencePage": "path/to/hero-page.png",
    "matchStrength": 0.8
  }
}
```

**Workflow:**
1. Pick 1-2 best-looking pages as "heroes"
2. Manually color-correct them perfectly
3. Enable reference matching for batch
4. All pages match hero color/tone

**Tips:**
- Choose representative pages (not covers)
- Use strength 0.7-0.9 for natural variation
- Perfect for multi-issue runs

---

## Matte Stock Compensation

### Dot Gain & Matte Compensation

**Goal:** Compensate for ink spread on matte paper.

**How it works:**
- Lifts midtones by +5-8 to prevent darkening
- Compresses deep shadows slightly
- Reduces oversaturated primaries by ~3-6%

**Configuration:**
```json
{
  "matteStock": {
    "enabled": true,
    "midtoneLift": 6,
    "shadowCompress": 0.95,
    "saturateReduce": 0.96
  }
}
```

**Parameters:**
- `midtoneLift` (5-8): Brightness boost for midtones
- `shadowCompress` (0.90-0.98): Shadow density reduction
- `saturateReduce` (0.94-0.98): Saturation reduction

**Printer-specific:**
- Matte stock: 6-8 midtone lift
- Gloss stock: 3-5 midtone lift
- Uncoated: 8-10 midtone lift

---

## CMYK Conversion

### Full Prepress Color Workflow

**Goal:** Convert RGB to CMYK with TAC limits for professional offset printing.

**Features:**
- **GCR (Gray Component Replacement):** Uses K instead of CMY for neutrals
- **TAC Limiting:** Caps total ink at 280-300% for matte stock
- **UCR (Under Color Removal):** Cleaner neutrals on press
- **Rich Blacks:** 60/40/40/100 for large fills
- **Line Art Detection:** Forces body text to 100% K
- **Dot Gain Compensation:** Pre-compensates for ink spread

**Configuration:**
```json
{
  "cmyk": {
    "enabled": true,
    "gcrStrength": 0.8,
    "tacLimit": 300,
    "applyRichBlack": true,
    "forceLineArtToK": true,
    "compensateDotGain": true,
    "dotGainAmount": 15
  }
}
```

### GCR vs. UCR

**GCR (Gray Component Replacement):**
- Replaces CMY with K for neutral grays
- Cleaner neutrals, less ink, faster dry time
- **Recommended:** 0.8 for comics

**UCR (Under Color Removal):**
- Removes equal amounts of CMY, adds K
- Less aggressive than GCR
- Built into GCR algorithm

### TAC Limits by Stock

| Stock Type | TAC Limit | Notes |
|------------|-----------|-------|
| Gloss coated | 340% | Maximum ink load |
| Matte coated | 300% | **Recommended for comics** |
| Uncoated offset | 280% | Absorbs more ink |
| Newsprint | 240% | Very absorbent |

### Black Handling

**Body Text / Line Art:**
- **100% K** (no CMY contamination)
- Clean, sharp edges
- Auto-detected by algorithm

**Rich Blacks (large fills):**
- **60/40/40/100** (default)
- Deeper, richer blacks
- Only for areas >80% K

**Configuration:**
```json
{
  "cmyk": {
    "applyRichBlack": true,
    "forceLineArtToK": true
  }
}
```

### Rendering Intent

Not yet implemented in Sharp—planned for future release.

**Recommended intents:**
- **Relative Colorimetric + BPC:** Best for comics (default)
- **Perceptual:** If gamut clipping occurs

---

## Quality Assurance

### Automated QA Checks

**Run after color correction, before PDF export.**

### 1. Histogram Clipping

**What it checks:**
- Percentage of pixels at 0 (pure black)
- Percentage of pixels at 255 (pure white)

**Threshold:** <0.5% clipping is acceptable

**Configuration:**
```json
{
  "qa": {
    "checkHistogram": true,
    "clippingThreshold": 0.005
  }
}
```

**Warnings:**
- `⚠️ Highlight clipping detected: X%`
- `⚠️ Shadow clipping detected: X%`

---

### 2. SSIM (Structural Similarity Index)

**What it checks:**
- Compares processed image to original
- Detects overprocessing

**Threshold:** SSIM ≥ 0.92 is acceptable

**Configuration:**
```json
{
  "qa": {
    "checkSSIM": true,
    "minSSIM": 0.92
  }
}
```

**Interpretation:**
- 1.0 = identical
- 0.95-1.0 = excellent
- 0.90-0.95 = good
- <0.90 = overprocessed

---

### 3. Edge Density

**What it checks:**
- Percentage of pixels classified as edges
- Detects oversharpening

**Threshold:** <25% edge density is acceptable

**Configuration:**
```json
{
  "qa": {
    "checkEdges": true,
    "maxEdgeDensity": 0.25
  }
}
```

**Warnings:**
- `⚠️ High edge density: X% - possible oversharpening`

**Tips:**
- Halftone comics typically have 15-20% edges
- Line art has 5-10% edges
- >30% = definitely oversharpened

---

### 4. Color Tint Detection

**What it checks:**
- Per-channel mean brightness
- Detects unnatural color casts

**Threshold:** >10 units of channel imbalance

**Configuration:**
```json
{
  "qa": {
    "checkTint": true
  }
}
```

**Warnings:**
- `⚠️ Yellow tint detected: X`
- `⚠️ Cyan tint detected: X`
- etc.

---

### 5. Text Contrast Check

**What it checks:**
- Local contrast ratios across image
- Ensures WCAG-level readability

**Threshold:** 7:1 contrast ratio (WCAG AAA)

**Configuration:**
```json
{
  "qa": {
    "checkContrast": true,
    "minContrast": 7.0
  }
}
```

**Tips:**
- Critical for text balloons
- <4.5:1 = unreadable
- 7:1 = excellent readability

---

### 6. Perceptual Hash (Outlier Detection)

**What it does:**
- Generates 16-character hash of image
- Detects pages with weird tints in batch

**Use case:**
```javascript
const hashes = [];
for (const page of pages) {
  const hash = await calculatePerceptualHash(page);
  hashes.push({ page, hash });
}

// Find outliers
for (let i = 0; i < hashes.length - 1; i++) {
  const distance = hammingDistance(hashes[i].hash, hashes[i + 1].hash);
  if (distance > 20) {
    console.log(`⚠️ Page ${i} is very different from page ${i + 1}`);
  }
}
```

---

## Configuration

### Complete Example Config

```json
{
  "upscale": {
    "scale": 2,
    "faceEnhance": false
  },
  "colorCorrection": {
    "enabled": true,
    "removeCast": true,
    "castStrength": 0.7,
    "applyLevels": true,
    "whitePoint": 245,
    "blackPoint": 12,
    "applySaturation": true,
    "redYellowBoost": 1.1,
    "blueGreenReduce": 0.92,
    "applyClarity": true,
    "clarityRadius": 2,
    "clarityAmount": 0.5,
    "addGrain": false,
    "grainStrength": 0.03
  },
  "matteStock": {
    "enabled": true,
    "midtoneLift": 6,
    "shadowCompress": 0.95,
    "saturateReduce": 0.96
  },
  "cmyk": {
    "enabled": false,
    "gcrStrength": 0.8,
    "tacLimit": 300,
    "applyRichBlack": true,
    "forceLineArtToK": true,
    "compensateDotGain": true,
    "dotGainAmount": 15
  },
  "referenceMatching": {
    "enabled": false,
    "referencePage": null,
    "matchStrength": 0.8
  },
  "qa": {
    "enabled": true,
    "checkHistogram": true,
    "clippingThreshold": 0.005,
    "checkSSIM": true,
    "minSSIM": 0.92,
    "checkEdges": true,
    "maxEdgeDensity": 0.25,
    "checkTint": true,
    "checkContrast": true,
    "minContrast": 7.0
  },
  "pdf": {
    "widthIn": 6.625,
    "heightIn": 10.25,
    "dpi": 300,
    "bleedIn": 0.125
  },
  "output": {
    "directory": "output",
    "saveCMYKChannels": false
  }
}
```

---

## Best Practices

### General Workflow

1. **Test on 2-3 pages first**
   - Pick representative samples
   - Avoid covers (they're often different)
   - Iterate until perfect

2. **Choose your hero pages**
   - Best condition, best color
   - Manually color-correct if needed
   - Use as reference for batch

3. **Enable conservative settings**
   - Start with low strengths
   - Gradually increase until satisfied
   - Less is more

4. **Run QA checks**
   - Review all warnings
   - Check edge density (oversharpening)
   - Verify SSIM >0.92

5. **Test print**
   - Print 1-2 pages before full run
   - Check on actual stock
   - Adjust midtone lift if too dark/light

---

### For Different Comic Types

#### Golden Age (1930s-1950s)
- Heavy yellowing: `castStrength: 0.8-0.9`
- Faded colors: `redYellowBoost: 1.15`
- Rough paper: `addGrain: true`

#### Silver Age (1960s-1970s)
- Moderate yellowing: `castStrength: 0.6-0.7`
- Vibrant colors: `blueGreenReduce: 0.90`
- Halftone intact: `addGrain: false`

#### Modern (1980s+)
- Minimal yellowing: `castStrength: 0.4-0.5`
- Good condition: Lower all adjustments
- Consider CMYK workflow: `cmyk.enabled: true`

---

### Printer Communication

**Ask your printer:**
1. What TAC limit? (280-340%)
2. What dot gain? (10-20%)
3. Gloss or matte stock?
4. Preferred color space? (CMYK or RGB)
5. ICC profile available?

**Provide to printer:**
- Print-ready PDF at correct size + bleed
- Embedded color profile (if available)
- TAC limit used (e.g., "300% TAC, GCR 0.8")
- Stock recommendation (matte coated)

---

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Pages too dark | Increase `midtoneLift` to 7-8 |
| Pages too light | Decrease `midtoneLift` to 4-5 |
| Colors too flat | Increase `redYellowBoost` to 1.15 |
| Colors too neon | Decrease `blueGreenReduce` to 0.88 |
| Halos around edges | Decrease `clarityRadius` and `clarityAmount` |
| Plastic look | Enable `addGrain: true` |
| Blown highlights | Decrease `whitePoint` to 240 |
| Crushed shadows | Increase `blackPoint` to 15-18 |
| SSIM too low | Reduce correction strengths |
| High edge density | Disable clarity or reduce amount |

---

## API Reference

### Color Correction Functions

```javascript
import {
  removeColorCast,
  applyLevels,
  adjustSaturation,
  applyClarity,
  addPaperGrain,
  applyMatteCompensation,
  matchToReference,
  applyColorCorrection
} from './color-correction.js';

// Individual functions
const noCast = await removeColorCast(buffer, { strength: 0.7 });
const leveled = await applyLevels(buffer, { whitePoint: 245, blackPoint: 12 });

// Full pipeline
const corrected = await applyColorCorrection(buffer, {
  removeCast: true,
  applyLevels: true,
  applySaturation: true,
  // ... all options
});
```

### CMYK Conversion Functions

```javascript
import {
  convertToCmyk,
  cmykToRgbBuffer,
  exportCmykChannels,
  analyzeCmykQuality
} from './cmyk-conversion.js';

// Convert to CMYK
const cmykData = await convertToCmyk(buffer, {
  gcrStrength: 0.8,
  tacLimit: 300
});

// Convert back to RGB for preview
const rgbBuffer = await cmykToRgbBuffer(cmykData);

// Export separations
await exportCmykChannels(cmykData, 'output/page');
// Creates: page_c.png, page_m.png, page_y.png, page_k.png

// Analyze quality
const analysis = analyzeCmykQuality(cmykData);
console.log(`GCR efficiency: ${analysis.gcrEfficiency}%`);
```

### QA Functions

```javascript
import {
  checkHistogramClipping,
  calculateSSIM,
  calculateEdgeDensity,
  detectColorTint,
  checkTextContrast,
  runFullQA
} from './qa-checks.js';

// Individual checks
const clipping = await checkHistogramClipping(buffer, 0.005);
const ssim = await calculateSSIM(originalBuffer, processedBuffer);

// Full QA suite
const qa = await runFullQA(buffer, originalBuffer, {
  checkClipping: true,
  checkSSIM: true,
  checkEdges: true,
  checkTint: true,
  checkContrast: true
});

console.log(`QA passed: ${qa.passed}`);
qa.warnings.forEach(w => console.log(w));
```

---

## License

MIT License - see LICENSE file for details.

---

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
