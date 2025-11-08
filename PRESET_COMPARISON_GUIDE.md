# Preset Management & Comparison Features Guide

## 📋 Overview

This guide covers the newly implemented preset management system and before/after comparison features for the Comic Restoration Pipeline web UI.

## 💾 Preset Management

### What Are Presets?

Presets are saved collections of restoration settings that can be quickly applied to streamline your workflow. Perfect for batch processing comics from the same era or with similar characteristics.

### Default Presets

Four era-specific presets are included by default:

#### 📚 Golden Age (1938-1956)
- **Best for:** Older comics with yellowed paper and faded colors
- **Settings:**
  - 4x upscale for maximum quality
  - 600 DPI for archival purposes
  - Vintage-enhanced lighting
  - High matte compensation (10)
  - Face restore: Disabled (period-appropriate style)

#### ✨ Silver Age (1956-1970)
- **Best for:** Classic comics needing balanced restoration
- **Settings:**
  - 2x upscale (standard quality)
  - 300 DPI
  - Modern reprint lighting
  - Moderate matte compensation (7)
  - Face restore: Disabled

#### 🥉 Bronze Age (1970-1985)
- **Best for:** Comics from the transition period
- **Settings:**
  - 2x upscale
  - 300 DPI
  - Subtle lighting enhancements
  - Low matte compensation (5)
  - Face restore: Enabled

#### 🆕 Modern Age (1985+)
- **Best for:** Recent comics needing minimal processing
- **Settings:**
  - 2x upscale
  - 300 DPI
  - Dramatic lighting
  - Minimal matte compensation (3)
  - Face restore: Enabled
  - OCR extraction: Enabled

### Using Presets

1. **Select a Preset**
   - Use the dropdown menu in the "Presets" section
   - Settings will automatically update to match the preset
   - A notification will confirm the preset was applied

2. **Save Custom Preset**
   - Configure your desired settings manually
   - Click the **💾 Save** button
   - Enter:
     - **Preset Name:** Descriptive name for your preset
     - **Description:** (Optional) Notes about when to use this preset
     - **Era Type:** Associate with a comic era or leave as "Custom"
   - Click **Save Preset**
   - Your custom preset will appear in the dropdown

3. **Delete Custom Preset**
   - Select the preset you want to delete
   - Click the **🗑️** button
   - Confirm deletion
   - Note: Default presets cannot be deleted

### Preset Storage

- Presets are stored in browser localStorage
- Persist across sessions
- Unique to each browser/device
- Export/import functionality coming soon

## 🔄 Before/After Comparison

### Overview

The comparison viewer allows you to visually compare original and restored images to evaluate restoration quality.

### Accessing Comparison

1. **From Completed Jobs:**
   - Click the **🔄 Compare** button on any completed restoration job
   - The comparison viewer will open automatically

### Comparison Modes

#### Split View (Default)

Interactive slider that divides the image:
- **Left side:** Original image
- **Right side:** Restored image
- **Slider:** Drag left/right to adjust the split position
- Perfect for comparing specific areas

**How to use:**
1. Click and drag the slider handle
2. Or use the range slider below the image
3. Move across different areas to check consistency

#### Side-by-Side View

Shows both images simultaneously:
- **Left panel:** Original image
- **Right panel:** Restored image
- Synchronized zoom and pan
- Perfect for overall comparison

**How to use:**
1. Click **Side-by-Side** button to switch modes
2. Use zoom controls to inspect details
3. Pan by clicking and dragging
4. Both panels stay synchronized

### Zoom & Pan Controls

Available in Side-by-Side mode:

- **🔍+ Zoom In:** Increase magnification (up to 500%)
- **🔍− Zoom Out:** Decrease magnification (down to 50%)
- **Reset:** Return to 100% zoom and center position
- **Mouse Wheel:** Scroll to zoom in/out
- **Click & Drag:** Pan across the image when zoomed in

**Zoom Sync:**
- Both images zoom together
- Both images pan together
- Ensures you're comparing the exact same region

### Closing Comparison

- Click the **✕** button in the top-right corner
- Or scroll down to continue working

## 🎨 Real-Time Preview (Experimental)

### How It Works

When enabled, the preview updates automatically as you adjust settings:

