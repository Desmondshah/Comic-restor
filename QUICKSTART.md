# Quick Start Guide

## 1. Install Dependencies

```powershell
npm install
```

## 2. Set Up Replicate API Token

1. Sign up at [replicate.com](https://replicate.com)
2. Get your API token from [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
3. Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
4. Edit `.env` and add your token:
   ```
   REPLICATE_API_TOKEN=r8_your_token_here
   ```

## 3. Prepare Your Comic Scans

Place your scanned comic pages in the `samples/` directory:
- Supported formats: JPG, PNG, TIF
- Recommended scan resolution: 300 DPI minimum

### Optional: Create Damage Masks

For pages with scratches or tears:
1. Create a PNG mask with the same name as your image (e.g., `page01_mask.png`)
2. Paint white over damaged areas
3. Black = keep original, White = inpaint/restore

## 4. Run Your First Restoration

### Single Page:

```powershell
npm start -- -i samples/page01.jpg -o output/page01_restored.pdf
```

### With Damage Mask:

```powershell
npm start -- -i samples/page01.jpg -m samples/page01_mask.png -o output/page01_restored.pdf
```

### Batch Process Directory:

```powershell
npm start -- -b -i samples/ -o output/
```

### Combine Multiple Pages into One PDF:

```powershell
npm start -- -b -i samples/ -o output/ --combine
```

## 5. Advanced Options

### High-Quality Settings:

```powershell
npm start -- -i input.jpg -o output.pdf --scale 4 --dpi 600 --matte-compensation 8
```

### Enable Face Restoration (use sparingly on comics):

```powershell
npm start -- -i input.jpg -o output.pdf --face-restore
```

### Extract Text from Speech Balloons:

```powershell
npm start -- -i input.jpg -o output.pdf --ocr
```

## 6. Configuration File

Create a `config.json` for persistent settings:

```powershell
npm start -- init
```

Then edit `config.json` with your preferred defaults.

## Common Settings

### Standard Comic Book (6.625" x 10.25"):
```powershell
npm start -- -i input.jpg --width 6.625 --height 10.25 --bleed 0.125 --dpi 300
```

### Magazine Size (8.5" x 11"):
```powershell
npm start -- -i input.jpg --width 8.5 --height 11 --bleed 0.125 --dpi 300
```

### High-Resolution Archival (600 DPI):
```powershell
npm start -- -i input.jpg --dpi 600 --scale 4
```

## Tips for Best Results

1. **Start with 2x upscaling** - Only use 4x if you need extreme detail
2. **Use matte compensation** - Default of 5 prevents darkening on matte paper
3. **Process sequentially** - Don't increase concurrency beyond 1-2 (API limits)
4. **Era-faithful restoration** - Only use inpainting on damaged areas
5. **Test first** - Run on 1-2 pages before batch processing

## Troubleshooting

### "REPLICATE_API_TOKEN not found"
Make sure `.env` file exists and contains your token

### "API rate limit"
Reduce concurrency or add delays between batches

### Images too dark on matte paper
Increase `--matte-compensation` to 7-10

### Lost detail after restoration
Try `--scale 4` for higher resolution

### Face restoration looks wrong
Don't use face restoration on stylized/cartoon art - only on realistic faces

## Project Structure

```
comic-restoration-pipeline/
├── src/
│   ├── cli.js              # Command-line interface
│   ├── restore.js          # AI restoration functions
│   ├── pdf-export.js       # PDF generation
│   ├── qa-checks.js        # Quality assurance
│   ├── batch-processor.js  # Batch processing
│   └── config.js           # Configuration
├── samples/                # Your input scans
├── output/                 # Restored PDFs
├── config.json            # Your settings
└── .env                   # API token (keep secret!)
```

## Next Steps

- Read `README.md` for full documentation
- Check `config.example.json` for all available options
- Visit [replicate.com/explore](https://replicate.com/explore) to see model details
