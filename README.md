# Reenactor's Reference

A full-stack historical artifact search app aggregating 1.6M+ items from 4 major museum APIs (Met, V&A, Cleveland, Smithsonian) with unified search, filtering, and collection management — built with Next.js, TypeScript, and Supabase Edge Functions.

🔗 **[Live Demo](https://historical-reference.vercel.app)** &nbsp;|&nbsp; No login required, zero tracking

---

## ✨ Features

- **Multi-museum search** across 1.6M+ artifacts from 4 institutions in parallel
- **Advanced filtering** by time period, category, museum source, and image availability
- **Artifact detail pages** with high-resolution image viewer and full metadata
- **Collection management** — save favorites, export as JSON or CSV
- **Web scraping** via Firecrawl for museums without public APIs
- **Dark/light mode** with system preference detection
- **Fully responsive** — mobile, tablet, and desktop

---

## 🏛️ Museum Collections

| Museum | Collection Size | API Key Required |
|--------|----------------|-----------------|
| Metropolitan Museum of Art | 470,000+ artworks | No |
| Victoria & Albert Museum | 1,000,000+ records | No |
| Cleveland Museum of Art | 64,000+ artworks | No |
| Smithsonian Institution | Millions of items | No (DEMO_KEY fallback) |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 with custom design tokens
- **Backend:** Supabase Edge Functions (Deno) — API proxying & CORS handling
- **Storage:** localStorage (no database needed)
- **Deployment:** Vercel (frontend) + Supabase (edge functions)
- **Icons:** Lucide React

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) account (for edge functions)

### 1. Clone & install
```bash
git clone https://github.com/AlexLin1234/Historical-Reference.git
cd Historical-Reference
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Deploy edge functions
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-id
supabase functions deploy met-museum
supabase functions deploy va-museum
supabase functions deploy cleveland-museum
supabase functions deploy smithsonian
```

### 4. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 API Keys

| Service | Cost | Required For |
|---------|------|--------------|
| **Supabase** | Free | Edge functions (search) |
| **Museum APIs** | Free | Already integrated — no key needed |
| **Smithsonian** | Free | Optional — falls back to `DEMO_KEY` with rate limits |
| **Firecrawl** | Free tier | Web scraping (optional) |

---

## 🏗️ Architecture

Search queries fan out in parallel across all selected museums via `Promise.allSettled()`, with each museum's response normalized into a unified `NormalizedArtifact` type before being returned to the UI. Museum-specific API calls are routed through Supabase Edge Functions to handle CORS and enable server-side optimizations.

```
User Search
    │
    ▼
useSearch hook
    │
    ├──▶ Supabase Edge Fn (Met)       ──▶ Met API
    ├──▶ Supabase Edge Fn (V&A)       ──▶ V&A API
    ├──▶ Supabase Edge Fn (Cleveland) ──▶ Cleveland API
    └──▶ Supabase Edge Fn (Smithsonian) ──▶ Smithsonian API
                │
                ▼
        Normalize to NormalizedArtifact
                │
                ▼
        Unified Results UI
```

---

## 📚 Documentation

- [`QUICKSTART.md`](./QUICKSTART.md) — One-page quick reference
- [`SETUP.md`](./SETUP.md) — Detailed setup guide
- [`.env.example`](./.env.example) — Environment variable template

---

Built with [Claude Code](https://claude.com/claude-code)
