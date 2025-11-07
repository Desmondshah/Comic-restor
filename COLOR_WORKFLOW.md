# Color Correction Pipeline Workflow

Visual guide to the complete color correction and prepress workflow.

---

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMIC RESTORATION PIPELINE                    │
└─────────────────────────────────────────────────────────────────┘

                              INPUT
                         (Scanned Comic)
                                │
                                ▼
                    ┌───────────────────────┐
                    │   UPSCALE & CLEANUP   │
                    │   (Real-ESRGAN 2x)    │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  DAMAGE INPAINTING    │
                    │  (Optional - w/mask)  │
                    └───────────┬───────────┘
                                │
                                ▼
        ╔═══════════════════════════════════════════════╗
        ║      COLOR CORRECTION & TONE MAPPING          ║
        ║              ✨ NEW FEATURES ✨              ║
        ╚═══════════════════════╤═══════════════════════╝
                                │
                    ┌───────────▼───────────┐
                    │  1. CAST REMOVAL      │
                    │  Remove yellowing     │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  2. LEVELS ADJUST     │
                    │  Lift whites/blacks   │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  3. SATURATION        │
                    │  Boost/reduce colors  │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  4. CLARITY           │
                    │  Local contrast       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  5. REFERENCE MATCH?  │
                    │  (If enabled)         │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  6. PAPER GRAIN?      │
                    │  (If enabled)         │
                    └───────────┬───────────┘
                                │
                                ▼
        ╔═══════════════════════════════════════════════╗
        ║        MATTE STOCK COMPENSATION               ║
        ╚═══════════════════════╤═══════════════════════╝
                                │
                    ┌───────────▼───────────┐
                    │  7. MIDTONE LIFT      │
                    │  Brighten for dot gain│
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  8. SHADOW COMPRESS   │
                    │  Prevent mud          │
                    └───────────┬───────────┘
                                │
                                ▼
        ╔═══════════════════════════════════════════════╗
        ║          CMYK CONVERSION (Optional)           ║
        ╚═══════════════════════╤═══════════════════════╝
                                │
                    ┌───────────▼───────────┐
                    │  9. RGB → CMYK        │
                    │  With GCR & TAC limit │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  10. DOT GAIN COMP    │
                    │  Pre-compensate spread│
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  11. RICH BLACKS      │
                    │  Line art detection   │
                    └───────────┬───────────┘
                                │
                                ▼
        ╔═══════════════════════════════════════════════╗
        ║          QUALITY ASSURANCE CHECKS             ║
        ╚═══════════════════════╤═══════════════════════╝
                                │
                    ┌───────────▼───────────┐
                    │  12. HISTOGRAM CHECK  │
                    │  Clipping <0.5%?      │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  13. SSIM CHECK       │
                    │  Similarity ≥0.92?    │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  14. EDGE DENSITY     │
                    │  Oversharpened?       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  15. TINT DETECTION   │
                    │  Color casts?         │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  16. TEXT CONTRAST    │
                    │  Readable?            │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   PDF EXPORT          │
                    │   (300 DPI + bleed)   │
                    └───────────┬───────────┘
                                │
                                ▼
                              OUTPUT
                       (Print-Ready PDF)
```

---

## Decision Points

### Should I Apply Color Correction?

```
┌───────────────────────────────────┐
│  Does original have yellowing,    │
│  color casts, or faded colors?    │
└────────────┬──────────────────────┘
             │
      ┌──────┴──────┐
      │             │
     YES           NO
      │             │
      ▼             ▼
  ENABLE      CONSIDER SKIPPING
 (strength    (or use low strength
  0.6-0.9)     0.3-0.5)
```

### Should I Use Matte Compensation?

```
┌───────────────────────────────────┐
│  What stock are you printing on?  │
└────────────┬──────────────────────┘
             │
      ┌──────┴──────┬───────────┐
      │             │           │
    MATTE         GLOSS      UNCOATED
      │             │           │
      ▼             ▼           ▼
  midtoneLift   midtoneLift  midtoneLift
      6-8           3-5         8-10
```

### Should I Convert to CMYK?

```
┌───────────────────────────────────┐
│  Is your printer requiring CMYK?  │
└────────────┬──────────────────────┘
             │
      ┌──────┴──────┐
      │             │
     YES           NO
      │             │
      ▼             ▼
   ENABLE       KEEP RGB
  (TAC 300)   (easier workflow)
