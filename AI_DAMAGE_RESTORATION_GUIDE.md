# AI Damage Restoration Guide

## 🤖 Overview

The AI Damage Restoration feature uses **Google Nano Banana** on Replicate to automatically remove damage from vintage comic scans, including:

- **Scratches & tears**
- **Dust & dirt particles**
- **Paper folds & creases**
- **Stains & discoloration**
- **Age-related damage**

Unlike traditional inpainting that requires manual mask creation, AI damage restoration works automatically using advanced AI models.

---

## 🚀 Quick Start

### Web UI

1. **Upload** your comic scan
2. **Enable AI Damage Restoration** checkbox
3. **Configure options** (optional):
   - ✅ Preserve logos & titles
   - ✅ Preserve artist signatures
   - ✅ Apply modern remaster style
   - Adjust AI strength (0-100%)
4. **Click "Start Restoration"**

The AI will automatically detect and remove damage while preserving the original artwork.

### Command Line

```bash
# Basic AI restoration
comic-restore ai-restore -i input.jpg -o output/

# With custom options
comic-restore ai-restore -i input.jpg -o output/ \
  --strength 0.8 \
  --custom-instructions "Extra careful with text preservation"

# Batch processing
comic-restore ai-restore -i input_folder/ -o output/ --batch

# Generate before/after comparison
comic-restore ai-restore -i input.jpg -o output/ --comparison
```

---

## 🎯 How It Works

### The AI Pipeline

```
Original Scan
    ↓
[1] AI Damage Detection
    ↓
[2] Intelligent Inpainting
    ↓
[3] Style Enhancement
    ↓
[4] Upscaling (optional)
    ↓
Restored Comic
```

### What the AI Does

1. **Analyzes** the image to detect damage patterns
2. **Reconstructs** damaged areas using contextual understanding
3. **Preserves** important elements (logos, signatures, text)
4. **Enhances** the result with modern remaster styling
5. **Maintains** original composition and artistic intent

---

## ⚙️ Configuration Options

### Preserve Logos & Titles
**Default:** Enabled ✅

Instructs the AI to maintain original logos, titles, and branding exactly as they appear.

```javascript
// Web UI
document.getElementById('aiPreserveLogo').checked = true;

// CLI
comic-restore ai-restore -i input.jpg  // Enabled by default
comic-restore ai-restore -i input.jpg --no-preserve-logo  // Disable
```

### Preserve Artist Signatures
**Default:** Enabled ✅

Keeps artist signatures intact during restoration.

```bash
# CLI
comic-restore ai-restore -i input.jpg  // Enabled by default
comic-restore ai-restore -i input.jpg --no-preserve-signature  // Disable
```

### Modern Remaster Style
**Default:** Enabled ✅

Applies a modern Marvel/DC remastered edition aesthetic.

```bash
# CLI
comic-restore ai-restore -i input.jpg  // Enabled by default
comic-restore ai-restore -i input.jpg --no-modern-style  // Disable for vintage look
```

### AI Strength
**Default:** 0.8 (80%)

Controls how aggressively the AI transforms the image.

- **0.5-0.6:** Conservative (minimal changes)
- **0.7-0.8:** Balanced (recommended)
- **0.9-1.0:** Aggressive (maximum restoration)

```bash
# CLI
comic-restore ai-restore -i input.jpg --strength 0.8
```

**Web UI:** Use the slider in AI options (0-100%)

### Custom Instructions
Add specific restoration requirements:

```bash
# CLI
comic-restore ai-restore -i input.jpg \
  --custom-instructions "Preserve the vintage color palette"
```

---

## 📊 Use Cases

### 1. Golden Age Comics (1938-1956)
**Challenge:** Heavy paper degradation, yellowing, tears

```bash
comic-restore ai-restore -i golden_age.jpg \
  --strength 0.9 \
  --custom-instructions "Heavy damage removal, preserve vintage newsprint texture"
```

### 2. Silver Age Comics (1956-1970)
**Challenge:** Moderate damage, color fading

```bash
comic-restore ai-restore -i silver_age.jpg \
  --strength 0.8 \
  --modern-style
```

### 3. Bronze Age Comics (1970-1985)
**Challenge:** Light damage, minor discoloration

```bash
comic-restore ai-restore -i bronze_age.jpg \
  --strength 0.6 \
  --preserve-logo \
  --preserve-signature
```

### 4. Modern Reprints
**Challenge:** Scan artifacts, JPEG compression

```bash
comic-restore ai-restore -i modern.jpg \
  --strength 0.5 \
  --custom-instructions "Remove scan artifacts and compression noise only"
```

---

## 🔄 Comparison Mode

Generate before/after comparisons to verify results:

```bash
# Single image with comparison
comic-restore ai-restore -i input.jpg -o output/ --comparison
```

**Output:**
- `input_restored.jpg` - Restored image
- `input_comparison.jpg` - Side-by-side before/after

---

## 💡 Best Practices

### ✅ DO

1. **Start with moderate strength (0.7-0.8)** and adjust based on results
2. **Enable preservation options** for important elements
3. **Test on a single page** before batch processing
4. **Use comparison mode** to verify quality
5. **Combine with upscaling** for best results

### ❌ DON'T

1. **Don't use maximum strength** on lightly damaged scans
2. **Don't disable preservation** unless intentional
3. **Don't skip comparison mode** on important work
4. **Don't batch process** without testing first

---

## 🎨 Integration with Full Pipeline

AI Damage Restoration works seamlessly with other features:

