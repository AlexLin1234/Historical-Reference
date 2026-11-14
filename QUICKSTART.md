# Quick Start - TL;DR

> **Note:** the app now has more functions than this guide lists. Run `./deploy-functions.sh` (or `deploy-functions.ps1`) to deploy all of them, and see the README for the optional museum API keys.

## ⚡ Fastest Way to Run Locally (No API Setup)

```bash
npm run dev
```

**What you'll see:**
- ✅ App loads at http://localhost:3000
- ✅ Header with navigation
- ✅ Dark/light theme toggle works
- ❌ Search won't work (needs Supabase)

---

## 🔑 Minimal Setup for Full Functionality

### 1. Get Supabase Keys (2 minutes)
1. Sign up at https://supabase.com
2. Create new project
3. Go to Settings → API
4. Copy URL and anon key

### 2. Add to `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### 3. Deploy Edge Functions
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-id
supabase functions deploy met-museum
supabase functions deploy va-museum
supabase functions deploy cleveland-museum
```

### 4. Run
```bash
npm run dev
```

Now search will work! 🎉

---

## 🎨 What's Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Next.js app structure | ✅ Done | Runs locally |
| Dark/light theme | ✅ Done | Toggle in header |
| Type system | ✅ Done | All museum types defined |
| Museum APIs | ✅ Done | 3 free APIs, no keys needed |
| Edge functions | ✅ Done | Need to deploy to Supabase |
| localStorage | ✅ Done | Session collection storage |
| Search UI | ❌ Not yet | Phase 2 |
| Artifact cards | ❌ Not yet | Phase 3-5 |
| Collection page | ❌ Not yet | Phase 6 |
| Web scraping | ❌ Not yet | Phase 7 (needs Firecrawl key) |

---

## 🧪 Test Museum APIs (No Setup Required)

These work right now without any API keys:

```bash
# Cleveland Museum
curl "https://openaccess-api.clevelandart.org/api/artworks/?q=sword&limit=3"

# Met Museum
curl "https://collectionapi.metmuseum.org/public/collection/v1/search?q=armor"

# V&A Museum
curl "https://api.vam.ac.uk/v2/objects/search?q=helmet&page_size=3"
```

---

## 📦 What You Get

- **49 files** committed
- **8,522 lines** of code
- **3 museum APIs** integrated (all free!)
- **4 edge functions** ready to deploy
- **0 API keys** needed for museums (just Supabase for proxying)

---

## 🚨 Common Issues

**"Port 3000 is in use"**
- Next.js will auto-use 3001, 3002, etc.
- Or stop other dev server: `npx kill-port 3000`

**"Module not found"**
- Run: `npm install`

**"Supabase not found"**
- Install: `npm install -g supabase`

**Search returns errors**
- Edge functions not deployed yet (see setup above)
- Or `.env.local` missing/incorrect

---

See `SETUP.md` for detailed setup instructions.
