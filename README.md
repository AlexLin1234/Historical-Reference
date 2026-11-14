# Reenactor's Reference

A historical artifact search app for reenactors and living historians. It searches eight museum collections at once, ranks the results in a single list, and helps you document a kit: save pieces, check their dates against your portrayal, and print a reference sheet with citations. Built with Next.js, TypeScript, and Supabase Edge Functions.

🔗 **[Live Demo](https://historical-reference.vercel.app)** &nbsp;|&nbsp; No login required, zero tracking

---

## ✨ Features

- **Multi-museum search** across eight collections in parallel, merged into one ranked list
- **Search that understands dates**: `15th century sallet`, `frock coat 1860s` and `brooch 900-1066` become a date filter; `"quoted phrases"` and `-exclusions` work too
- **Reenactment eras** (Viking Age, Wars of the Roses, American Civil War…) and custom year ranges, plus category, museum, image and sort controls
- **Related searches** from a reenactment vocabulary (helmet → sallet, bascinet, kettle hat…) and typo suggestions
- **Impressions (kits)**: group saved pieces by portrayal, see which are in period, find kit areas with no evidence yet, and print or export a documentation sheet
- **Citations** with accession numbers on every artifact, plus your own research notes
- **Shareable searches**: the search lives in the URL, so results survive the back button and can be sent to your group
- **Collection management**: save, annotate, export as JSON or CSV, and import a backup
- **Web scraping** via Firecrawl for museums without public APIs
- **Dark/light mode**, responsive, print-friendly

---

## 🏛️ Museum Collections

| Museum | API key | Notes |
|--------|---------|-------|
| Metropolitan Museum of Art | No | Uses the v1.1 search endpoint (v1 was retired on 2026-10-01) |
| Victoria & Albert Museum | No | |
| Cleveland Museum of Art | No | |
| Art Institute of Chicago | No | |
| Minneapolis Institute of Art | No | |
| Smithsonian Institution | Recommended | Without `SMITHSONIAN_API_KEY` it uses the shared `DEMO_KEY`, which allows only about 10 requests |
| Harvard Art Museums | Required | `HARVARD_API_KEY` |
| Europeana | Required | `EUROPEANA_API_KEY`. Aggregates thousands of European museums, including Portable Antiquities Scheme finds |

All three keys are free. Museums without a key are skipped with a small note instead of an error.

Evaluated but not added: Science Museum Group and Museums Victoria (their firewalls reject server-to-server requests), Portable Antiquities Scheme (same, but its records are available through Europeana), and Rijksmuseum (its new API returns bare IDs that each need a further Linked Art lookup; its collection is also in Europeana).

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 with custom design tokens
- **Backend:** Supabase Edge Functions (Deno) for API proxying, validation and rate limiting
- **Storage:** localStorage for the collection and impressions; optional pgvector index for semantic search
- **Deployment:** Vercel (frontend) + Supabase (edge functions)
- **Tests:** Vitest (`npm test`)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
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
./deploy-functions.sh        # or deploy-functions.ps1 on Windows
```

Then add whichever museum keys you have (all optional, all free):
```bash
supabase secrets set SMITHSONIAN_API_KEY=... HARVARD_API_KEY=... EUROPEANA_API_KEY=...
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
| **Met, V&A, Cleveland, Chicago, Minneapolis** | Free | Nothing to set up |
| **Smithsonian** (api.data.gov) | Free | Reliable Smithsonian search |
| **Harvard Art Museums** | Free | Harvard search |
| **Europeana** | Free | Europeana search |
| **Firecrawl** | Free tier | Web scraping (optional) |

Museum keys are Supabase secrets read by the edge functions; they are never sent to the browser.

---

## 🏗️ Architecture

```
Search box ──▶ URL (?q=…&from=…&to=…)            the URL is the search state
                 │
                 ▼
        parse query (dates, "phrases", -exclusions)
                 │
                 ▼
   one Edge Function per museum, in parallel      query rewritten to each museum's
   (validation, rate limit, timeout, retries)     spelling; filters mapped to its API
                 │
                 ▼
   normalize ──▶ rank across museums ──▶ interleave ──▶ results
```

**Ranking.** Every artifact is scored against the query with a BM25F-style model (title and object type weigh most; plural and US/UK spelling variants match; long words tolerate typos). That is blended with the museum's own ordering, how well the piece's date fits the requested range, optional vector similarity from the pgvector index, and record quality. Museums are then interleaved so one large collection cannot fill the first screen. See `src/lib/search/`.

**Filters.** Each museum has its own vocabulary: the Met filters by department or medium, the V&A by category id, Chicago through an Elasticsearch query, and so on (`src/lib/search/categories.ts`). Anything a museum cannot filter itself is filtered in the browser, so every filter applies to every source.

---

## 📚 Documentation

- [`QUICKSTART.md`](./QUICKSTART.md) — One-page quick reference
- [`SETUP.md`](./SETUP.md) — Detailed setup guide
- [`.env.example`](./.env.example) — Environment variable template

---

Built with [Claude Code](https://claude.com/claude-code)