```

---

## Stage Details

### Stage 1: Cast Removal

**Purpose:** Remove yellowed paper tint without bleaching inks

```
BEFORE:              AFTER:
Yellow paper    →    Neutral paper
Faded colors         Restored colors
Green tint           Balanced tones
```

**Settings:**
- `castStrength: 0.7` (standard)
- `castStrength: 0.9` (heavy yellowing)
- `castStrength: 0.5` (subtle correction)

---

### Stage 2: Levels Adjustment

**Purpose:** Optimize tonal range with guardrails

```
INPUT LEVELS:      OUTPUT LEVELS:
0 ────────── 255   0 ────────── 255
│                  │
├─ Black: 12       ├─ 0 (true black)
├─ Midtones        ├─ 128 (protected)
└─ White: 245      └─ 255 (true white)
```

**Guardrails:**
- Black point: 12 (prevents crush)
- White point: 245 (prevents blow-out)
- Midtones: Protected from excessive shift

---

### Stage 3: Selective Saturation

**Purpose:** Enhance warm colors, reduce neon cools

```
HSV COLOR WHEEL:

     0° RED
      ▲
      │
270° ─┼─ 90°
BLUE  │  YELLOW
      │
     180°
    CYAN

ADJUSTMENTS:
- 0-60° (Red/Yellow):   ×1.10 BOOST
- 25-45° (Skin):         ×1.00 PROTECT
- 180-270° (Blue/Green): ×0.92 REDUCE
```

---

### Stage 4: Local Contrast (Clarity)

**Purpose:** Add "snap" without oversharpening

```
UNSHARP MASK:
┌─────────────────────┐
│ Radius: 2 pixels    │  ← Small radius
│ Amount: 0.5 (50%)   │  ← Subtle amount
│ Threshold: 0        │  ← All pixels
└─────────────────────┘

EFFECT:
- Enhances local edges
- No halo artifacts
- Preserves halftone
```

---

### Stage 5: Matte Compensation

**Purpose:** Pre-compensate for ink spread on matte stock

```
BRIGHTNESS CURVE:

255 ┤           ╱───  (whites unchanged)
    │         ╱
    │       ╱
    │     ╱▲
128 ┤   ╱  │ +6 lift  (midtones brightened)
    │ ╱    │
    │╱     │
  0 ┼──────┴────────
    0     128      255
         INPUT
```

**Why?**
- Matte paper absorbs more ink
- Dot gain causes darkening
- Lifting midtones compensates

---

### Stage 6: CMYK Conversion

**Purpose:** Professional offset printing workflow

```
RGB → CMYK WITH GCR:

INPUT (RGB):          OUTPUT (CMYK):
R: 128  ┐             C: 15%  ┐
G: 128  ├─ Gray       M: 15%  ├─ Mostly K
B: 128  ┘             Y: 15%  │  (cleaner)
                      K: 50%  ┘

TAC CHECK:
C + M + Y + K = 95%  ✓ (< 300% limit)
```

**Benefits:**
- Cleaner neutrals (more K, less CMY)
- Less ink = faster dry time
- Meets printer TAC requirements

---

### Stage 7: Quality Assurance

**Purpose:** Automated checks before printing

```
QA CHECKLIST:

[ ] Histogram Clipping
    ├─ White: 0.3% ✓
    └─ Black: 0.2% ✓

[ ] SSIM Similarity
    └─ 0.943 ✓ (≥0.92)

[ ] Edge Density
    └─ 18.5% ✓ (<25%)

[ ] Color Tint
    ├─ Red: +2.1
    ├─ Green: -1.8
    └─ Blue: +0.9 ✓

[ ] Text Contrast
    └─ 8.4:1 ✓ (≥7:1)

OVERALL: ✓ PASSED
```

---

## Batch Workflow

### With Reference Page Matching

```
STEP 1: Choose Reference
┌───────────────┐
│  HERO PAGE    │ ← Pick best page
│  (page 5)     │   (manually corrected)
└───────┬───────┘
        │
        │ Calculate stats:
        │ • Red mean & stddev
        │ • Green mean & stddev
        │ • Blue mean & stddev
        │
        ▼
STEP 2: Match Others
┌───────────────┐
│  PAGE 1       │ ────────┐
└───────────────┘         │
┌───────────────┐         │
│  PAGE 2       │ ────────┤ Match to
└───────────────┘         │ reference
┌───────────────┐         │ stats
│  PAGE 3       │ ────────┘
└───────────────┘
        │
        ▼
