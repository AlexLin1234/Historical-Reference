# Feature Overview - Reenactor's Reference

## ✅ Fully Implemented Features

### 🔍 Search & Discovery

**Search Interface** (`/`)
- Large search bar with helpful placeholder text
- Real-time search across 3 museum APIs simultaneously
- Filter panel with:
  - Time period dropdown (Ancient to Modern)
  - Category selector (Arms & Armor, Textiles, etc.)
  - Museum checkboxes (Met, V&A, Cleveland)
  - "Has Image" toggle
- Grid layout showing artifact cards
- Loading states, error messages, empty states

**How it works:**
1. Type search term (e.g., "sword", "armor", "medieval helmet")
2. Adjust filters if desired
3. Click Search
4. Results from all selected museums appear in grid

---

### 🖼️ Artifact Detail Pages

**View Full Details** (`/artifact/[source]/[id]`)
- Large image viewer with:
  - Click to zoom in modal
  - Thumbnail strip for additional images
  - Smooth transitions and hover effects
- Complete metadata table:
  - Date, Artist, Culture, Period
  - Classification, Medium, Dimensions
  - Department, Gallery, Location
  - Credit line
- Full description (if available)
- "View at Museum" link to original source
- Save to collection button

**How to access:**
- Click any artifact card from search results
- Navigate back with "Back to results" button

---

### 📚 Collection Management

**My Collection** (`/collection`)
- View all saved artifacts
- Organized by category/classification
- Remove items individually (hover shows X button)
- **Export functionality:**
  - Download as JSON (full artifact data)
  - Download as CSV (spreadsheet format)
  - Filename includes date: `reenactors-collection-2026-02-14.json`
- Clear all artifacts at once
- Empty state when no items saved

**Collection Features:**
- ✅ Persists in browser localStorage
- ✅ Works across tabs (sync via StorageEvent)
- ✅ Survives page refreshes
- ✅ Schema versioning for future updates
- ✅ No database needed - completely client-side

**How to use:**
1. Click bookmark icon on any artifact (search or detail page)
2. View saved items in Collection page
3. Export anytime to JSON or CSV for backup/research

---

### 🌐 Web Scraping

**Scrape Museum Pages** (`/scrape`)
- Enter URL of any museum artifact page
- Powered by Firecrawl API
- Heuristic extraction of:
  - Title, Date, Artist
  - Culture, Medium, Classification
  - Description
  - Images
- **Editable fields before saving**
- Save to collection after review

**How it works:**
1. Find an artifact on a museum website (without public API)
2. Copy the URL
3. Paste in scrape form and click "Scrape Page"
4. Review/edit extracted data
5. Save to collection

**Note:** Requires Firecrawl API key set in Supabase secrets

---

### 🎨 Dark/Light Mode

- System preference detection
- Toggle in header (sun/moon icon)
- Persists in localStorage
- No flash on page load
- All components styled for both modes

---

### 📱 Responsive Design

**Breakpoints:**
- Mobile (< 640px): Single column, stacked layout
- Tablet (640-1024px): 2 columns, optimized for touch
- Desktop (> 1024px): Up to 4 columns

**Adaptive features:**
- Navigation collapses on mobile
- Filters stack vertically on small screens
- Image grids adjust column count
- Touch-friendly button sizes

---

## 🎯 How To Use Everything

### Basic Workflow

1. **Search for artifacts:**
   - Go to home page
   - Search "Viking sword" or "medieval armor"
   - Apply filters as needed

2. **View details:**
   - Click any artifact card
   - View large images and full metadata
   - Click image to zoom

3. **Save to collection:**
   - Click bookmark icon on card or detail page
   - Artifact saved to localStorage

4. **Manage collection:**
   - Go to Collection page
   - Export as JSON/CSV for offline use
   - Remove items you no longer need

5. **Scrape other museums:**
   - Find artifact on non-API museum site
   - Go to Scrape page
   - Paste URL and extract data
   - Edit and save

---

## 💾 Export Formats

### JSON Export
```json
[
  {
    "id": "cma-12345",
    "source": "cleveland",
    "title": "Viking Sword",
    "date": "10th century",
    "artist": "Unknown",
    "medium": "Iron, bronze, silver",
    "primaryImage": "https://...",
    "savedAt": "2026-02-14T19:30:00.000Z",
    "notes": "",
    "tags": []
  }
]
```

### CSV Export
```csv
title,date,artist,medium,culture,source,sourceUrl
"Viking Sword","10th century","Unknown","Iron, bronze","Norse","cleveland","https://..."
```

---

## 🔑 Feature Requirements

| Feature | Requires Supabase | Requires Firecrawl | Works Offline |
|---------|-------------------|---------------------|---------------|
| Search | ✅ Yes | ❌ No | ❌ No |
| Detail Pages | ✅ Yes | ❌ No | ❌ No |
| Collection | ❌ No | ❌ No | ✅ Yes* |
| Export | ❌ No | ❌ No | ✅ Yes |
| Web Scrape | ✅ Yes | ✅ Yes | ❌ No |
| Dark Mode | ❌ No | ❌ No | ✅ Yes |

\* Collection data is local to browser

---

## 📊 Data Sources

### Museum APIs (All FREE, No Keys Needed!)

**Metropolitan Museum of Art**
- 470,000+ artworks
- Full object data with images
- Batch fetching for performance
- Public domain images

**Victoria & Albert Museum**
- 1,000,000+ collection records
- IIIF high-resolution images
- Rich metadata

**Cleveland Museum of Art**
- 64,000+ artworks
- Direct image URLs
- CC0 licensed content

### Web Scraping (Firecrawl)
- For museums without APIs
- Extracts markdown content
- Heuristic field detection
- User-editable results

---

## 🚀 Performance Features

- **Parallel API calls** - All 3 museums queried simultaneously
- **Image optimization** - Next.js Image component with lazy loading
- **Batch fetching** - Met Museum IDs fetched in groups of 20
- **Client-side caching** - localStorage for instant collection access
- **Edge function proxying** - CORS-safe, server-side batching

---

## 🎨 UI/UX Features

- **Skeleton loading states** - Smooth content loading
- **Error boundaries** - Graceful error handling
- **Empty states** - Helpful messages when no data
- **Tooltips & labels** - Clear affordances
- **Keyboard navigation** - Accessible inputs
- **Touch-friendly** - Large tap targets on mobile
- **Print-friendly** - Artifact details look good printed

---

## 🔒 Privacy & Data

- ✅ **No tracking** - No analytics, cookies, or third-party scripts
- ✅ **Local storage only** - Collection stays in your browser
- ✅ **No server database** - All user data is client-side
- ✅ **Export anytime** - Download your data as JSON/CSV
- ✅ **No login required** - Use immediately, no account needed

---

## 🎯 Next Steps

Remaining features to add:
- [ ] Pagination for large result sets
- [ ] Sort options (date, title, museum)
- [ ] Advanced filters (date range, specific artists)
- [ ] Image download buttons
- [ ] Print-optimized detail view
- [ ] Share functionality (copy link, QR code)

---

**Current Status:** All core features complete and functional! 🎉
