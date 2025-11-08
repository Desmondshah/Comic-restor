# Testing Checklist - New Features

## 🧪 Comprehensive Test Plan

Use this checklist to verify all new features are working correctly.

---

## ✅ Pre-Testing Setup

- [ ] Server running on http://localhost:3000
- [ ] Browser console open (F12)
- [ ] Test images available in samples/ folder
- [ ] localStorage enabled in browser
- [ ] JavaScript enabled

---

## 💾 Preset Management Tests

### Default Presets

- [ ] **Load Page**
  - [ ] Preset dropdown appears above Settings
  - [ ] "Custom Settings" is selected by default
  - [ ] All 4 era presets listed:
    - [ ] 📚 Golden Age (1938-1956)
    - [ ] ✨ Silver Age (1956-1970)
    - [ ] 🥉 Bronze Age (1970-1985)
    - [ ] 🆕 Modern Age (1985+)

### Preset Selection

- [ ] **Select Golden Age Preset**
  - [ ] Scale changes to 4x
  - [ ] DPI changes to 600
  - [ ] Lighting changes to "Vintage Enhanced"
  - [ ] Matte compensation changes to 10
  - [ ] Face restore unchecked
  - [ ] Success notification appears
  - [ ] Notification auto-dismisses after 3s

- [ ] **Select Silver Age Preset**
  - [ ] Scale changes to 2x
  - [ ] DPI changes to 300
  - [ ] Lighting changes to "Modern Reprint"
  - [ ] Matte compensation changes to 7

- [ ] **Select Bronze Age Preset**
  - [ ] Settings update correctly
  - [ ] Face restore checked
  - [ ] Notification appears

- [ ] **Select Modern Age Preset**
  - [ ] Settings update correctly
  - [ ] OCR extraction checked
  - [ ] Notification appears

### Custom Preset Creation

- [ ] **Save New Preset**
  - [ ] Configure custom settings (e.g., Scale: 4, DPI: 600, Custom lighting)
  - [ ] Click 💾 Save button
  - [ ] Modal appears with dark overlay
  - [ ] Modal has three input fields
  - [ ] Enter preset name: "Test Preset"
  - [ ] Enter description: "Testing custom presets"
  - [ ] Select era: "Custom"
  - [ ] Click "Save Preset" button
  - [ ] Modal closes
  - [ ] Success notification appears
  - [ ] New preset appears in dropdown
  - [ ] Can select new preset
  - [ ] Settings apply correctly

- [ ] **Save Preset with Special Characters**
  - [ ] Name: "Marvel 1960's High-Quality!"
  - [ ] Saves successfully
  - [ ] Appears in dropdown
  - [ ] Can be selected

- [ ] **Empty Name Validation**
  - [ ] Try to save with empty name
  - [ ] Alert appears: "Please enter a preset name."
  - [ ] Modal stays open
  - [ ] Can enter name and try again

### Preset Persistence

- [ ] **Refresh Browser**
  - [ ] Custom presets still in dropdown
  - [ ] Can select and apply
  - [ ] Settings persist

- [ ] **Clear and Reload**
  - [ ] Clear browser cache
  - [ ] Reload page
  - [ ] Custom presets gone
  - [ ] Default presets still present

### Preset Deletion

- [ ] **Delete Custom Preset**
  - [ ] Select custom preset
  - [ ] Click 🗑️ Delete button
  - [ ] Confirmation dialog appears
  - [ ] Confirm deletion
  - [ ] Preset removed from dropdown
  - [ ] Success notification appears

- [ ] **Try to Delete Default Preset**
  - [ ] Select Golden Age preset
  - [ ] Click 🗑️ Delete button
  - [ ] Alert appears: "Cannot delete default presets."
  - [ ] Preset remains in list

- [ ] **Delete with No Selection**
  - [ ] Select "Custom Settings"
  - [ ] Click 🗑️ Delete button
  - [ ] Alert appears: "Please select a preset to delete."

### Preset Auto-Detection

- [ ] **Manual Settings Change**
  - [ ] Select any preset
  - [ ] Manually change Scale value
  - [ ] Dropdown reverts to "Custom Settings"
  - [ ] No notification appears

- [ ] **Multiple Changes**
  - [ ] Select preset
  - [ ] Change DPI
  - [ ] Change Lighting
  - [ ] Dropdown shows "Custom Settings"

