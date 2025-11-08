# Visual UI Guide - New Features

## 🎨 User Interface Overview

This guide shows the visual layout and location of all new features.

---

## 📍 Main Interface Layout

```
┌─────────────────────────────────────────────────────┐
│  📘 Comic Restoration Pipeline                      │
│  AI-powered comic scan restoration                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────┬───────────────────────────┐
│  🎨 Upload & Restore    │  📋 Restoration Jobs      │
│                         │                           │
│  ┌──────────────────┐  │  ┌──────────────────────┐ │
│  │ Upload Zone      │  │  │ Job #1               │ │
│  │ (Drag & Drop)    │  │  │ [🔄 Compare]         │ │ ← NEW!
│  └──────────────────┘  │  │ [📥 Download] [🗑️]  │ │
│                         │  └──────────────────────┘ │
│  ┌──────────────────┐  │                           │
│  │ Preview Image    │  │  ┌──────────────────────┐ │
│  └──────────────────┘  │  │ Job #2               │ │
│                         │  └──────────────────────┘ │
│  ┌──────────────────┐  │                           │
│  │ 🔄 Comparison    │  │                           │
│  │ Viewer           │ ← NEW!                       │
│  └──────────────────┘  │                           │
│                         │                           │
│  💾 Presets         ← NEW!                          │
│  [Dropdown ▼] [💾] [🗑️]                          │
│                         │                           │
│  ⚙️ Settings            │                           │
│  [Scale] [DPI]          │                           │
│  [Lighting] [Matte]     │                           │
│                         │                           │
│  [🚀 Start Restoration] │                           │
└─────────────────────────┴───────────────────────────┘
```

---

## 💾 Preset Management Section

### Location
**Above** the Settings section, **below** the Preview/Comparison

### Visual Layout
```
┌────────────────────────────────────────────────────┐
│  💾 Presets                                        │
│  ┌──────────────────────────┬───────┬──────┐      │
│  │ 📚 Golden Age (1938-1956)▼│ 💾   │ 🗑️  │      │
│  │  ✨ Silver Age (1956-1970) │ Save │Delete│      │
│  │  🥉 Bronze Age (1970-1985) │      │      │      │
│  │  🆕 Modern Age (1985+)     │      │      │      │
│  │  Custom Settings           │      │      │      │
│  │  My Custom Preset 1        │      │      │      │
│  └──────────────────────────┴───────┴──────┘      │
└────────────────────────────────────────────────────┘
```

### Interaction
1. **Dropdown:** Click to see all presets
2. **💾 Save:** Opens modal to save current settings
3. **🗑️ Delete:** Removes selected custom preset

---

## 🔄 Before/After Comparison Viewer

### Location
**Below** the Preview Image, **above** Preset Management

### Visual Layout - Split View (Default)
```
┌────────────────────────────────────────────────────┐
│  🔄 Before/After Comparison                        │
│  [Split View] [Side-by-Side] [✕]                  │
│  ┌──────────────────────────────────────────────┐ │
│  │                    │                          │ │
│  │                    │                          │ │
│  │    BEFORE          ⇆        AFTER            │ │
│  │   (Original)       │      (Restored)         │ │
│  │                    │                          │ │
│  │                    │                          │ │
│  └──────────────────────────────────────────────┘ │
│  ────●─────────────────────────────────────────── │
│       ↑ Drag slider to compare                    │
└────────────────────────────────────────────────────┘
```

