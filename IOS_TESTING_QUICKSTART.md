# Quick iOS Testing Guide

## Before You Start
1. Make sure the web server is running: `npm run web`
2. Access the app from your iOS device using the local network IP
3. For production testing, deploy to Vercel/Render

## Quick Test Steps

### 1. Basic Loading (30 seconds)
- [ ] Page loads without errors
- [ ] No console errors in Safari
- [ ] Images and fonts load properly
- [ ] UI is responsive to screen size

### 2. Touch & Gestures (1 minute)
- [ ] Tap upload zone - file picker opens
- [ ] Scroll page - smooth, no lag
- [ ] Tap buttons - instant feedback
- [ ] No accidental zooming

### 3. Image Upload (2 minutes)
- [ ] Select single image - uploads successfully
- [ ] Select multiple images - all upload
- [ ] Large image (>5MB) - gets compressed
- [ ] Preview displays correctly

### 4. Form Interactions (1 minute)
- [ ] Tap input fields - no zoom
- [ ] Change select dropdowns - works smoothly
- [ ] Adjust sliders - responds to touch
- [ ] Toggle checkboxes - immediate response

### 5. Mask Editor (2 minutes)
- [ ] Open mask editor
- [ ] Draw with finger - smooth lines
- [ ] Switch to eraser - works
- [ ] Adjust brush size - visible changes
- [ ] Save mask - returns to main view

### 6. Performance (ongoing)
- [ ] No lag when scrolling
- [ ] Animations are smooth (if on desktop view)
- [ ] Page doesn't freeze
- [ ] Memory doesn't spike

## Common Issues & Fixes

### Issue: Page zooms when tapping input
**Fix**: Already implemented - inputs use 16px font size

### Issue: Touch events not responsive
**Fix**: Already implemented - passive listeners and throttling

### Issue: Upload fails
**Check**: 
- Network connection
- File size (compress working?)
- Server logs

### Issue: Mask drawing is laggy
**Fix**: Already implemented - throttled to 60fps
**Note**: May still lag on iPhone 8 and older

### Issue: Backdrop blur missing
**Expected**: Removed on mobile for performance - this is intentional

## Quick Performance Check

### Using Safari Web Inspector (iOS 13+)
1. On Mac: Safari > Develop > [Your iPhone] > [Your Page]
2. Check Console for errors
3. Monitor Network tab for slow requests
4. Use Timeline to check rendering performance

### Expected Performance
- **Page Load**: < 3 seconds on 4G
- **Touch Response**: < 100ms
- **Upload Start**: Immediate
- **Scroll FPS**: 60fps
- **Memory**: < 200MB

## Device-Specific Notes

### iPhone SE (Small Screen)
- UI should be compact but usable
- All touch targets must be accessible
- Text should be readable without zoom

### iPhone 14 Pro Max (Large Screen)
- May show more desktop-like features
- Better performance overall
- Utilize extra screen space

### Older Devices (iPhone 8, X)
- May be slower with large images
- Compression helps significantly
- Consider reducing quality settings

## Production Testing
1. Test on actual iOS devices (not just simulators)
2. Test on different iOS versions (14, 15, 16, 17)
3. Test on different network speeds (WiFi, 4G, 3G)
4. Monitor real user reports

## Success Criteria
✅ No unexpected zooming
✅ Smooth scrolling
✅ Fast uploads with compression
✅ Responsive touch events
✅ No crashes or freezes
✅ Good battery usage