```bash
# Full restoration pipeline
comic-restore restore -i input.jpg -o output.pdf \
  --enable-ai-restore \
  --scale 4 \
  --lighting modern-reprint \
  --dpi 600
```

**Processing Order:**
1. AI Damage Restoration
2. Upscaling (2x or 4x)
3. Lighting Enhancement
4. Color Correction
5. PDF Export

---

## 📈 Performance

### Processing Times

| Resolution | Processing Time | Cost (Replicate) |
|-----------|----------------|------------------|
| 1000x1500 | 30-60 seconds  | ~$0.01-0.02      |
| 2000x3000 | 60-90 seconds  | ~$0.02-0.03      |
| 4000x6000 | 90-120 seconds | ~$0.03-0.05      |

### Batch Processing

```bash
# Process 10 pages at once
comic-restore ai-restore -i scans/ -o output/ --batch
```

**Note:** AI restoration processes sequentially with 2-second delays to avoid rate limits.

---

## 🛠️ Programmatic Usage

### Node.js Integration

```javascript
import { AIDamageRestoration } from './src/ai-damage-restoration.js';

const restorer = new AIDamageRestoration();

// Single image
await restorer.restoreDamage('input.jpg', 'output.jpg', {
  preserveLogo: true,
  preserveSignature: true,
  modernStyle: true,
  strength: 0.8
});

// Batch processing
const results = await restorer.restoreBatch(
  ['page1.jpg', 'page2.jpg', 'page3.jpg'],
  'output/',
  { strength: 0.8 }
);

// With comparison
await restorer.restoreWithComparison('input.jpg', 'output/', {
  strength: 0.8
});
```

---

## 🔧 Troubleshooting

### "Insufficient Replicate credits"

**Solution:** Purchase credits at https://replicate.com/account/billing
Wait 2-5 minutes for activation.

### "API authentication failed"

**Solution:** Check your `.env` file:
```bash
REPLICATE_API_TOKEN=r8_your_token_here
```

### "Rate limit reached"

**Solution:** Wait 2-3 minutes between large batches. The tool automatically adds delays.

### Poor Results

**Try:**
1. Adjust `--strength` value (lower for less aggressive changes)
2. Add `--custom-instructions` with specific requirements
3. Disable `--modern-style` for vintage preservation
4. Process at higher resolution first

---

## 🌟 Advanced Tips

### Custom Prompt Engineering

The AI uses this base prompt structure:

```
Enhance and modernize this classic comic cover while preserving 
its original composition and artistic intent.

Tasks:
• Remove dust, scratches, and paper folds.
• Fix torn edges and missing areas.
• Clean up stains and discoloration.
• Maintain original logo, title, and text exactly.
• Preserve artist signature exactly.
• Apply modern Marvel remastered edition style.
```

Add custom instructions to extend this:

```bash
comic-restore ai-restore -i input.jpg \
  --custom-instructions "Keep the halftone dot pattern visible"
```

### Optimal Settings by Era

**Golden Age (1938-1956):**
```bash
--strength 0.9 --modern-style --preserve-logo --preserve-signature
```

**Silver Age (1956-1970):**
```bash
--strength 0.8 --modern-style --preserve-logo --preserve-signature
```

**Bronze Age (1970-1985):**
```bash
--strength 0.7 --modern-style --preserve-logo --preserve-signature
```

**Modern Age (1985+):**
```bash
--strength 0.5 --no-modern-style --preserve-logo --preserve-signature
```

---

## 📚 Examples

### Example 1: Heavy Damage Restoration

**Input:** Severely damaged Golden Age cover with tears, stains, missing corners

```bash
comic-restore ai-restore -i damaged_cover.jpg -o restored/ \
  --strength 0.95 \
  --modern-style \
  --comparison
```

**Result:** Clean, professional-looking restoration with all damage removed

### Example 2: Subtle Enhancement

**Input:** Modern comic with minor scan artifacts

```bash
comic-restore ai-restore -i modern_scan.jpg -o enhanced/ \
  --strength 0.5 \
  --no-modern-style \
  --custom-instructions "Remove scan artifacts only, preserve original colors"
```

**Result:** Clean scan with artifacts removed, colors preserved

### Example 3: Batch Archival Project

**Input:** 50 vintage comic pages

```bash
comic-restore ai-restore -i archive/scans/ -o archive/restored/ \
  --batch \
  --strength 0.8 \
  --preserve-logo \
  --preserve-signature
```

**Result:** Entire collection restored consistently

---

## 🎓 FAQ

**Q: Does this replace manual restoration?**
A: For many cases, yes! AI restoration is excellent for standard damage. Complex cases may still benefit from manual touch-up.

**Q: Will it change the artwork style?**
A: The AI preserves the original style while removing damage. Use `--no-modern-style` for maximum preservation.

**Q: Can I restore color to B&W comics?**
A: No, this tool focuses on damage removal. Use separate colorization tools for that.

**Q: What's the cost per page?**
A: Approximately $0.01-0.05 per page depending on resolution.

**Q: Can I use my own AI model?**
A: Currently uses Google Nano Banana. Custom models may be supported in future updates.

---

## 🔗 Related Features

- [Full Restoration Pipeline](./QUICKSTART.md)
- [Lighting Effects](./PREMIUM_LIGHTING_GUIDE.md)
- [Color Correction](./COLOR_CORRECTION_GUIDE.md)
- [Batch Processing](./WORKFLOW.md)
- [Print-Ready Export](./GETTING_STARTED.md)

---

**Last Updated:** November 2025
**Model:** Google Nano Banana via Replicate
**Status:** ✅ Production Ready