### Visual Layout - Side-by-Side Mode
```
┌────────────────────────────────────────────────────┐
│  🔄 Before/After Comparison                        │
│  [Split View] [Side-by-Side] [✕]                  │
│  ┌────────────────────┬─────────────────────────┐ │
│  │ Before             │ After                   │ │
│  │ [🔍+][🔍−][Reset] │ [100%]                  │ │
│  │ ┌────────────────┐ │ ┌─────────────────────┐ │ │
│  │ │                │ │ │                     │ │ │
│  │ │   Original     │ │ │     Restored        │ │ │
│  │ │   Image        │ │ │     Image           │ │ │
│  │ │                │ │ │                     │ │ │
│  │ └────────────────┘ │ └─────────────────────┘ │ │
│  │  (pan enabled)     │  (pan enabled)          │ │
│  └────────────────────┴─────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

### Controls
- **[Split View]**: Interactive slider mode (button highlighted)
- **[Side-by-Side]**: Dual panel mode (button highlighted when active)
- **[✕]**: Close comparison viewer
- **🔍+ / 🔍−**: Zoom controls (side-by-side only)
- **Reset**: Return to 100% zoom
- **Drag**: Pan around when zoomed in

---

## 💾 Save Preset Modal

### Appears When
Click the **💾 Save** button in Preset section

### Visual Layout
```
┌─────────────────────────────────────────────────────┐
│ 🌑 Background Overlay (dimmed)                      │
│    ┌────────────────────────────────────────────┐   │
│    │  💾 Save Preset                        × │   │
│    │                                            │   │
│    │  Preset Name                               │   │
│    │  ┌──────────────────────────────────────┐ │   │
│    │  │ My Golden Age Settings               │ │   │
│    │  └──────────────────────────────────────┘ │   │
│    │                                            │   │
│    │  Description (Optional)                    │   │
│    │  ┌──────────────────────────────────────┐ │   │
│    │  │ High contrast for 1940s comics       │ │   │
│    │  └──────────────────────────────────────┘ │   │
│    │                                            │   │
│    │  Era Type                                  │   │
│    │  ┌──────────────────────────────────────┐ │   │
│    │  │ Golden Age (1938-1956)            ▼  │ │   │
│    │  └──────────────────────────────────────┘ │   │
│    │                                            │   │
│    │              [Cancel]  [Save Preset]       │   │
│    └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Interaction
1. **Preset Name:** Required field
2. **Description:** Optional helper text
3. **Era Type:** Optional categorization
4. **Cancel:** Close without saving
5. **Save Preset:** Create new preset

---

## 📋 Updated Job Card

### Old Layout
```
┌──────────────────────────────────────┐
│ Job #123: comic-page-01.jpg          │
│ Status: ✅ COMPLETED                 │
│                                      │
│ [2x upscale] [300 DPI]               │
│              [📥 Download] [🗑️]      │
└──────────────────────────────────────┘
```

### New Layout
```
┌──────────────────────────────────────┐
│ Job #123: comic-page-01.jpg          │
│ Status: ✅ COMPLETED                 │
│                                      │
│ [2x upscale] [300 DPI]               │
│      [🔄 Compare] [📥 Download] [🗑️] │ ← NEW!
└──────────────────────────────────────┘
```

### Button Functions
- **🔄 Compare:** Opens comparison viewer with before/after images
- **📥 Download:** Downloads restored image (unchanged)
- **🗑️:** Delete job (unchanged)

---

## 🎯 Interactive Elements

### Preset Dropdown States
```
Default:     [Custom Settings                    ▼]
Hovering:    [Custom Settings                    ▼] (highlighted)
Opened:      [📚 Golden Age (1938-1956)          ]
             [✨ Silver Age (1956-1970)          ]
             [🥉 Bronze Age (1970-1985)          ]
             [🆕 Modern Age (1985+)              ]
             [Custom Settings                    ]
Selected:    [📚 Golden Age (1938-1956)          ▼]
```

### Comparison Slider States
```
Default Position (50%):
[Before ────────●──────────── After]
             ↑
          Drag here

Left Position (25%):
[Before ─────●─────────────── After]
          ↑
      More After visible

Right Position (75%):
[Before ───────────────●────── After]
                    ↑
                More Before visible
```

### Zoom States (Side-by-Side)
```
100% (Default):  [🔍+] [🔍−] [Reset]  100%
200% (Zoomed):   [🔍+] [🔍−] [Reset]  200%  ← Can pan
50% (Zoomed out): [🔍+] [🔍−] [Reset]   50%
```

---

## 📱 Responsive Layouts

### Desktop (1024px+)
```
┌─────────────────┬─────────────────┐
│   Upload/       │   Jobs List     │
│   Settings      │                 │
│   (Left Panel)  │  (Right Panel)  │
└─────────────────┴─────────────────┘
```

### Tablet/Mobile (<1024px)
```
┌─────────────────────────────────────┐
│   Upload/Settings                   │
│   (Full Width)                      │
├─────────────────────────────────────┤
│   Jobs List                         │
│   (Full Width)                      │
└─────────────────────────────────────┘
```

