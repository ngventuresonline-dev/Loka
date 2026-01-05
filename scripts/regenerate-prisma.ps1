# Script to regenerate Prisma client
# This fixes issues where the Prisma client is out of sync with the schema

Write-Host "Regenerating Prisma client..." -ForegroundColor Yellow

# Try to regenerate
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Prisma client regenerated successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to regenerate. Make sure:" -ForegroundColor Red
    Write-Host "1. Stop any running Node.js processes (dev server, etc.)" -ForegroundColor Yellow
    Write-Host "2. Close any IDEs that might have the Prisma client files open" -ForegroundColor Yellow
    Write-Host "3. Try running: npx prisma generate" -ForegroundColor Yellow
}