---

## 🔄 Before/After Comparison Tests

### Opening Comparison

- [ ] **Complete a Restoration Job**
  - [ ] Upload image
  - [ ] Start restoration
  - [ ] Wait for completion
  - [ ] Job card shows "✅ COMPLETED"
  - [ ] 🔄 Compare button visible

- [ ] **Click Compare Button**
  - [ ] Comparison container appears
  - [ ] Split view shown by default
  - [ ] Before image loads
  - [ ] After image loads
  - [ ] No console errors

### Split View Mode

- [ ] **Slider Interaction**
  - [ ] Slider handle visible in center
  - [ ] Has ⇆ symbol
  - [ ] White vertical line visible
  - [ ] Dragging slider moves divider
  - [ ] Left side shows before image
  - [ ] Right side shows after image
  - [ ] Slider follows mouse smoothly

- [ ] **Range Input**
  - [ ] Range slider below image works
  - [ ] Moving range updates split position
  - [ ] Syncs with visual slider

- [ ] **Different Positions**
  - [ ] Drag to far left (0%)
  - [ ] Only after image visible
  - [ ] Drag to far right (100%)
  - [ ] Only before image visible
  - [ ] Drag to center (50%)
  - [ ] Equal split

### Side-by-Side Mode

- [ ] **Toggle to Side-by-Side**
  - [ ] Click "Side-by-Side" button
  - [ ] Button highlights (green)
  - [ ] Split view hides
  - [ ] Side-by-side view shows
  - [ ] Before image on left
  - [ ] After image on right
  - [ ] Both images visible

- [ ] **Zoom Controls**
  - [ ] 🔍+ button visible
  - [ ] 🔍− button visible
  - [ ] Reset button visible
  - [ ] Zoom level shows "100%"

- [ ] **Zoom In**
  - [ ] Click 🔍+ button
  - [ ] Images scale up
  - [ ] Zoom level shows "120%"
  - [ ] Click again
  - [ ] Zoom level shows "140%"
  - [ ] Both images zoom together

- [ ] **Zoom Out**
  - [ ] Click 🔍− button
  - [ ] Images scale down
  - [ ] Zoom level decreases
  - [ ] Can zoom to 50%
  - [ ] Cannot zoom below 50%

- [ ] **Reset Zoom**
  - [ ] Zoom to 200%
  - [ ] Click Reset button
  - [ ] Zoom returns to 100%
  - [ ] Images centered

- [ ] **Mouse Wheel Zoom**
  - [ ] Hover over left image
  - [ ] Scroll up to zoom in
  - [ ] Scroll down to zoom out
  - [ ] Both images zoom together
  - [ ] Hover over right image
  - [ ] Same behavior

- [ ] **Pan When Zoomed**
  - [ ] Zoom to 200%+
  - [ ] Cursor changes to "grab" hand
  - [ ] Click and drag on left image
  - [ ] Image pans smoothly
  - [ ] Right image pans with it
  - [ ] Release mouse
  - [ ] Cursor returns to "grab"

- [ ] **Pan Sync**
  - [ ] Zoom to 300%
  - [ ] Pan left image to top-left corner
  - [ ] Right image shows same corner
  - [ ] Pan to bottom-right
  - [ ] Both images sync

### Mode Switching

- [ ] **Toggle Between Modes**
  - [ ] In side-by-side, click "Split View"
  - [ ] Switches to split mode
  - [ ] Click "Side-by-Side"
  - [ ] Switches back
  - [ ] No errors
  - [ ] Images reload correctly

### Closing Comparison

- [ ] **Click ✕ Button**
  - [ ] Comparison container hides
  - [ ] Can scroll normally
  - [ ] No console errors

- [ ] **Reopen Comparison**
  - [ ] Click 🔄 Compare again
  - [ ] Opens successfully
  - [ ] Starts in split view (default)
  - [ ] Images load

---

## 🎨 Real-Time Preview Tests

**Note:** These tests require server implementation of `/api/preview-with-settings`

### Preview Trigger (Currently Not Functional)

- [ ] **Upload Image**
  - [ ] Image preview shows
  - [ ] Change Scale setting
  - [ ] Wait 1 second
  - [ ] Preview updates (if server ready)

