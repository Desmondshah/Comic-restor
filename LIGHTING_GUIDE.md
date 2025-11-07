# ✨ Premium Lighting Effects Guide

## Overview

The Premium Lighting system adds **depth, dynamic highlights, and subtle shadows** to give your restored comics a fresh, modern reprint variant look — like premium collector editions from Marvel or DC.

## 🎨 Lighting Presets

### Modern Reprint (Default) ⭐
**Best for:** Most comic covers and pages  
**Effect:** Balanced depth with subtle highlights and rim lighting

- Adds directional depth (top-left light source)
- Dynamic highlights on bright areas (30% intensity)
- Warm rim lighting on edges (golden glow)
- Subtle ambient occlusion in shadows
- Local clarity enhancement
- 15% contrast boost, 10% vibrance increase

**Perfect for creating that "variant cover" premium look!**

---

### Dramatic 🔥
**Best for:** Action covers, hero shots, dramatic scenes  
**Effect:** High contrast with strong lighting and shadows

- Strong directional depth (60% intensity)
- Bright dynamic highlights (50% intensity)
- Strong rim lighting (40% strength)
- Deep ambient occlusion shadows
- High clarity enhancement
- 25% contrast boost, 15% vibrance
- Cinematic vignette effect

**Creates a bold, cinematic presentation!**

---

### Subtle 🌙
**Best for:** Vintage comics, already well-colored pages  
**Effect:** Gentle enhancement without overdoing it

- Light directional depth (20% intensity)
- Soft highlights (15% intensity)
- Minimal rim lighting
- No ambient occlusion
- Gentle clarity boost
- 8% contrast, 5% vibrance

**Preserves original character while adding polish!**

---

### Vintage Enhanced 📖
**Best for:** Golden/Silver Age comics, nostalgic restoration  
**Effect:** Warm, nostalgic glow with classic feel

- Centered light source (vignette-friendly)
- No bright highlights (maintains vintage look)
- Warm golden rim light
- Subtle ambient occlusion
- Gentle vignette for classic look
- Slightly reduced saturation for authentic feel

**Perfect for that "lovingly restored classic" look!**

---

## 🎭 How It Works

### 1. **Depth Lighting**
Simulates directional light source to add three-dimensional depth
- Creates natural light falloff
- Makes flat scans look more dimensional
- Customizable direction: top-left, top-right, top, center

### 2. **Dynamic Highlights**
Enhances bright areas to pop more
- Analyzes brightness levels
- Boosts highlights intelligently
- Threshold-based (only affects bright areas)

### 3. **Rim Lighting**
Adds subtle edge highlights (like backlighting)
- Edge detection finds outlines
- Warm golden glow added to edges
- Creates depth separation

### 4. **Ambient Occlusion**
Adds realistic shadows in recesses
- Samples surrounding pixels
- Darkens areas that should naturally be shadowed
- Subtle but effective depth enhancement

### 5. **Local Clarity**
Sharpens mid-tones without artifacts
- Enhances detail perception
- Adds "pop" to the image
- Like unsharp mask, but smarter

### 6. **Cinematic Vignette** (Optional)
Subtle edge darkening for focus
- Draws eye to center
- Classic comic book framing
- Only in "dramatic" and "vintage-enhanced" presets

---

## 🛠️ Usage

### Web UI
1. Upload your comic scan
2. Go to **Settings** section
3. Select **Lighting Style** dropdown
4. Choose your preset (or "None" to disable)
5. Click **Start Restoration**

The lighting effects will be applied automatically after color correction!

### CLI (Node.js API)
```javascript
import { restorePage } from './src/restore.js';

const buffer = await restorePage('input.jpg', {
  applyLighting: true,
  lightingPreset: 'modern-reprint'  // or 'dramatic', 'subtle', 'vintage-enhanced'
});
```

### Custom Lighting Settings
```javascript
import { applyPremiumLighting } from './src/lighting-effects.js';

const enhanced = await applyPremiumLighting(imageBuffer, {
  addDepth: true,
  depthStrength: 0.4,
  lightDirection: 'top-left',
  addHighlights: true,
  highlightIntensity: 0.3,
  addRimLight: true,
  rimLightColor: [255, 240, 200],  // RGB
  rimLightStrength: 0.25,
  addAO: true,
  aoStrength: 0.2,
  clarity: 0.3,
  contrastBoost: 1.15,
  vibrance: 1.1,
  effectOpacity: 0.7
});
```

---

## 📊 Before & After

### Without Lighting
- Flat appearance
- Uniform brightness
- Lacks depth
- Basic color correction only

### With Modern Reprint Lighting
- ✨ Three-dimensional depth
- 💎 Highlights pop naturally
- 🌟 Edges have subtle glow
- 🎨 Enhanced contrast and vibrancy
- 🖼️ Professional, premium look

---

## 💡 Tips & Best Practices

### ✅ DO:
- Use **Modern Reprint** for most projects (it's balanced)
- Use **Dramatic** for action covers and hero shots
- Use **Subtle** if your scan is already high-quality
- Use **Vintage Enhanced** for Golden/Silver Age books
- Experiment with presets to find your favorite look

### ❌ DON'T:
- Don't use dramatic lighting on already busy/dark pages
- Don't disable lighting unless you prefer ultra-flat look
- Don't combine with very high grain settings (can look noisy)

---

## 🔧 Technical Details

### Processing Order
1. **Upscaling** (Real-ESRGAN)
2. **Inpainting** (if mask provided)
3. **Color Correction** (cast removal, levels, saturation)
4. **✨ Premium Lighting** ← You are here!
5. **CMYK Conversion** (if enabled)
6. **Quality Assurance**
7. **PDF Export**

### Performance
- Processing time: +5-10 seconds per page
- Memory usage: ~200MB extra for lighting calculations
- Works on any resolution (optimized for comic book sizes)

### Compatibility
- Works with all upscaling factors (2x, 4x)
- Compatible with color correction settings
- Can be disabled completely (set to "None")

---

## 🎓 Examples

### Superhero Cover
```
Preset: Dramatic
Result: Bold, dynamic, eye-catching variant cover look
```

### Vintage Horror Comic
```
Preset: Vintage Enhanced
Result: Warm, nostalgic, classic EC Comics feel
```

### Modern Graphic Novel Page
```
Preset: Modern Reprint
Result: Clean, professional, Image Comics quality
```

### Black & White Manga
```
Preset: Subtle
Result: Enhanced depth without altering the style
```

---

## 🆘 Troubleshooting

### "Too Much Effect!"
- Switch to **Subtle** preset
- Or disable with "None" option

### "Not Enough Pop!"
- Try **Dramatic** preset
- Check your color correction settings (may be fighting each other)

### "Looks Artificial"
- Use **Modern Reprint** (it's most natural)
- Ensure color correction isn't too aggressive

### "Changing Colors?"
- Lighting affects brightness, not hue
- Check **Color Correction** settings instead
- Rim light is warm (golden) by design

---

## 📚 Related Documentation

- [COLOR_WORKFLOW.md](COLOR_WORKFLOW.md) - Color correction pipeline
- [QUICKSTART.md](QUICKSTART.md) - Getting started guide
- [PREMIUM_LIGHTING_COMPLETE.md](PREMIUM_LIGHTING_COMPLETE.md) - Full technical reference

---

## 🌟 Result

Your restored comics will have:
- ✨ **Professional depth and dimension**
- 💎 **Dynamic highlights that pop**
- 🌟 **Subtle rim lighting for separation**
- 🎨 **Enhanced contrast and vibrancy**
- 🖼️ **Modern reprint variant quality**

**Like a $50 premium variant cover edition!** 🎉
