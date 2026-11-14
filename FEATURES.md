# Feature Overview - Reenactor's Reference

## Search (`/`)

- Searches the Met, V&A, Cleveland, Chicago, Minneapolis, Smithsonian, Harvard and Europeana in parallel and shows one ranked list.
- **Dates in the query become a filter.** `15th century sallet`, `late 14th century bascinet`, `frock coat 1860s`, `brooch 900-1066`, `sword ca. 1640` and `gladius 1st century AD` are all understood. A single year means "around then" (±15 years). Designations such as `pattern 1796 sabre` or `model 1860` are left alone. A banner shows the interpretation and lets you search the literal words instead.
- **`"quoted phrase"`** prefers records containing the exact phrase; **`-word`** removes records that mention it (`sallet -replica`).
- **Filters:** broad periods, reenactment eras, any custom year range (negative years for BCE), category, museums, images only.
- **Sort:** best match, oldest first, newest first, title.
- **Related searches** suggest kindred objects (helmet → sallet, bascinet, barbute…), and **"Did you mean"** catches typos of reenactment terms.
- **Spelling is handled for you:** `armor` is sent to the V&A as `armour` and vice versa.
- The search is stored in the URL: results survive the back button, and a link reproduces the search for someone else.

## Artifact pages (`/artifact/[source]/[id]`)

- Image viewer with zoom and alternate views, full metadata including dimensions and accession number, description, link to the museum record.
- **Cite this piece:** a ready-made citation (object, date, maker or culture, material, institution, accession number, URL, access date) with a copy button.
- **Use in my kit:** tick the impressions the piece documents and see at once whether it is in period for each. Add your own notes.
- Saved pieces open instantly from your saved copy and still open if the museum is unreachable.

## Impressions (`/kits`)

An impression is one portrayal: a person, place and date range.

- Create one per portrayal, with an era preset or your own years.
- Add saved pieces. Each shows a **date check**: in period, within 25 years, or how many years too early or late.
- Pieces are grouped by kit area (headwear, body armour, clothing, footwear, weapons, accessories, jewellery, camp and domestic, pictorial evidence). The guess can be overridden.
- **Not yet evidenced** lists core kit areas with no reference and links to a search already limited to your dates.
- **Print sheet** produces a clean documentation sheet with images, citations, date checks and your notes. **Copy as text** and **Markdown** export the same content for a forum post or an authenticity officer.

## Collection (`/collection`)

- Saved artifacts grouped by classification, with notes shown on each card.
- Export as JSON (full backup including impressions) or CSV (spreadsheet). Import a JSON backup to move between browsers or devices.
- Stored only in this browser. Nothing is uploaded.

## Web scraping (`/scrape`)

- Pulls a record from a listed museum site without an API (via Firecrawl), lets you correct the extracted fields, and saves it to the collection. Requires `FIRECRAWL_API_KEY`.

## Requirements

| Feature | Needs Supabase functions | Needs a key | Works offline |
|---------|--------------------------|-------------|---------------|
| Search, artifact pages | Yes | Smithsonian recommended; Harvard and Europeana required for those sources | No |
| Collection, impressions, citations, export | No | No | Yes (saved pieces) |
| Web scrape | Yes | Firecrawl | No |

## Privacy

No tracking, analytics or accounts. The collection and impressions live in your browser's localStorage and can be exported at any time.
