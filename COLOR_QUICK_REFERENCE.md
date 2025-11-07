# Color Correction Quick Reference Card

## Quick Config Presets

### Golden Age Comics (1930s-1950s)
Heavy yellowing, faded colors, rough paper texture.

```json
{
  "colorCorrection": {
    "removeCast": true,
    "castStrength": 0.85,
    "redYellowBoost": 1.15,
    "blueGreenReduce": 0.90,
    "applyClarity": true,
    "clarityAmount": 0.6,
    "addGrain": true,
    "grainStrength": 0.04
  },
  "matteStock": {
    "midtoneLift": 7
  }
}
```

### Silver Age Comics (1960s-1970s)
Moderate yellowing, vibrant colors, halftone intact.

```json
{
  "colorCorrection": {
    "removeCast": true,
    "castStrength": 0.65,
    "redYellowBoost": 1.08,
    "blueGreenReduce": 0.92,
    "applyClarity": true,
    "clarityAmount": 0.5,
    "addGrain": false
  },
  "matteStock": {
    "midtoneLift": 6
  }
}
```

### Modern Comics (1980s+)
Minimal yellowing, good condition, sharp details.

```json
{
  "colorCorrection": {
    "removeCast": true,
    "castStrength": 0.45,
    "redYellowBoost": 1.05,
    "blueGreenReduce": 0.95,
    "applyClarity": true,
    "clarityAmount": 0.4,
    "addGrain": false
  },
  "matteStock": {
    "midtoneLift": 5
  }
}
```

---

## Common Adjustments

### Too Dark After Processing
```json
{
  "matteStock": {
    "midtoneLift": 8,
    "shadowCompress": 0.92
  }
}
```

### Too Light / Washed Out
```json
{
  "colorCorrection": {
    "whitePoint": 240,
    "blackPoint": 15
  },
  "matteStock": {
    "midtoneLift": 4
  }
}
```

### Colors Too Flat / Dull
```json
{
  "colorCorrection": {
    "redYellowBoost": 1.2,
    "blueGreenReduce": 0.88
  }
}
```

### Colors Too Neon / Oversaturated
```json
{
  "colorCorrection": {
    "redYellowBoost": 1.05,
    "blueGreenReduce": 0.95
  },
  "matteStock": {
    "saturateReduce": 0.92
  }
}
```

### Oversharpened / Halos
```json
{
  "colorCorrection": {
    "applyClarity": true,
    "clarityRadius": 1.5,
    "clarityAmount": 0.3
  }
}
```

### Plastic / AI Gloss Look
```json
{
  "colorCorrection": {
    "addGrain": true,
    "grainStrength": 0.03,
    "clarityAmount": 0.4
  }
}
```

---

## Print Stock Presets

### Gloss Coated Stock
```json
{
  "matteStock": {
    "enabled": true,
    "midtoneLift": 3,
    "shadowCompress": 0.98
  },
  "cmyk": {
    "tacLimit": 340,
    "dotGainAmount": 10
  }
}
```

### Matte Coated Stock (Recommended for Comics)
```json
{
  "matteStock": {
    "enabled": true,
    "midtoneLift": 6,
    "shadowCompress": 0.95
  },
  "cmyk": {
    "tacLimit": 300,
    "dotGainAmount": 15
  }
}
```

### Uncoated Offset Stock
```json
{
  "matteStock": {
    "enabled": true,
    "midtoneLift": 8,
    "shadowCompress": 0.93
  },
  "cmyk": {
    "tacLimit": 280,
    "dotGainAmount": 18
  }
}
```

---

## QA Thresholds

### Conservative (High Quality)
```json
{
  "qa": {
    "clippingThreshold": 0.002,
    "minSSIM": 0.95,
    "maxEdgeDensity": 0.20
  }
}
```

### Standard (Recommended)
```json
{
  "qa": {
    "clippingThreshold": 0.005,
    "minSSIM": 0.92,
    "maxEdgeDensity": 0.25
  }
}
```

### Relaxed (Damaged Originals)
```json
{
  "qa": {
    "clippingThreshold": 0.01,
    "minSSIM": 0.88,
    "maxEdgeDensity": 0.30
  }
}
```

---

## Command Line Usage

### Basic Color Correction
```bash
node src/cli.js -i input.png -o output.pdf \
  --color-correction \
  --cast-strength 0.7 \
  --matte-compensation 6
```

