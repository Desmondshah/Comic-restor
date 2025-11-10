# Quick Vercel Blob Setup

Write-Host "🔧 Setting up Vercel Blob Storage" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

Write-Host "📦 Creating Blob Store..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This will create a blob store named 'comic-files' in your Vercel project." -ForegroundColor Yellow
Write-Host "The BLOB_READ_WRITE_TOKEN will be automatically added to your project." -ForegroundColor Yellow
Write-Host ""

# Create blob store
vercel blob create comic-files

Write-Host "`n✅ Done! Your blob store is ready." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Redeploy your app: vercel --prod" -ForegroundColor White
Write-Host "2. Test uploads on your production site" -ForegroundColor White
Write-Host ""
Write-Host "Note: The BLOB_READ_WRITE_TOKEN has been added to your Vercel project automatically." -ForegroundColor Gray