1. Upload an image
2. Change any setting (scale, DPI, lighting, etc.)
3. Preview updates after 1 second of inactivity
4. See live results without submitting full restoration

### Benefits

- **Instant Feedback:** See how settings affect the result
- **Fine-Tuning:** Adjust settings until you get the perfect look
- **Save Time:** Avoid multiple full restorations
- **Learn:** Understand what each setting does

### Current Status

**Note:** Real-time preview requires server-side implementation. The UI is ready, but the `/api/preview-with-settings` endpoint needs to be added to `server.js`.

## 🔧 Workflow Examples

### Example 1: Batch Processing Golden Age Comics

1. Select **📚 Golden Age** preset
2. Upload first comic scan
3. Click **🚀 Start Restoration**
4. Repeat for all Golden Age comics
5. All will use consistent settings

### Example 2: Custom Preset for Specific Series

1. Upload a sample page from the series
2. Adjust settings to perfection:
   - Try different lighting presets
   - Adjust matte compensation
   - Enable/disable face restore
3. Click **💾 Save** to create preset
4. Name it after the series (e.g., "Amazing Spider-Man Vol 1")
5. Use for all issues in the series

### Example 3: Quality Checking with Comparison

1. Restoration completes
2. Click **🔄 Compare** on the job
3. Use **Split View** to check:
   - Color accuracy
   - Detail preservation
   - Artifact removal
4. Switch to **Side-by-Side** mode
5. Zoom in to inspect fine details
6. If satisfied, download; if not, adjust settings and re-run

## 💡 Tips & Best Practices

### Preset Management

- **Name Clearly:** Use descriptive names like "Marvel 1960s High Quality" instead of "Preset 1"
- **Add Descriptions:** Future you will thank present you
- **Organize by Era:** Group presets by comic age for easy selection
- **Test First:** Create presets after testing settings on sample pages

### Comparison Viewing

- **Use Split View for:** Checking specific problem areas, edge comparisons
- **Use Side-by-Side for:** Overall quality assessment, color evaluation
- **Zoom In:** Always check fine details at 200%+ zoom
- **Check Multiple Areas:** Don't judge based on one region

### Performance

- **Real-time Preview:** Disable if experiencing slowness
- **Comparison Images:** Large files may take time to load
- **Browser Cache:** Clear if images don't update

## 🚀 Keyboard Shortcuts (Coming Soon)

Future enhancement for power users:

- `1-4`: Select preset 1-4
- `S`: Save current settings as preset
- `C`: Open comparison view
- `Space`: Toggle split/side-by-side
- `+/-`: Zoom in/out
- `R`: Reset zoom

## 🐛 Troubleshooting

### Presets Not Saving
- Check browser localStorage is enabled
- Clear site data and try again
- Use Incognito mode to test

### Comparison Not Loading
- Ensure job status is "completed"
- Check browser console for errors
- Verify image files exist in output folder

### Preview Not Updating
- Feature requires server implementation
- Check console for API errors
- Fallback: Use full restoration workflow

## 📚 Technical Details

### Storage Format

Presets are stored as JSON in localStorage:

```javascript
{
  "preset-id": {
    "name": "Preset Name",
    "description": "Optional description",
    "era": "golden-age",
    "settings": {
      "scale": 4,
      "dpi": 600,
      "lightingPreset": "vintage-enhanced",
      "matteComp": 10,
      "bleed": 0.125,
      "faceRestore": false,
      "extractOCR": false
    },
    "isDefault": false
  }
}
```

### Browser Compatibility

- Modern browsers with ES6 support
- localStorage required
- CSS Grid required
- Range input support required

### File References

- **UI:** `public/index.html`
- **Logic:** `public/app.js`
- **Styles:** Embedded in index.html `<style>` section

## 🔮 Future Enhancements

- [ ] Export/import presets as JSON files
- [ ] Share presets with other users
- [ ] Preset categories and tags
- [ ] Cloud sync for presets
- [ ] A/B comparison for multiple versions
- [ ] Overlay mode for pixel-perfect comparison
- [ ] Difference map highlighting changes
- [ ] Comparison timeline for batch jobs
- [ ] Video slider for smooth transitions

---

**Last Updated:** 2025-11-07
**Version:** 1.0.0