### Comparison on Mobile
```
Side-by-Side becomes stacked:
┌─────────────────┐
│   Before        │
│   [Controls]    │
│   [Image]       │
├─────────────────┤
│   After         │
│   [100%]        │
│   [Image]       │
└─────────────────┘
```

---

## 🎨 Color Coding

### Status Indicators
- **🟢 Green:** Completed, Success, Available
- **🟡 Yellow:** Processing, Warning
- **🔴 Red:** Error, Delete, Danger
- **🔵 Blue:** Primary actions, Selected

### Preset Icons
- **📚** Golden Age (Brown book = old)
- **✨** Silver Age (Sparkles = classic)
- **🥉** Bronze Age (Bronze medal = transition)
- **🆕** Modern Age (New symbol = recent)

### Button States
```
Normal:   [Button]          (Dark background)
Hover:    [Button]          (Lighter, slightly raised)
Active:   [Button]          (Pressed appearance)
Disabled: [Button]          (Grayed out)
Success:  [Button]          (Green background)
```

---

## 🔔 Notification Positions

### Success Notification
```
┌────────────────────────────────────────────┐
│ Header                                     │
├────────────────────────────────────────────┤
│ ✅ Preset saved successfully!              │ ← Appears here
├────────────────────────────────────────────┤
│ Main Content                               │
```

### Error Notification
```
┌────────────────────────────────────────────┐
│ Header                                     │
├────────────────────────────────────────────┤
│ ⚠️ Please select a preset to delete.       │ ← Appears here
├────────────────────────────────────────────┤
│ Main Content                               │
```

---

## 📏 Spacing & Alignment

### Preset Section
```
Margin Top: 30px
Margin Bottom: 20px

Grid Layout:
[───────────────] [──] [──]
    Dropdown      Save Del
   (Flex: 1)     (Auto)(Auto)
Gap: 10px
```

### Comparison Viewer
```
Margin: 20px 0
Padding: 20px
Border: 1px solid
Border Radius: 8px

Inner spacing:
Title + Controls: margin-bottom: 15px
Mode buttons gap: 10px
```

---

## 🎬 Animation States

### Preset Change
```
1. Click preset → Dropdown closes
2. Settings fade/transition to new values (0.2s)
3. Notification appears from top (slide down)
4. Notification auto-hides after 3s (fade out)
```

### Comparison Slider
```
1. Drag slider → After image width updates (instant)
2. Release → Slider handle snaps to position
3. Smooth transition on all movements
```

### Zoom Animation
```
1. Click zoom button
2. Image scales smoothly (0.1s transition)
3. Zoom level updates (instant)
```

---

## 🖱️ Cursor States

| Element | Default | Hover | Active |
|---------|---------|-------|--------|
| **Dropdown** | `default` | `pointer` | `pointer` |
| **Button** | `pointer` | `pointer` | `pointer` |
| **Slider** | `pointer` | `ew-resize` | `ew-resize` |
| **Image (zoom off)** | `default` | `default` | `default` |
| **Image (zoom on)** | `grab` | `grab` | `grabbing` |

---

## 📐 Dimensions

### Comparison Viewer
- **Max Width:** 100% of container
- **Max Height:** 600px
- **Aspect Ratio:** Maintains image ratio

### Preset Modal
- **Max Width:** 500px
- **Width:** 90% (mobile)
- **Padding:** 30px

### Buttons
- **Height:** 40px (normal), 32px (small)
- **Padding:** 12px 24px (normal), 6px 12px (small)
- **Border Radius:** 6px

---

## 🎨 Visual Hierarchy

### Z-Index Layers
```
Layer 5: Modal Overlay (1000)
Layer 4: Modal Content (1001)
Layer 3: Notifications (100)
Layer 2: Comparison Slider (10)
Layer 1: Comparison Images (5)
Layer 0: Base Content (0)
```

---

## 💡 Visual Tips

### Finding Features Quickly

1. **Presets:** Look for 💾 icon above Settings
2. **Comparison:** Look for 🔄 icon in job cards
3. **Modal:** Appears centered over dimmed background
4. **Notifications:** Top of page below header

### Visual Feedback

- **Selected Preset:** Dropdown shows preset name
- **Active Mode:** Button has green background
- **Zoomed:** Percentage shows zoom level
- **Panning:** Cursor changes to grabbing hand

---

**This visual guide helps locate and understand all new UI elements at a glance!**

*Last Updated: 2025-11-07*
