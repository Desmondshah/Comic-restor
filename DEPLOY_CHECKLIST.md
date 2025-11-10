# Pre-Deployment Checklist

Before deploying to Vercel, make sure you have:

## ✅ Required

- [ ] Replicate API token (get from https://replicate.com/account/api-tokens)
- [ ] GitHub repository created and code pushed
- [ ] Vercel account created (https://vercel.com/signup)
- [ ] All dependencies listed in `package.json`

## ✅ Configuration Files Present

- [ ] `vercel.json` - Vercel configuration
- [ ] `.vercelignore` - Files to exclude from deployment
- [ ] `api/index.js` - Serverless function entry point
- [ ] `.gitignore` - Git ignore rules (including `.vercel`)
- [ ] `package.json` - Updated with build scripts

## 🚀 Deployment Steps

### 1. Via Vercel Dashboard (Easiest)

```bash
# 1. Push to GitHub
git add .
git commit -m "Prepare for Vercel deployment"
git push

# 2. Go to https://vercel.com/new
# 3. Import your repository
# 4. Add environment variable: REPLICATE_API_TOKEN
# 5. Deploy!
```

### 2. Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts to set up project
# Add REPLICATE_API_TOKEN when asked
```

## ⚙️ Environment Variables to Set in Vercel

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `REPLICATE_API_TOKEN` | `r8_xxxxx...` | https://replicate.com/account/api-tokens |

## ⚠️ Known Limitations on Vercel

- **File Storage**: Uploads/outputs are temporary (use Vercel Blob for persistence)
- **WebSockets**: Not supported in serverless (polling fallback needed)
- **Timeouts**: 10s (Hobby) / 60s (Pro) - AI processing may take longer
- **File Size**: 10MB (Hobby) / 50MB (Pro) upload limit

## 🔍 Testing After Deployment

- [ ] Visit your deployed URL
- [ ] Upload a test image
- [ ] Start a restoration job
- [ ] Check job status endpoint
- [ ] Verify PDF download works

## 📝 Post-Deployment Notes

- Add custom domain in Vercel settings (optional)
- Monitor function logs in Vercel Dashboard
- Set up Vercel Blob if you need persistent file storage
- Consider upgrading to Pro if you hit timeout limits

## 🆘 Troubleshooting

If deployment fails:

1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Run `vercel dev` locally to test
4. Check that all imports use correct paths
5. Ensure Sharp (native module) is properly configured

See **VERCEL_DEPLOYMENT.md** for detailed troubleshooting steps.
