/**
 * Synonym groups for common reenactment and museum terms.
 * Each group is a set of words that should be treated as related.
 * When a user searches for one term, we expand the query to include its synonyms.
 */
const SYNONYM_GROUPS: string[][] = [
  // ── Concept / parent terms ──────────────────────────────────────────────────
  // Searching "weapon" or "weapons" expands to the most common subtypes so
  // museum APIs (which don't know "weapon" is a parent concept) return results.
  ['weapon', 'sword', 'dagger', 'spear', 'bow', 'axe', 'mace'],
  ['armor', 'armour', 'helmet', 'shield', 'breastplate', 'chainmail', 'gauntlet'],
  ['clothing', 'costume', 'garment', 'attire', 'textile', 'dress', 'tunic'],

  // ── Armor & protection ──────────────────────────────────────────────────────
  ['plate armor', 'plate armour', 'full armor', 'harness'],
  ['helmet', 'helm', 'sallet', 'bascinet', 'morion', 'burgonet', 'great helm'],
  ['shield', 'buckler', 'targe', 'pavise', 'roundel'],
  ['chainmail', 'chain mail', 'maille', 'mail', 'hauberk', 'byrnie'],
  ['gauntlet', 'gauntlets', 'mitten gauntlet'],
  ['breastplate', 'cuirass', 'gorget'],
  ['vambrace', 'bracer', 'arm guard'],
  ['greave', 'greaves', 'leg armor', 'sabaton'],

  // ── Swords & blades ─────────────────────────────────────────────────────────
  ['sword', 'blade', 'broadsword', 'longsword', 'arming sword'],
  ['dagger', 'dirk', 'stiletto', 'knife', 'poniard', 'rondel'],
  ['rapier', 'epee', 'foil', 'smallsword', 'tuck'],
  ['saber', 'sabre', 'cutlass', 'scimitar', 'falchion', 'shamshir'],
  ['axe', 'ax', 'hatchet', 'battleaxe', 'battle axe', 'dane axe'],
  ['spear', 'lance', 'pike', 'halberd', 'polearm', 'pole arm', 'partisan', 'glaive'],
  ['mace', 'flail', 'war hammer', 'warhammer', 'morning star'],
  ['knife', 'seax', 'scramasax', 'utility knife'],

  // ── Ranged weapons ──────────────────────────────────────────────────────────
  ['bow', 'longbow', 'crossbow', 'arbalest', 'composite bow'],
  ['arrow', 'bolt', 'quarrel', 'quiver'],
  ['gun', 'firearm', 'musket', 'rifle', 'pistol', 'flintlock', 'arquebus', 'matchlock'],
  ['cannon', 'artillery', 'bombard'],

  // ── Clothing & textiles ─────────────────────────────────────────────────────
  ['tunic', 'jerkin', 'doublet', 'surcoat', 'tabard', 'gambeson', 'arming doublet'],
  ['dress', 'gown', 'robe', 'kirtle', 'cotehardie'],
  ['cloak', 'mantle', 'cape', 'pelisse'],
  ['textile', 'fabric', 'cloth', 'weaving', 'woven'],
  ['embroidery', 'needlework', 'tapestry', 'brocade'],
  ['costume', 'clothing', 'garment', 'attire', 'dress'],
  ['hat', 'cap', 'bonnet', 'headdress', 'coif', 'hood'],
  ['boot', 'boots', 'shoe', 'shoes', 'footwear', 'sabaton'],
  ['hose', 'chausses', 'leggings', 'stockings'],
  ['belt', 'girdle', 'baldric', 'sword belt'],

  // ── Materials ───────────────────────────────────────────────────────────────
  ['pottery', 'ceramics', 'ceramic', 'earthenware', 'stoneware', 'porcelain', 'faience'],
  ['jewelry', 'jewellery', 'jewel', 'gem', 'ornament', 'brooch', 'pendant'],
  ['gold', 'gilded', 'gilt', 'golden'],
  ['silver', 'sterling', 'silvered'],
  ['bronze', 'brass', 'latten'],
  ['iron', 'steel', 'wrought iron', 'cast iron'],
  ['wood', 'wooden', 'carved wood', 'timber'],
  ['leather', 'tanned leather', 'cuir bouilli'],

  // ── Art forms ───────────────────────────────────────────────────────────────
  ['painting', 'oil painting', 'canvas', 'panel painting'],
  ['sculpture', 'statue', 'figurine', 'bust', 'relief'],
  ['print', 'engraving', 'etching', 'woodcut', 'lithograph', 'mezzotint'],
  ['drawing', 'sketch', 'study'],
  ['photograph', 'photo', 'daguerreotype', 'ambrotype'],
  ['manuscript', 'illuminated manuscript', 'codex', 'book of hours'],
  ['map', 'cartography', 'chart'],

  // ── Furniture & household ────────────────────────────────────────────────────
  ['furniture', 'chair', 'table', 'chest', 'cabinet', 'coffer'],
  ['coin', 'coins', 'numismatic', 'medal', 'medallion', 'token'],
  ['vessel', 'cup', 'goblet', 'chalice', 'ewer', 'flagon'],
  ['candlestick', 'candelabra', 'torch holder', 'lantern'],

  // ── Regional / cultural ──────────────────────────────────────────────────────
  ['medieval', 'middle ages', 'mediaeval'],
  ['renaissance', 'early modern', 'quattrocento', 'cinquecento'],
  ['viking', 'norse', 'scandinavian', 'northman'],
  ['roman', 'roman empire', 'ancient rome', 'romano'],
  ['greek', 'ancient greek', 'hellenistic', 'hellenic'],
  ['egyptian', 'ancient egypt', 'pharaonic'],
  ['samurai', 'japanese warrior', 'bushi'],
  ['celtic', 'gaelic', 'gaulish'],
  ['byzantine', 'eastern roman'],
  ['ottoman', 'turkish', 'anatolian'],
  ['persian', 'safavid', 'achaemenid'],
  ['chinese', 'tang dynasty', 'song dynasty', 'ming dynasty'],
  ['japanese', 'edo period', 'heian period', 'feudal japan'],
  ['indian', 'mughal', 'rajput'],
];