### With CMYK Conversion
```bash
node src/cli.js -i input.png -o output.pdf \
  --color-correction \
  --cmyk \
  --tac-limit 300 \
  --gcr-strength 0.8
```

### With Reference Matching
```bash
node src/cli.js -i input.png -o output.pdf \
  --color-correction \
  --reference hero-page.png \
  --match-strength 0.8
```

### Full QA Check
```bash
node src/cli.js -i input.png -o output.pdf \
  --color-correction \
  --qa-strict \
  --check-all
```

---

## Programmatic API

### Quick Color Correction
```javascript
import { applyColorCorrection } from './src/color-correction.js';

const corrected = await applyColorCorrection(imageBuffer, {
  removeCast: true,
  castStrength: 0.7,
  applyLevelsAdjust: true,
  applySaturation: true,
  applyLocalContrast: true
});
```

### Full Pipeline
```javascript
import { restorePage } from './src/restore.js';

const result = await restorePage('input.png', {
  scale: 2,
  applyColorCorrection: true,
  removeCast: true,
  castStrength: 0.7,
  applyLevels: true,
  applySaturation: true,
  applyClarity: true,
  matteCompensation: true,
  midtoneLift: 6,
  runQA: true
});
```

### CMYK Workflow
```javascript
import { convertToCmyk, exportCmykChannels } from './src/cmyk-conversion.js';

// Convert
const cmykData = await convertToCmyk(buffer, {
  gcrStrength: 0.8,
  tacLimit: 300
});

// Export separations
await exportCmykChannels(cmykData, 'output/page');
// Creates: page_c.png, page_m.png, page_y.png, page_k.png
```

---

## Troubleshooting Decision Tree

### Problem: Image too dark
1. Check `midtoneLift` - increase to 7-8
2. Check `shadowCompress` - increase to 0.96
3. Check `whitePoint` - decrease to 240

### Problem: Image too light
1. Check `midtoneLift` - decrease to 4-5
2. Check `blackPoint` - increase to 15-18
3. Check `whitePoint` - increase to 250

### Problem: Colors wrong
1. Run color tint detection
2. Increase `castStrength` if tinted
3. Adjust saturation boosts/reduces
4. Check if reference matching needed

### Problem: Oversharpened
1. Check `edgeDensity` metric
2. Decrease `clarityAmount` to 0.3
3. Decrease `clarityRadius` to 1.5
4. Add grain overlay

### Problem: QA failing
1. Check which specific test failed
2. Review warnings list
3. Adjust relevant settings
4. Re-run QA

---

## Key Numbers to Remember

| Setting | Range | Default | Notes |
|---------|-------|---------|-------|
| Cast Strength | 0.0-1.0 | 0.7 | Higher = more correction |
| White Point | 235-255 | 245 | Lower = darker highlights |
| Black Point | 0-20 | 12 | Higher = lighter shadows |
| Red/Yellow Boost | 0.8-1.3 | 1.1 | Higher = more saturated |
| Blue/Green Reduce | 0.8-1.0 | 0.92 | Lower = less saturated |
| Midtone Lift | 0-12 | 6 | Higher = brighter |
| Clarity Amount | 0.0-1.0 | 0.5 | Higher = sharper |
| Grain Strength | 0.01-0.05 | 0.03 | Higher = more grain |
| GCR Strength | 0.0-1.0 | 0.8 | Higher = more black |
| TAC Limit | 240-340 | 300 | Lower = less ink |

---

## Testing Checklist

Before batch processing:
- [ ] Test on 2-3 representative pages
- [ ] Check QA warnings
- [ ] Verify SSIM >0.92
- [ ] Verify edge density <25%
- [ ] Check for color tints
- [ ] Verify text contrast >7:1
- [ ] Print test on actual stock
- [ ] Adjust if too dark/light/saturated
- [ ] Document final settings
- [ ] Run batch with same settings

---

## Performance Tips

- Color correction: ~0.3s per page
- CMYK conversion: ~0.5s per page  
- QA checks: ~0.5s per page
- Total overhead: ~1-2s per page

For 100-page batch:
- Without color: ~20-30 minutes
- With color: ~25-35 minutes
- Extra ~5 minutes total

---

## Support

Full documentation: `COLOR_CORRECTION_GUIDE.md`
Examples: `node examples-color.js all`
Issues: GitHub repository
