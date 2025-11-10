# AI Damage Restoration - Quick Reference

## 🚀 Quick Commands

### Single Image
```bash
# Basic restoration
comic-restore ai-restore -i input.jpg

# With custom strength
comic-restore ai-restore -i input.jpg --strength 0.8

# With comparison
comic-restore ai-restore -i input.jpg --comparison
```

### Batch Processing
```bash
# Restore entire directory
comic-restore ai-restore -i scans/ --batch

# Custom output location
comic-restore ai-restore -i scans/ -o restored/ --batch
```

## 🎛️ Options Reference

| Option | Default | Description |
|--------|---------|-------------|
| `--strength <0-1>` | 0.8 | AI transformation intensity |
| `--preserve-logo` | ✅ | Keep logos/titles intact |
| `--preserve-signature` | ✅ | Keep signatures intact |
| `--modern-style` | ✅ | Apply modern remaster look |
| `--comparison` | ❌ | Generate before/after |
| `--custom-instructions <text>` | - | Additional AI guidance |
| `--guidance-scale <1-20>` | 7.5 | Prompt adherence strength |

## 🎨 Preset Configurations

### Heavy Restoration (Golden Age)
```bash
comic-restore ai-restore -i input.jpg --strength 0.9 --modern-style
```

### Balanced Restoration (Silver/Bronze Age)
```bash
comic-restore ai-restore -i input.jpg --strength 0.8
```

### Light Touch (Modern Comics)
```bash
comic-restore ai-restore -i input.jpg --strength 0.5 --no-modern-style
```

### Archival Quality
```bash
comic-restore ai-restore -i input.jpg --strength 0.7 --preserve-logo --preserve-signature --comparison
```

## 📊 Web UI Checklist

1. ☐ Upload comic scan
2. ☐ Enable "AI Damage Restoration" checkbox
3. ☐ Configure options:
   - ☑️ Preserve logos & titles
   - ☑️ Preserve artist signatures
   - ☑️ Apply modern remaster style
   - Adjust strength slider (0-100%)
4. ☐ Click "Start Restoration"
5. ☐ Wait 30-90 seconds
6. ☐ Download result

## 💡 Best Practices

✅ **DO:**
- Test on one page first
- Use strength 0.7-0.8 for most cases
- Enable comparison mode
- Keep preservation options enabled

❌ **DON'T:**
- Use max strength on lightly damaged scans
- Skip testing before batch processing
- Disable preservation without reason

## 🔧 Common Issues

### Issue: Results too aggressive
**Fix:** Lower `--strength` to 0.6-0.7

### Issue: Logos/text changed
**Fix:** Ensure `--preserve-logo` is enabled

### Issue: Insufficient credits
**Fix:** Purchase credits, wait 2-5 min

### Issue: Slow processing
**Fix:** Normal for high-res images (30-120s)

## 🌟 Pro Tips

1. **Combine with upscaling:**
   ```bash
   comic-restore restore -i input.jpg --enable-ai-restore --scale 4
   ```

2. **Batch with custom settings:**
   ```bash
   comic-restore ai-restore -i scans/ --batch --strength 0.8 --comparison
   ```

3. **Add custom instructions:**
   ```bash
   comic-restore ai-restore -i input.jpg \
     --custom-instructions "Preserve halftone patterns"
   ```

## 📈 Performance Guide

| Resolution | Time | Cost |
|-----------|------|------|
| 1000x1500 | 30s  | $0.01 |
| 2000x3000 | 60s  | $0.02 |
| 4000x6000 | 120s | $0.05 |

## 🔗 Resources

- [Full Guide](./AI_DAMAGE_RESTORATION_GUIDE.md)
- [Quick Start](./QUICKSTART.md)
- [API Docs](./README.md)
