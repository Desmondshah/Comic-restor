# Vercel Configuration Explained

## vercel.json Settings

```json
{
  "version": 2,                    // Vercel platform version
  "buildCommand": "npm install",   // Command to build the project
  "installCommand": "npm install", // Command to install dependencies
  "outputDirectory": "public",     // Directory containing static files
  ...
}
```

## Configuration Breakdown

### Build & Install
- **buildCommand**: `npm install` - Installs all dependencies
- **installCommand**: `npm install` - Ensures packages are installed
- **outputDirectory**: `public` - Serves static files from `/public` directory

### Builds
Two build targets:

1. **Serverless Function** (`src/server.js`)
   - Uses `@vercel/node` builder
   - Handles API requests and dynamic content
   - Runs as serverless function

2. **Static Files** (`public/**`)
   - Uses `@vercel/static` builder
   - Serves HTML, CSS, JS, images directly
   - No function execution overhead

### Routes (Priority Order)

1. **API Routes** (`/api/*`)
   - All requests to `/api/*` → `src/server.js`
   - Example: `/api/upload`, `/api/restore`

2. **Static Assets** (`.js`, `.css`, `.html`, `.png`, etc.)
   - Direct file serving from `public/` directory
   - Faster than serverless for static content
   - Example: `/app.js` → `public/app.js`

3. **Fallback** (everything else)
   - Remaining requests → `src/server.js`
   - Handles index page, downloads, etc.

### Functions Configuration

```json
"functions": {
  "src/server.js": {
    "maxDuration": 300,  // 5 minutes (Pro plan required)
    "memory": 3008       // ~3GB RAM for image processing
  }
}
```

- **maxDuration**: 300 seconds (5 min) for long AI processing
  - Default: 10s (Hobby), 60s (Pro without config)
  - Requires Vercel Pro plan for >60s
- **memory**: 3008 MB for Sharp image processing and large files
  - Default: 1024 MB
  - Higher memory = faster processing

### Environment Variables

```json
"env": {
  "NODE_ENV": "production"
}
```

Set in Vercel Dashboard:
- `REPLICATE_API_TOKEN` - Your Replicate API key
- `NODE_ENV` - Automatically set to production

## package.json Scripts

```json
"scripts": {
  "build": "echo 'No build step required'",
  "vercel-build": "echo 'Build complete'",
  "start": "node src/server.js"  // Not used by Vercel (serverless)
}
```

- **vercel-build**: Run during deployment (currently just confirmation)
- **build**: Alternative build script
- **start**: Only used for local development

## How Vercel Serves Your App

1. User visits your site
2. Vercel routes request based on path:
   - Static files → Served from CDN (public/)
   - API calls → Invokes serverless function
   - Other requests → Invokes serverless function
3. Serverless function processes request
4. Response sent to user
5. Function terminates (stateless)

## Key Differences from Local Development

| Feature | Local (`npm run server`) | Vercel (Serverless) |
|---------|-------------------------|---------------------|
| Server | Always running | Starts per request |
| Storage | Persistent files | Ephemeral (/tmp only) |
| WebSocket | ✅ Supported | ❌ Not supported |
| Timeout | No limit | 300s max (Pro) |
| Memory | System RAM | 3008 MB max |
| State | Shared across requests | Isolated per request |

## Optimization Tips

1. **Cache Static Files**: Vercel automatically caches files from `public/`
2. **Reduce Function Size**: Keep serverless functions focused
3. **Use Edge Functions**: For low-latency simple operations
4. **External Storage**: Use Vercel Blob/S3 for file persistence
5. **Monitor Usage**: Check function execution time in dashboard

## Testing Configuration

Test locally with Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Run local dev server (simulates Vercel)
vercel dev

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Common Issues

### Build Fails
- Check `buildCommand` runs successfully locally
- Verify all dependencies in `package.json`
- Check Node version matches `engines` field

### Static Files Not Found
- Ensure files are in `public/` directory
- Check `outputDirectory` matches your structure
- Verify route patterns include file extensions

### Function Timeout
- Upgrade to Pro plan for 300s limit
- Optimize processing (reduce AI calls, smaller images)
- Consider background jobs for long operations

### Memory Issues
- Increase `memory` in functions config
- Process images in smaller batches
- Use streaming where possible

## Resources

- [Vercel Configuration](https://vercel.com/docs/configuration)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Build Step](https://vercel.com/docs/build-step)
- [Environment Variables](https://vercel.com/docs/environment-variables)
