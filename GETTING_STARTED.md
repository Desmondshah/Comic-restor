# 🚀 Getting Started - First Time Setup

Follow these steps to get your comic restoration pipeline up and running!

## ✅ Step 1: Verify Installation

Run the setup checker:
```powershell
npm run check
```

You should see all green checkmarks except for the API token (which we'll add next).

## ✅ Step 2: Get Replicate API Token

1. **Sign up at Replicate** (if you haven't already):
   - Go to: https://replicate.com
   - Click "Sign up" in the top right
   - Sign up with GitHub, Google, or email

2. **Get your API token**:
   - Go to: https://replicate.com/account/api-tokens
   - Click "Create token" or copy your existing token
   - It will look like: `r8_abc123...` (starts with `r8_`)

3. **Add token to `.env` file**:
   - Open the `.env` file in this directory
   - Replace the line:
     ```
     REPLICATE_API_TOKEN=
     ```
   - With your actual token:
     ```
     REPLICATE_API_TOKEN=r8_your_actual_token_here
     ```
   - Save the file

4. **Verify setup**:
   ```powershell
   npm run check
   ```
   - You should now see: ✓ REPLICATE_API_TOKEN

## ✅ Step 3: Prepare Your First Comic Scan

1. **Scan a comic page** (or use an existing scan):
   - Format: JPG, PNG, or TIFF
   - Resolution: 300 DPI minimum
   - Size: Any size (will be resized for print)

2. **Place in samples directory**:
   ```powershell
   Copy your scan to: samples\page01.jpg
   ```

3. **Optional: Create a damage mask** (if page has tears/stains):
   - Open the scan in an image editor (Paint, GIMP, Photoshop)
   - Create a new black image
   - Paint WHITE over damaged areas only
   - Save as: `samples\page01_mask.png`

## ✅ Step 4: Run Your First Restoration

Simple restoration:
```powershell
npm start -- -i samples\page01.jpg -o output\page01_restored.pdf
```

With damage mask:
```powershell
npm start -- -i samples\page01.jpg -m samples\page01_mask.png -o output\page01_restored.pdf
```

**What happens:**
1. 🔄 Uploads image to Replicate
2. 🤖 AI upscales 2x and removes artifacts
3. 🎨 Optional: Inpaints damaged areas
4. ✅ Quality checks
5. 📄 Creates print-ready PDF with bleed
6. 💾 Saves to output directory

**Time:** 2-5 minutes per page (depending on Replicate queue)

## ✅ Step 5: Review the Output

1. **Open the PDF**:
   ```powershell
   output\page01_restored.pdf
   ```

2. **Check quality**:
   - Is the image sharper and cleaner?
   - Are scratches/tears removed (if mask used)?
   - Does it look print-ready?
   - Are colors faithful to original?

3. **Adjust if needed**:
   
   **Too dark?**
   ```powershell
   npm start -- -i samples\page01.jpg --matte-compensation 8
   ```
   
   **Not sharp enough?**
   ```powershell
   npm start -- -i samples\page01.jpg --scale 4 --dpi 600
   ```
   
   **Face looks weird?**
   - Don't use `--face-restore` on cartoon/stylized art
   - Only use for realistic comic book faces

## ✅ Step 6: Process Multiple Pages

Once you're happy with the settings:

1. **Add all pages to samples:**
   ```
   samples\
   ├── page01.jpg
   ├── page02.jpg
   ├── page03.jpg
   └── page04.jpg
   ```

2. **Batch process:**
   ```powershell
   npm start -- -b -i samples\ -o output\
   ```

3. **Create combined PDF:**
   ```powershell
   npm start -- -b -i samples\ -o output\ --combine
   ```

This will:
- Process all images in `samples\`
- Create individual PDFs for each page
- Optionally combine into `output\combined_restored.pdf`

## 🎯 Quick Reference

### Essential Commands

```powershell
# Check setup
npm run check

# Single page
npm start -- -i input.jpg -o output.pdf

# With mask
npm start -- -i input.jpg -m mask.png -o output.pdf

# Batch process
npm start -- -b -i samples\ -o output\

# High quality
npm start -- -i input.jpg --scale 4 --dpi 600

# Show all options
npm start -- --help
```

### Common Settings

| Setting | Default | When to Change |
|---------|---------|----------------|
| `--scale 2` | 2x | Use 4 for extreme detail |
| `--dpi 300` | 300 | Use 600 for high-end printing |
| `--matte-compensation 5` | 5 | Increase to 7-10 if prints are dark |
| `--bleed 0.125` | 1/8" | Use 0.1875 for offset printing |

## 🔧 Troubleshooting First Run

### Error: "REPLICATE_API_TOKEN not found"
**Solution**: 
- Make sure `.env` file exists
- Check that token is added correctly
- No spaces or quotes needed

### Error: "Input file not found"
**Solution**:
- Check file path is correct
- Use backslashes in Windows: `samples\page01.jpg`
- Make sure file exists in samples directory

### Warning: "Token looks invalid"
**Solution**:
- Token should start with `r8_`
- Copy/paste carefully (no extra spaces)
- Generate new token if needed

### Process is very slow
**Expected behavior**:
- First run may take 3-5 minutes
- Replicate has a queue system
- Subsequent pages may be faster

### Output is too dark
**Solution**:
```powershell
npm start -- -i input.jpg --matte-compensation 8
```

### AI added weird elements
**Solution**:
- Be more conservative with masks
- Only mask actual damage, not artistic elements
- Don't use `--face-restore` on cartoons

## 📚 Next Steps

Once your first restoration works:

1. ✅ **Read WORKFLOW.md** - Professional restoration workflow
2. ✅ **Create config.json** - Save your preferred settings
3. ✅ **Process a full issue** - Use batch mode
4. ✅ **Submit to printer** - See print preparation guide

## 💡 Tips for Success

1. **Start small** - Process 1-2 pages first
2. **Test settings** - Different comics need different settings
3. **Save originals** - Never overwrite your scans
4. **Check costs** - Monitor Replicate usage
5. **Be patient** - Quality restoration takes time

## 🎓 Learning Resources

- **README.md** - Full documentation
- **WORKFLOW.md** - Professional workflow guide
- **examples.js** - Code examples
- **config.example.json** - All configuration options

## ✨ You're Ready!

Run your first restoration:
```powershell
npm start -- -i samples\page01.jpg -o output\page01_restored.pdf
```

Check the output in `output\page01_restored.pdf`

---

**Questions or issues?**
- Check WORKFLOW.md for detailed guides
- Review troubleshooting section above
- Verify setup with `npm run check`

**Happy restoring! 📘✨**