RESULT: Consistent colors throughout issue
```

---

## Troubleshooting Flow

### Image Too Dark

```
START: Image appears too dark
   │
   ▼
Check midtoneLift setting
   │
   ├─ <6? → Increase to 6-8
   │
   ▼
Check shadowCompress
   │
   ├─ <0.95? → Increase to 0.96-0.98
   │
   ▼
Check blackPoint
   │
   ├─ <12? → Increase to 15-18
   │
   ▼
Test print again
```

### Colors Look Wrong

```
START: Colors don't look right
   │
   ▼
Run tint detection
   │
   ├─ Tint detected? → Increase castStrength
   │                   to 0.8-0.9
   │
   ▼
Check saturation boosts
   │
   ├─ Too flat? → Increase redYellowBoost to 1.15
   │              Decrease blueGreenReduce to 0.88
   │
   ▼
Consider reference matching
   │
   └─ Load hero page, match strength 0.8
```

---

## Performance Optimization

### Processing Time Breakdown

```
SINGLE PAGE (2048px width):

Upscale (Real-ESRGAN)     ████████████████████ 15-30s
Cast Removal              ██ 0.3s
Levels Adjustment         █ 0.2s
Saturation Adjust         ██ 0.4s
Clarity (Unsharp)         ██ 0.3s
Matte Compensation        █ 0.2s
CMYK Conversion           ███ 0.5s
QA Checks                 ███ 0.6s
PDF Export                ██ 0.4s
                          ─────────────────────
TOTAL:                    18-33s per page

COLOR OVERHEAD: ~2.5s (8% of total)
```

### Batch Processing (100 pages)

```
WITHOUT COLOR CORRECTION:
100 pages × 20s = 33 minutes

WITH COLOR CORRECTION:
100 pages × 22.5s = 37 minutes

EXTRA TIME: +4 minutes (12%)
```

**Worth it?** YES! Professional color correction is essential for print quality.

---

## Export Formats

### RGB Workflow

```
INPUT       PROCESSING      OUTPUT
JPEG   →   [Pipeline]   →   PDF (RGB)
PNG                         PNG (RGB)

PROS:
✓ Simpler workflow
✓ Smaller files
✓ Good for digital

CONS:
✗ Printer may convert
✗ Less control
```

### CMYK Workflow

```
INPUT       PROCESSING          OUTPUT
JPEG   →   [Pipeline]      →   PDF (CMYK)
PNG        + CMYK Convert      TIFF (CMYK)
                               PSD (CMYK)

PROS:
✓ Print-optimized
✓ TAC control
✓ Predictable output

CONS:
✗ Larger files
✗ More complex
```

---

## Summary: When to Use What

| Feature | Use When | Skip When |
|---------|----------|-----------|
| Cast Removal | Yellowed/tinted paper | Clean modern scans |
| Levels Adjust | Always | Never (always useful) |
| Saturation | Faded colors | Already vibrant |
| Clarity | Soft/blurry | Already sharp |
| Paper Grain | Descreened comics | Halftone intact |
| Matte Comp | Printing on matte | Digital only |
| CMYK Convert | Offset printing | POD / digital print |
| Reference Match | Multi-page batches | Single pages |

---

## Quick Start Recipes

### Recipe 1: "Golden Age Rescue"
Heavily yellowed, faded, rough condition.

```bash
node src/cli.js -i input.jpg -o output.pdf \
  --cast-strength 0.9 \
  --red-yellow-boost 1.15 \
  --clarity-amount 0.6 \
  --add-grain \
  --matte-compensation 7
```

### Recipe 2: "Silver Age Refresh"
Moderate condition, vibrant colors.

```bash
node src/cli.js -i input.jpg -o output.pdf \
  --cast-strength 0.65 \
  --matte-compensation 6 \
  --qa-strict
```

### Recipe 3: "Modern Remaster"
Good condition, just needs optimization.

```bash
node src/cli.js -i input.jpg -o output.pdf \
  --cast-strength 0.45 \
  --clarity-amount 0.4 \
  --matte-compensation 5 \
  --cmyk \
  --tac-limit 300
```

---

For complete details, see:
- **COLOR_CORRECTION_GUIDE.md** - Full technical guide
- **COLOR_QUICK_REFERENCE.md** - Settings cheat sheet
- **examples-color.js** - Working code examples
