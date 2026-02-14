# PowerShell script to deploy all Supabase Edge Functions
Write-Host "🚀 Deploying Supabase Edge Functions..." -ForegroundColor Cyan

Write-Host "`n📦 Deploying cleveland-museum..." -ForegroundColor Yellow
npx supabase functions deploy cleveland-museum

Write-Host "`n📦 Deploying va-museum..." -ForegroundColor Yellow
npx supabase functions deploy va-museum

Write-Host "`n📦 Deploying met-museum..." -ForegroundColor Yellow
npx supabase functions deploy met-museum

Write-Host "`n✅ All functions deployed!" -ForegroundColor Green
Write-Host "🧪 Test your search at http://localhost:3000" -ForegroundColor Cyan
