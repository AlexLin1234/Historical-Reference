# Testing Guide

## Current Status

✅ **Working Without Setup:**
- UI loads at http://localhost:3000
- Search bar, filters, theme toggle all work
- Page is responsive and styled correctly

❌ **Not Working Yet (Expected):**
- Search returns "Failed to send a request to the Edge Function"
- This is because edge functions aren't deployed yet

---

## Deploy Edge Functions to Make Search Work

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

This opens a browser to authenticate.

### 3. Link Your Project

First, get your project ref from Supabase dashboard (Settings → General).

```bash
supabase link --project-ref your-project-ref-here
```

### 4. Deploy All Edge Functions

```bash
# Deploy all at once
supabase functions deploy met-museum
supabase functions deploy va-museum
supabase functions deploy cleveland-museum
supabase functions deploy firecrawl-scrape
```

Or deploy individually to test:

```bash
# Start with Cleveland (simplest API)
supabase functions deploy cleveland-museum
```

### 5. Test in the Browser

1. Open http://localhost:3000
2. Type "sword" in the search bar
3. Click Search
4. You should see artifacts appear! 🎉

---

## Testing Without Deploying (Direct API Test)

You can test the museum APIs directly without any setup:

### Test Cleveland Museum API

```bash
curl "https://openaccess-api.clevelandart.org/api/artworks/?q=sword&has_image=1&limit=5"
```

You should see JSON with 5 sword artifacts.

### Test Met Museum API

```bash
# Search
curl "https://collectionapi.metmuseum.org/public/collection/v1/search?q=armor&hasImages=true"

# Get specific object (replace 24797 with any ID from search)
curl "https://collectionapi.metmuseum.org/public/collection/v1/objects/24797"
```

### Test V&A Museum API

```bash
curl "https://api.vam.ac.uk/v2/objects/search?q=helmet&page_size=5"
```

---

## Troubleshooting

### "supabase: command not found"

Install the CLI:
```bash
npm install -g supabase
```

### "Failed to send a request to the Edge Function"

This means:
1. Edge functions not deployed yet → Deploy them (see above)
2. Wrong Supabase URL/key in `.env.local` → Check your credentials
3. Supabase project not created yet → Create one at supabase.com

### "Invalid project ref"

Make sure you're using the project ref (short ID), not the full URL:
- ✅ Correct: `abc123xyz`
- ❌ Wrong: `https://abc123xyz.supabase.co`

### Edge function deploy fails

```bash
# Re-login
supabase login

# Re-link
supabase link --project-ref your-ref
```

---

## What to Expect When Search Works

Once edge functions are deployed:

1. **Type "sword"** → See medieval swords, Japanese katanas, Viking weapons
2. **Type "armor"** → See suits of armor, helmets, shields
3. **Apply filters:**
   - Time Period: Medieval → Only medieval artifacts
   - Category: Arms & Armor → Only weapons and armor
   - Uncheck "Met" → Remove Met Museum results
4. **Click an artifact** → See detail page (Phase 3, not built yet)
5. **Click bookmark** → Save to collection (Phase 6, not built yet)

---

## Testing Checklist

- [ ] UI loads without errors
- [ ] Search bar accepts input
- [ ] Filters can be changed
- [ ] Theme toggle works
- [ ] Deploy Cleveland edge function
- [ ] Search returns Cleveland results
- [ ] Deploy V&A edge function
- [ ] Search returns V&A results
- [ ] Deploy Met edge function
- [ ] Search returns Met results
- [ ] Multiple museums return results simultaneously
- [ ] Filters narrow results correctly

---

## Next Steps After Search Works

Once you can search and see results, the next phases are:

1. **Phase 3-5:** Add artifact detail pages (click on a card)
2. **Phase 6:** Build collection management UI (save/organize/export)
3. **Phase 7:** Add web scraping interface
4. **Phase 8:** Polish and responsive design tweaks

---

## Quick Deploy Script

Save this as `deploy-functions.sh`:

```bash
#!/bin/bash
echo "Deploying all Supabase Edge Functions..."
supabase functions deploy met-museum
supabase functions deploy va-museum
supabase functions deploy cleveland-museum
supabase functions deploy firecrawl-scrape
echo "Done! Test search at http://localhost:3000"
```

Then run:
```bash
chmod +x deploy-functions.sh
./deploy-functions.sh
```
