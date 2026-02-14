# Reenactor's Reference

A historical artifact search tool for reenactors to explore museum collections across the Metropolitan Museum of Art, Victoria & Albert Museum, and Cleveland Museum of Art.

## ✨ What's Working Right Now

When you run `npm run dev`, you'll see:

✅ **Fully functional search interface** with:
- Large search bar with placeholder text
- Filter panel (time period, category, museum sources, has-image toggle)
- Responsive grid layout for results
- Dark/light theme toggle in header
- Collection counter badge

✅ **Complete UI components:**
- Header with navigation
- Search bar, filter panel, results grid
- Artifact cards with images and metadata
- Loading spinners, error messages, empty states
- Theme toggle with localStorage persistence

⏳ **Needs Supabase setup to work:**
- Actual searching (requires deployed edge functions)
- Viewing artifact details
- Saving to collection
- Web scraping

See [`QUICKSTART.md`](./QUICKSTART.md) for setup instructions.

---

## 🚀 Quick Start

### Run Locally (UI Only)
```bash
npm install
npm run dev
```

Open http://localhost:3000 - You'll see the full UI, but search won't work until you deploy edge functions.

### Full Setup (With Search)

1. **Get Supabase keys** (free): https://supabase.com
2. **Create `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Deploy edge functions:**
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref your-project-id
   supabase functions deploy met-museum
   supabase functions deploy va-museum
   supabase functions deploy cleveland-museum
   ```
4. **Run:** `npm run dev`

Now search will work! 🎉

See [`SETUP.md`](./SETUP.md) for detailed instructions.

---

## 🔑 API Keys

| Service | Cost | Required For | Sign Up |
|---------|------|--------------|---------|
| **Supabase** | FREE | Search to work | https://supabase.com |
| **Firecrawl** | FREE tier | Web scraping (optional) | https://firecrawl.dev |
| **Museum APIs** | FREE | Nothing! Already integrated | N/A |

The museum APIs (Met, V&A, Cleveland) are completely free and require **no API keys**.

---

## 📦 What's Built

### ✅ Phase 1 & 2 Complete

- **Next.js 16** with TypeScript + Tailwind CSS v4
- **Type system** for normalized artifacts across museums
- **4 Supabase Edge Functions** (API proxies)
- **Museum API clients** (Met, V&A, Cleveland)
- **Normalizers** to unify different museum schemas
- **localStorage** session collection storage
- **Custom hooks**: useSearch, useCollection, useTheme, useDebounce
- **Complete search UI**: SearchBar, FilterPanel, SearchResults, ArtifactCard
- **Dark/light mode** with system preference detection
- **Responsive layout** with Header navigation

### 🚧 Still To Build (Phases 3-8)

- Artifact detail pages
- Collection management UI
- Web scraping interface
- Pagination
- Additional polish and responsive tweaks

---

## 🏛️ Museum Collections

This tool searches across three major museum APIs:

- **Metropolitan Museum of Art** - 470,000+ artworks
- **Victoria & Albert Museum** - 1,000,000+ collection records
- **Cleveland Museum of Art** - 64,000+ artworks

All APIs are free and require no authentication!

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Backend:** Supabase Edge Functions (Deno)
- **Storage:** localStorage (no database needed)
- **Icons:** Lucide React
- **APIs:** Met Museum, V&A, Cleveland Museum (all free)

---

## 📚 Documentation

- [`QUICKSTART.md`](./QUICKSTART.md) - One-page quick reference
- [`SETUP.md`](./SETUP.md) - Detailed setup guide
- [`.claude/plans/`](./.claude/plans/) - Implementation plan

---

## 🤝 Contributing

This project is in active development. See the todo list for upcoming features.

---

Built with [Claude Code](https://claude.com/claude-code)
