# Deploy all Supabase Edge Functions (PowerShell)
Write-Host "Deploying Supabase Edge Functions..." -ForegroundColor Cyan

$functions = @(
  "met-museum", "va-museum", "cleveland-museum", "smithsonian", "harvard-museum",
  "chicago-museum", "mia-museum", "europeana", "firecrawl-scrape", "vector-search",
  "ingest-artifact"
)

foreach ($fn in $functions) {
  Write-Host "`nDeploying $fn..." -ForegroundColor Yellow
  npx supabase functions deploy $fn
}

Write-Host "`nAll functions deployed." -ForegroundColor Green
Write-Host "Optional keys: npx supabase secrets set SMITHSONIAN_API_KEY=... HARVARD_API_KEY=... EUROPEANA_API_KEY=... FIRECRAWL_API_KEY=..." -ForegroundColor Cyan
