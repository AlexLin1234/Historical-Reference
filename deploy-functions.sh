#!/usr/bin/env bash
# Deploy all Supabase Edge Functions.
set -euo pipefail

for fn in met-museum va-museum cleveland-museum smithsonian harvard-museum \
          chicago-museum mia-museum europeana firecrawl-scrape vector-search \
          ingest-artifact; do
  echo "Deploying $fn..."
  npx supabase functions deploy "$fn"
done

echo "All functions deployed."
echo "Optional keys: npx supabase secrets set SMITHSONIAN_API_KEY=... HARVARD_API_KEY=... EUROPEANA_API_KEY=... FIRECRAWL_API_KEY=..."
