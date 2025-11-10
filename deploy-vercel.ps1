# Quick Vercel Deployment Script

Write-Host "🚀 Comic Restoration - Vercel Deployment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
} else {
    Write-Host "✓ Vercel CLI found" -ForegroundColor Green
}

# Check if @vercel/blob is installed
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Cyan
$packageJson = Get-Content package.json -Raw | ConvertFrom-Json

if ($packageJson.dependencies.'@vercel/blob') {
    Write-Host "✓ @vercel/blob is installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Installing @vercel/blob..." -ForegroundColor Yellow
    npm install @vercel/blob
}

# Check for required environment variables
Write-Host "`n🔑 Environment Variables Check:" -ForegroundColor Cyan

if (Test-Path .env) {
    $envContent = Get-Content .env -Raw
    
    if ($envContent -match "REPLICATE_API_TOKEN") {
        Write-Host "✓ REPLICATE_API_TOKEN found in .env" -ForegroundColor Green
    } else {
        Write-Host "❌ REPLICATE_API_TOKEN not found in .env" -ForegroundColor Red
        Write-Host "   Add it with: echo 'REPLICATE_API_TOKEN=your_token' >> .env" -ForegroundColor Yellow
    }
    
    if ($envContent -match "BLOB_READ_WRITE_TOKEN") {
        Write-Host "✓ BLOB_READ_WRITE_TOKEN found in .env" -ForegroundColor Green
    } else {
        Write-Host "⚠️  BLOB_READ_WRITE_TOKEN not found (will be added by Vercel)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  No .env file found (optional for deployment)" -ForegroundColor Yellow
}

Write-Host "`n📋 Deployment Checklist:" -ForegroundColor Cyan
Write-Host "  1. ✓ Install Vercel CLI" -ForegroundColor Green
Write-Host "  2. ✓ Install dependencies" -ForegroundColor Green
Write-Host "  3. Configure Blob Storage (after first deploy)" -ForegroundColor Yellow
Write-Host "  4. Add environment variables in Vercel Dashboard" -ForegroundColor Yellow

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run: vercel login" -ForegroundColor White
Write-Host "  2. Run: vercel" -ForegroundColor White
Write-Host "  3. Follow the prompts to deploy" -ForegroundColor White
Write-Host "  4. After deployment, add environment variables:" -ForegroundColor White
Write-Host "     - REPLICATE_API_TOKEN" -ForegroundColor Gray
Write-Host "     - BLOB_READ_WRITE_TOKEN (create blob store first)" -ForegroundColor Gray

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "  - Setup Guide: VERCEL_BLOB_SETUP.md" -ForegroundColor White
Write-Host "  - Deployment Guide: VERCEL_DEPLOYMENT.md" -ForegroundColor White

Write-Host "`n❓ Would you like to deploy now? (y/n)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "`n🚀 Starting deployment..." -ForegroundColor Cyan
    vercel
} else {
    Write-Host "`nℹ️  Run 'vercel' when you're ready to deploy." -ForegroundColor Cyan
}