// Build a lookup map: normalised phrase -> array of synonym strings
const synonymMap = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    const lower = word.toLowerCase();
    const others = group.filter((w) => w.toLowerCase() !== lower);
    const existing = synonymMap.get(lower) || [];
    synonymMap.set(lower, [...new Set([...existing, ...others])]);
  }
}

/**
 * Try to look up a word accounting for simple plural/singular normalization.
 * "swords" → try "swords", then "sword" (strip trailing s/es).
 */
function lookupWord(word: string): string[] | undefined {
  const direct = synonymMap.get(word);
  if (direct) return direct;

  // Strip common English suffixes to find the base form
  if (word.endsWith('es') && word.length > 3) {
    const base = word.slice(0, -2);
    const found = synonymMap.get(base);
    if (found) return found;
  }
  if (word.endsWith('s') && word.length > 2) {
    const base = word.slice(0, -1);
    const found = synonymMap.get(base);
    if (found) return found;
  }

  return undefined;
}

/**
 * Expand a search query with synonyms.
 * Returns the original query plus an expanded version with OR'd synonyms.
 * Most museum APIs treat space-separated terms as AND, and support OR.
 */
export function expandQuery(query: string): string {
  const words = query.toLowerCase().trim().split(/\s+/);
  const expansions: string[] = [];

  let i = 0;
  while (i < words.length) {
    let matched = false;

    // Try longest phrase matches first (3-word, then 2-word)
    for (const len of [3, 2]) {
      if (i + len <= words.length) {
        const phrase = words.slice(i, i + len).join(' ');
        const syns = synonymMap.get(phrase);
        if (syns && syns.length > 0) {
          expansions.push(...syns.slice(0, 2));
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const syns = lookupWord(words[i]);
      if (syns && syns.length > 0) {
        expansions.push(...syns.slice(0, 2));
      }
      i++;
    }
  }

  if (expansions.length === 0) return query;

  const unique = [...new Set(expansions)].filter(
    (e) => !query.toLowerCase().includes(e.toLowerCase())
  );

  if (unique.length === 0) return query;

  return `${query} ${unique.slice(0, 4).join(' ')}`;
}

/**
 * Get just the synonym terms for a query (for relevance scoring).
 * Handles multi-word phrases and plural normalization.
 */
export function getSynonyms(query: string): string[] {
  const words = query.toLowerCase().trim().split(/\s+/);
  const result: string[] = [];

  let i = 0;
  while (i < words.length) {
    let matched = false;

    // Try longest phrase matches first (same logic as expandQuery)
    for (const len of [3, 2]) {
      if (i + len <= words.length) {
        const phrase = words.slice(i, i + len).join(' ');
        const syns = synonymMap.get(phrase);
        if (syns) {
          result.push(...syns);
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const syns = lookupWord(words[i]);
      if (syns) result.push(...syns);
      i++;
    }
  }

  return [...new Set(result)];
}
