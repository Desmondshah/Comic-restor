# 🎭 Damage Mask Guide

## Overview

The Damage Mask feature allows you to mark and automatically repair stains, scratches, tears, and other damage on your comic book covers using AI-powered inpainting technology.

## How It Works

1. **Upload Your Comic**: First, upload your damaged comic book cover image
2. **Mark Damaged Areas**: Use the brush tool to paint over stains, scratches, and damaged areas
3. **AI Inpainting**: The system uses LaMa (Large Mask Inpainting) AI model to intelligently fill in the damaged areas
4. **Seamless Restoration**: Damaged areas are replaced with content that matches the surrounding image

## Step-by-Step Instructions

### 1. Upload Your Comic Cover

- Click on the upload zone or drag and drop your comic image
- Supported formats: JPG, PNG, TIFF
- Wait for the preview to appear

### 2. Open the Damage Mask Editor

- Click on **"draw damage areas"** link in the Damage Mask section
- The mask editor will open with your image displayed

### 3. Mark Damaged Areas

**Brush Tool** (🖌️):
- Click and drag to paint over damaged areas in semi-transparent red
- The red overlay shows what will be repaired
- Use for: stains, scratches, tears, discoloration, writing, tape marks

**Brush Size**:
- Adjust the brush size (1-200 pixels) based on the damage
- Small brush (10-20): Fine scratches, small stains
- Medium brush (30-50): Moderate damage, creases
- Large brush (60+): Large stains, tears, water damage

**Opacity Slider**:
- Adjust how visible the red mask overlay is (0-100%)
- Doesn't affect the actual mask, only visibility
- Use lower opacity to see the damage underneath

**Eraser Tool** (🧹):
- Remove mask areas you marked by mistake
- Uses the same brush size setting

**Clear Button** (🗑️):
- Removes all mask marks to start over
- Requires confirmation

### 4. Save and Apply

- Click **"💾 Save Damage Mask"** when done
- The mask is uploaded and ready to use
- The editor closes automatically

### 5. Start Restoration

- Configure your restoration settings (upscale, DPI, etc.)
- Click **"🚀 Start Restoration"**
- The AI will inpaint the marked areas during processing

## Tips for Best Results

### What to Mark

✅ **DO mark**:
- Stains and discoloration
- Scratches and scuffs
- Tears and missing pieces
- Creases and folds
- Tape residue
- Water damage
- Writing or stamps
- Color fading spots

❌ **DON'T mark**:
- Intentional design elements
- Character faces (unless truly damaged)
- Text and logos
- Fine details you want to preserve
- Large areas (over 30% of image)

### Marking Strategy

1. **Be Precise**: Only mark the actual damaged areas
2. **Avoid Edges**: Try not to mark important edges or boundaries
3. **Overlap Slightly**: Extend mask slightly beyond visible damage
4. **Test First**: Start with small areas to see results
5. **Multiple Passes**: You can run restoration multiple times

### Brush Size Guide

| Damage Type | Recommended Size |
|-------------|------------------|
| Fine scratches | 5-15 pixels |
| Small stains | 15-30 pixels |
| Creases | 20-40 pixels |
| Tears | 30-60 pixels |
| Large stains | 50-100 pixels |
| Water damage | 60-150 pixels |

## Technical Details

### AI Model

The system uses **LaMa (Large Mask Inpainting)** from Replicate:
- State-of-the-art inpainting model
- Designed for natural-looking repairs
- Works best on photographic content
- May have mixed results on stylized art

### Mask Format

- **White pixels**: Areas to inpaint (repair)
- **Black pixels**: Areas to keep unchanged
- The mask is saved as PNG format
- Resolution matches your uploaded image

### Processing Order

1. Upscaling (if enabled)
2. **Inpainting** (damage repair) ← Uses your mask
3. Face restoration (if enabled)
4. OCR text extraction (if enabled)
5. PDF export with print settings

## Common Issues & Solutions

### Issue: Brush not drawing

**Solution**: Make sure you've clicked inside the canvas area and are dragging while mouse button is held down

### Issue: Marks look wrong

**Solution**: Use the Eraser tool or Clear button to fix mistakes before saving

### Issue: Can't see what I'm marking

**Solution**: Adjust the Opacity slider to see the underlying image better

### Issue: Inpainting looks unnatural

**Solution**: 
- Make mask areas smaller and more precise
- Avoid marking complex details
- Try processing in multiple passes

### Issue: Lost my work

**Solution**: The mask is cleared when you close the editor without saving. Always click "Save Damage Mask" first.

## Alternative: Upload Pre-made Masks

If you prefer to create masks in external software (Photoshop, GIMP, etc.):

1. Create a PNG image matching your comic's dimensions
2. Paint damaged areas in **white**
3. Keep good areas **black**
4. Upload via the Damage Mask file input instead of using the editor

### Recommended Software for External Masks

- **Photoshop**: Selection tools + fill with white
- **GIMP**: Free alternative, same workflow
- **Paint.NET**: Simple and free
- **Krita**: Great for artistic masking

## Examples

### Example 1: Water Stain

1. Upload comic with water stain in corner
2. Open mask editor
3. Set brush size to 50-80 pixels
4. Paint over the entire stained area
5. Save and restore
6. Result: Stain removed, cover looks clean

### Example 2: Scratch Across Cover

1. Upload comic with diagonal scratch
2. Open mask editor
3. Set brush size to 10-20 pixels
4. Carefully trace the scratch line
5. Save and restore
6. Result: Scratch filled in seamlessly

### Example 3: Tape Residue

1. Upload comic with tape marks on spine
2. Open mask editor
3. Set brush size to 30-40 pixels
4. Mark all tape residue areas
5. Save and restore
6. Result: Tape marks gone, colors restored

## Advanced Usage

### Multiple Damage Areas

You can mark multiple separate damaged areas in one mask:
1. Mark first damage area
2. Mark second area
3. Mark third area (and so on)
4. Save once - all areas will be repaired together

### Iterative Restoration

For heavily damaged comics:
1. First pass: Mark and repair major damage
2. Download result
3. Upload restored version
4. Second pass: Mark remaining small issues
5. Final result: Nearly pristine comic

### Combining with Other Features

- **Face Restore**: Use after inpainting to enhance character faces
- **Upscaling**: Inpainting works at upscaled resolution for better detail
- **OCR**: Extract text after damage removal for re-typesetting

## Keyboard Shortcuts (Planned)

Future versions may include:
- `B` - Switch to Brush tool
- `E` - Switch to Eraser tool
- `[` - Decrease brush size
- `]` - Increase brush size
- `Ctrl+Z` - Undo last stroke
- `Ctrl+S` - Save mask

## Performance Notes

- **Drawing**: Instant, runs in browser
- **Saving**: 1-2 seconds to generate and upload mask
- **Inpainting**: 30-90 seconds per image (depends on size)
- **Total Time**: About 2-5 minutes for full restoration

## Credits

- **LaMa Inpainting**: Samsung AI Research
- **UI Design**: Custom canvas-based editor
- **Integration**: Replicate API

## Need Help?

- Check that your image uploaded successfully before opening editor
- Try with a smaller test image first
- Keep mask areas focused on actual damage
- Contact support if consistent issues occur

---

**Pro Tip**: For best results, work in a well-lit environment where you can clearly see all the damage on your comic cover before marking it!
