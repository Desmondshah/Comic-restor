# Vercel Deployment Guide

This project is ready to deploy on Vercel with serverless functions.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A [Replicate API token](https://replicate.com/account/api-tokens)

## Quick Deploy

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Option 2: Deploy via Vercel Dashboard

1. Push this repository to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables (see below)
6. Click "Deploy"

## Environment Variables

Set these in your Vercel project settings:

| Variable | Value | Required |
|----------|-------|----------|
| `REPLICATE_API_TOKEN` | Your Replicate API token | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `PORT` | `3000` | Optional (auto-set by Vercel) |

### How to Add Environment Variables in Vercel:

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - **Key**: `REPLICATE_API_TOKEN`
   - **Value**: Your token (starts with `r8_`)
   - **Environment**: Production, Preview, Development (select all)
4. Click "Save"
5. Redeploy your project for changes to take effect

## Configuration Files

The following files have been added for Vercel deployment:

- `vercel.json` - Vercel configuration (routes, builds, functions)
- `.vercelignore` - Files to exclude from deployment
- `api/index.js` - Serverless function entry point

## Important Notes

### File Storage Limitations

Vercel serverless functions are **stateless** and have **read-only file systems** (except `/tmp`). This means:

- ❌ Uploaded files won't persist between requests
- ❌ Generated outputs won't be saved permanently
- ✅ You need external storage (like AWS S3, Cloudinary, or Vercel Blob)

### Recommended Solutions:

1. **For Production**: Use [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for file storage
2. **For Development**: Run locally with `npm run server`

### WebSocket Limitations

Vercel serverless functions don't support persistent WebSocket connections. For real-time updates, consider:

- Polling the `/api/jobs/:id` endpoint
- Using [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) (experimental)
- Self-hosting for full WebSocket support

## Local Development

Test your deployment locally:

```bash
# Install dependencies
npm install

# Install Vercel CLI
npm install -g vercel

# Run local dev server (simulates Vercel environment)
vercel dev
```

Or run the standard local server:

```bash
npm run server
```

## Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Vercel project created and linked
- [ ] `REPLICATE_API_TOKEN` environment variable set
- [ ] Initial deployment successful
- [ ] Test image upload and restoration
- [ ] Configure storage solution (if needed)

## Troubleshooting

### "Function exceeded timeout"
- Default timeout: 10s (Hobby), 60s (Pro)
- Comic restoration can take 2-5 minutes
- Solution: Upgrade to Pro plan or self-host

### "Module not found" errors
- Make sure all dependencies are in `package.json`
- Run `vercel dev` locally to debug

### "REPLICATE_API_TOKEN not set"
- Check environment variables in Vercel Dashboard
- Redeploy after adding variables

### Files not uploading
- Check file size limits (10MB for Hobby, 50MB for Pro)
- Implement external storage solution

## Alternative: Self-Hosting

If Vercel limitations are too restrictive, consider self-hosting:

- **DigitalOcean App Platform** - $5/month, supports WebSockets
- **Railway** - Pay-as-you-go, full Node.js support
- **Render** - Free tier available, WebSocket support
- **AWS EC2 + PM2** - Full control, more setup required

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Replicate API Docs](https://replicate.com/docs)
