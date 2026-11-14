# Reenactor's Reference - Setup Guide

> **Note:** the app now has more functions than this guide lists. Run `./deploy-functions.sh` (or `deploy-functions.ps1`) to deploy all of them, and see the README for the optional museum API keys.

## 🔑 API Keys Required

### 1. Supabase (Required)
- **Free tier available**: Yes ✅
- **Sign up**: https://supabase.com
- **What you need**:
  - `NEXT_PUBLIC_SUPABASE_URL` (from Project Settings → API)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Project Settings → API)

### 2. Firecrawl (Optional - only for web scraping)
- **Free tier**: Yes (500 credits/month)
- **Sign up**: https://firecrawl.dev
- **What you need**:
  - `FIRECRAWL_API_KEY` (starts with `fc-`)

### 3. Museum APIs (No keys needed! 🎉)
All three museum APIs are completely free and require no authentication:
- ✅ Metropolitan Museum of Art
- ✅ Victoria & Albert Museum
- ✅ Cleveland Museum of Art

---

## 🚀 Quick Start

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Wait for it to finish setting up (~2 minutes)

### 3. Configure Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Link to Supabase
```bash
supabase link --project-ref your-project-id
```

### 5. Deploy Edge Functions
```bash
supabase functions deploy met-museum
supabase functions deploy va-museum
supabase functions deploy cleveland-museum
supabase functions deploy firecrawl-scrape
```

### 6. Set Firecrawl Secret (Optional)
If you want web scraping:
```bash
supabase secrets set FIRECRAWL_API_KEY=fc-your-key-here
```

### 7. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000 🎉

---

## 🧪 Testing Without Supabase

You can test the UI and frontend without deploying edge functions by:

1. Skip Supabase setup (leave `.env.local` with placeholder values)
2. Run `npm run dev`
3. The UI will load but searches will fail (expected)
4. This is useful for UI development

---

## 🔍 Testing Individual APIs

### Test Cleveland Museum API (No keys needed!)
```bash
curl "https://openaccess-api.clevelandart.org/api/artworks/?q=sword&has_image=1&limit=5"
```

### Test Met Museum API (No keys needed!)
```bash
curl "https://collectionapi.metmuseum.org/public/collection/v1/search?q=armor&hasImages=true"
```

### Test V&A Museum API (No keys needed!)
```bash
curl "https://api.vam.ac.uk/v2/objects/search?q=helmet&page_size=5"
```

---

## 📁 Project Structure

```
Historical-Reference/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities, API clients, normalizers
│   └── types/           # TypeScript type definitions
├── supabase/
│   └── functions/       # Edge functions (API proxies)
├── .env.local           # Environment variables (YOU CREATE THIS)
└── package.json
```

---

## 🐛 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Edge function deployment fails
```bash
supabase login
supabase link --project-ref your-project-id
```

### CORS errors in browser
- Make sure edge functions are deployed
- Check that `.env.local` has correct Supabase URL

### Museum APIs not returning data
- Check your internet connection
- Museum APIs are free but can be slow
- Try the curl commands above to test directly

---

## 📚 What Works Right Now

✅ **Working:**
- Next.js app runs locally
- Dark/light theme toggle
- Header navigation
- Type system and data models
- localStorage collection storage
- All hooks (useSearch, useCollection, useTheme)

⏳ **Needs Supabase to work:**
- Searching museums (requires edge functions deployed)
- Viewing artifact details
- Web scraping

🚧 **Not implemented yet:**
- Search UI components (SearchBar, FilterPanel)
- Artifact cards and detail pages
- Collection page UI
- Web scrape page UI

---

## 🎯 Next Steps After Setup

1. Deploy edge functions to Supabase
2. Run `npm run dev` and verify the app loads
3. The next phase is to build the search UI components
4. Then artifact cards and detail pages
5. Finally collection management and web scraping UI
