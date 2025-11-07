# Comic Restoration Workflow Guide

This guide covers best practices for restoring vintage comics for print reproduction.

## Table of Contents
1. [Scanning Guidelines](#scanning-guidelines)
2. [Creating Damage Masks](#creating-damage-masks)
3. [Restoration Process](#restoration-process)
4. [Quality Checks](#quality-checks)
5. [Print Preparation](#print-preparation)
6. [Professional Tips](#professional-tips)

---

## Scanning Guidelines

### Recommended Settings
- **Resolution**: 300-600 DPI (minimum 300 for print)
- **Color Mode**: RGB Color (even for B&W comics)
- **Format**: TIFF (lossless) or high-quality JPEG (95+)
- **Bit Depth**: 16-bit if available, minimum 8-bit

### Scanner Setup
1. Clean scanner glass thoroughly
2. Remove staples/bindings if possible
3. Use book cradle for bound volumes
4. Scan in sections for oversized pages
5. Maintain consistent lighting

### File Naming
Use sequential numbering for proper batch order:
```
page001.jpg
page002.jpg
page003.jpg
```

---

## Creating Damage Masks

Masks tell the AI where to repair damage. Only mask actual damage (tears, stains, scratches) - not content you want to preserve.

### Tools
- Photoshop, GIMP, or Paint.NET
- Black background, white brush
- Save as PNG with same base filename

### Masking Guidelines

**DO mask:**
- ✓ Tears and rips
- ✓ Stains and discoloration
- ✓ Scratches through the image
- ✓ Missing corners/edges
- ✓ Tape residue
- ✓ Foxing (brown spots)

**DON'T mask:**
- ✗ Intentional artwork elements
- ✗ Speech balloons you want to keep
- ✗ Original printing artifacts (halftone dots)
- ✗ Entire backgrounds
- ✗ Character faces (use face-restore instead)

### Example Workflow
```powershell
# 1. Open scan in image editor
# 2. Create new layer
# 3. Paint white over damaged areas with soft brush
# 4. Save as page001_mask.png
# 5. Run restoration:
npm start -- -i page001.jpg -m page001_mask.png -o output/page001.pdf
```

---

## Restoration Process

### Step 1: Test Single Page
Always test on one page first to dial in settings:

```powershell
npm start -- -i samples/page001.jpg -o output/test.pdf
```

### Step 2: Adjust Settings

**If image is too soft:**
```powershell
npm start -- -i samples/page001.jpg --scale 4 --dpi 600
```

**If colors look wrong:**
- Adjust `--matte-compensation` (try 0-10)
- Check original scan quality

**If AI adds unwanted elements:**
- Reduce restoration aggressiveness
- Use more targeted masks
- Avoid face-restore on stylized art

### Step 3: Batch Process

Once settings are dialed in:

```powershell
npm start -- -b -i samples/ -o output/ --combine
```

---

## Quality Checks

The pipeline automatically checks for:

### Histogram Clipping
- **White clipping**: Blown highlights (> 250 RGB)
- **Black clipping**: Crushed shadows (< 5 RGB)
- **Fix**: Adjust curves in pre-processing or reduce matte compensation

### Sharpness
- **Laplacian variance**: Measures edge definition
- **Threshold**: > 100 for good print quality
- **Fix**: Increase scale factor or rescan at higher DPI

### SSIM (Structural Similarity)
- **Range**: 0.0 (different) to 1.0 (identical)
- **Goal**: Balance between restoration and era-faithfulness
- **Typical**: 0.85-0.95 for good restoration

### Manual Checks
Before printing, verify:
- [ ] Text is legible in all balloons
- [ ] Colors match original intent
- [ ] No AI hallucinations (added elements)
- [ ] Damage is removed without over-smoothing
- [ ] Page edges are clean
- [ ] Bleed area has content (no white borders)

---

## Print Preparation

### Standard Comic Sizes

**Modern Comic (6.625" x 10.25")**
```powershell
npm start -- -i input.jpg --width 6.625 --height 10.25 --bleed 0.125
```

**Golden Age (7.75" x 10.5")**
```powershell
npm start -- -i input.jpg --width 7.75 --height 10.5 --bleed 0.125
```

**Digest Size (5.5" x 8.5")**
```powershell
npm start -- -i input.jpg --width 5.5 --height 8.5 --bleed 0.125
```

**Magazine (8.5" x 11")**
```powershell
npm start -- -i input.jpg --width 8.5 --height 11 --bleed 0.125
```

### Bleed Margins

**Standard bleed**: 0.125" (1/8")
- Required by most print-on-demand services
- Prevents white edges from cutting variations

**Extended bleed**: 0.1875" (3/16")
- For professional offset printing
- Recommended for hardcover books

### Paper Types

**Matte Paper** (default)
```powershell
npm start -- -i input.jpg --matte-compensation 5
```
- Most common for comics
- Prevents glare
- Needs midtone lift to prevent darkening

**Glossy Paper**
```powershell
npm start -- -i input.jpg --matte-compensation 0
```
- No compensation needed
- Higher contrast
- More vibrant colors

**Newsprint**
```powershell
npm start -- -i input.jpg --matte-compensation 8 --dpi 300
```
- High compensation for absorption
- Slightly lighter overall
- Lower resolution acceptable

---

## Professional Tips

### Era-Faithful Restoration

Comics are historical artifacts. The goal is to remove damage while preserving the original artistic intent.

**Preserve:**
- Original printing style (halftone patterns for older comics)
- Intentional color choices
- Artistic line work variations
- Period-appropriate paper texture

**Remove:**
- Actual damage (tears, stains)
- Yellowing from age
- Dirt and smudges
- Scanner artifacts

### Batch Processing Strategy

For large projects (full issues/volumes):

1. **Sort and organize**
   ```
   issue-01/
   ├── scans/
   │   ├── page001.jpg - page032.jpg
   └── masks/
       ├── page005_mask.png
       └── page017_mask.png
   ```

2. **Process in chunks**
   - Do 5-10 pages at a time
   - Review before continuing
   - Avoid rate limits

3. **Keep originals**
   - Never overwrite scans
   - Archive in separate directory
   - Consider version control

### Cost Optimization

Replicate API charges per inference:

**Budget tier** (~$5-10 per issue):
- Scale: 2x
- DPI: 300
- No face restoration
- Process overnight (slower = cheaper)

**Premium tier** (~$15-25 per issue):
- Scale: 4x
- DPI: 600
- Selective face restoration
- Faster processing

**Estimate costs before large batches!**

### Printer Submission

Most print-on-demand services require:

- [ ] PDF format (✓ This pipeline outputs PDF)
- [ ] 300 DPI minimum (✓ Default setting)
- [ ] Bleed margins (✓ Configurable)
- [ ] RGB or CMYK (✓ Can convert post-process)
- [ ] Embedded fonts if text added (✓ N/A for scans)

Common services:
- Amazon KDP (Kindle Direct Publishing)
- IngramSpark
- Lulu
- PrintNinja (for larger runs)

---

## Common Issues & Solutions

### Issue: Output too dark on print
**Solution**: Increase matte compensation to 7-10

### Issue: Lost fine detail
**Solution**: Use --scale 4 and --dpi 600

### Issue: AI added weird elements
**Solution**: Be more conservative with masks, avoid face-restore on cartoons

### Issue: File size too large
**Solution**: Reduce DPI to 300, or compress PDFs post-process

### Issue: Colors don't match original
**Solution**: Calibrate monitor, check original scan, adjust in post

### Issue: API timeout errors
**Solution**: Reduce concurrency to 1, add delays between batches

### Issue: Seams visible on page spreads
**Solution**: Scan as single image or stitch before restoration

---

## Advanced: Custom Pipelines

For special cases, you can create custom processing scripts:

```javascript
import { restorePage, createPrintPDF } from "./src/index.js";
import sharp from "sharp";

// Custom workflow
async function customRestore(inputPath) {
  // 1. Pre-process: adjust levels
  let buffer = await sharp(inputPath)
    .normalize()
    .modulate({ brightness: 1.1 })
    .toBuffer();

  // 2. AI restoration
  buffer = await restorePage(buffer, { scale: 2 });

  // 3. Post-process: add sharpening
  buffer = await sharp(buffer)
    .sharpen({ sigma: 1.5 })
    .toBuffer();

  // 4. Export to PDF
  await createPrintPDF(buffer, "output/custom.pdf");
}
```

---

## Resources

- [Replicate Documentation](https://replicate.com/docs)
- [Real-ESRGAN Paper](https://arxiv.org/abs/2107.10833)
- [Print-on-Demand Guidelines](https://kdp.amazon.com/help/topic/G201834180)
- [Comic Book Printing Standards](https://printninjahelp.com/comic-book-printing)

---

**Remember**: Always work on copies, never original scans. Keep backups!