- [ ] **Multiple Changes**
  - [ ] Change DPI
  - [ ] Change Lighting
  - [ ] Only one preview request after 1s

- [ ] **Preset Change**
  - [ ] Select different preset
  - [ ] Preview updates with preset settings

---

## 🌐 Browser Compatibility Tests

### Chrome/Edge
- [ ] All features work
- [ ] No console errors
- [ ] Smooth animations
- [ ] Proper styling

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Smooth animations
- [ ] Proper styling

### Safari (if available)
- [ ] All features work
- [ ] No console errors
- [ ] Smooth animations
- [ ] Proper styling

---

## 📱 Responsive Design Tests

### Desktop (1920x1080)
- [ ] Layout looks good
- [ ] All controls accessible
- [ ] Images scale properly
- [ ] No overflow

### Tablet (768x1024)
- [ ] Two-column layout becomes one
- [ ] Comparison viewer responsive
- [ ] Side-by-side becomes stacked
- [ ] Touch-friendly buttons

### Mobile (375x667)
- [ ] Single column layout
- [ ] Preset dropdown full width
- [ ] Comparison readable
- [ ] Buttons not too small
- [ ] Text readable

---

## 🔍 Edge Cases & Error Handling

### Preset Management

- [ ] **Very Long Preset Name**
  - [ ] Enter 100+ character name
  - [ ] Saves successfully
  - [ ] Displays in dropdown (may truncate)

- [ ] **Maximum Presets**
  - [ ] Create 20+ custom presets
  - [ ] All save successfully
  - [ ] Dropdown scrollable
  - [ ] No performance issues

- [ ] **Special Characters**
  - [ ] Name with emoji: "Test 🚀 Preset"
  - [ ] Name with quotes: Test "Quote" Preset
  - [ ] Saves and loads correctly

- [ ] **Concurrent Changes**
  - [ ] Select preset
  - [ ] Quickly change multiple settings
  - [ ] Reverts to "Custom Settings"
  - [ ] No errors

### Comparison Viewer

- [ ] **Large Images**
  - [ ] Use 10MB+ image
  - [ ] Comparison loads (may be slow)
  - [ ] Slider works
  - [ ] Zoom/pan work

- [ ] **Missing Images**
  - [ ] Delete restored file
  - [ ] Click compare
  - [ ] Shows error or broken image
  - [ ] No console crashes

- [ ] **Rapid Mode Switching**
  - [ ] Click split/side-by-side rapidly
  - [ ] Switches smoothly
  - [ ] No visual glitches

- [ ] **Extreme Zoom**
  - [ ] Zoom to 500%
  - [ ] Images very large
  - [ ] Can still pan
  - [ ] Can reset

---

## 🐛 Console Error Checks

Throughout all tests:
- [ ] No JavaScript errors in console
- [ ] No network errors (except missing preview endpoint)
- [ ] No warning messages
- [ ] No 404s for resources

---

## 📊 Performance Tests

- [ ] **Page Load**
  - [ ] Loads in <2 seconds
  - [ ] No lag on interaction

- [ ] **Preset Selection**
  - [ ] Instant response (<100ms)
  - [ ] Smooth setting updates

- [ ] **Comparison Loading**
  - [ ] Images load in <3 seconds
  - [ ] Slider responds instantly

- [ ] **Zoom/Pan**
  - [ ] Smooth 60fps animation
  - [ ] No stuttering

---

## ✅ Final Verification

- [ ] All critical features tested
- [ ] All bugs documented
- [ ] No breaking issues found
- [ ] Ready for production use

---

## 📝 Test Results

**Date Tested:** _______________  
**Browser:** _______________  
**Version:** _______________  

**Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Overall Status:** ⬜ PASS  ⬜ FAIL  ⬜ PARTIAL

**Notes:**
________________________________________________________________
________________________________________________________________
________________________________________________________________

---

## 🔄 Regression Testing

When making future changes, re-run:
- [ ] Preset Management Tests (30 items)
- [ ] Comparison Viewer Tests (40 items)
- [ ] Browser Compatibility (4 browsers)
- [ ] Responsive Design (3 breakpoints)

**Estimated Testing Time:** ~45-60 minutes for complete test

---

**Happy Testing! 🧪**
