/**
 * Synonym groups for common reenactment and museum terms.
 * Each group is a set of words that should be treated as related.
 * When a user searches for one term, we expand the query to include its synonyms.
 */
const SYNONYM_GROUPS: string[][] = [
  // Armor & protection
  ['armor', 'armour', 'plate armor', 'plate armour'],
  ['helmet', 'helm', 'sallet', 'bascinet', 'morion', 'burgonet'],
  ['shield', 'buckler', 'targe', 'pavise'],
  ['chainmail', 'chain mail', 'maille', 'mail'],
  ['gauntlet', 'gauntlets', 'glove'],
  ['breastplate', 'cuirass'],

  // Swords & blades
  ['sword', 'blade', 'broadsword'],
  ['dagger', 'dirk', 'stiletto', 'knife'],
  ['rapier', 'epee', 'foil', 'smallsword'],
  ['saber', 'sabre', 'cutlass', 'scimitar'],
  ['axe', 'ax', 'hatchet', 'battleaxe', 'battle axe'],
  ['spear', 'lance', 'pike', 'halberd', 'polearm', 'pole arm'],
  ['mace', 'flail', 'war hammer', 'warhammer'],

  // Ranged weapons
  ['bow', 'longbow', 'crossbow'],
  ['gun', 'firearm', 'musket', 'rifle', 'pistol', 'flintlock'],
  ['cannon', 'artillery'],

  // Clothing & textiles
  ['tunic', 'jerkin', 'doublet', 'surcoat', 'tabard'],
  ['dress', 'gown', 'robe'],
  ['cloak', 'mantle', 'cape'],
  ['textile', 'fabric', 'cloth', 'weaving'],
  ['embroidery', 'needlework', 'tapestry'],
  ['costume', 'clothing', 'garment', 'attire'],
  ['hat', 'cap', 'bonnet', 'headdress'],
  ['boot', 'boots', 'shoe', 'shoes', 'footwear'],

  // Materials
  ['pottery', 'ceramics', 'ceramic', 'earthenware', 'stoneware', 'porcelain'],
  ['jewelry', 'jewellery', 'jewel', 'gem'],
  ['gold', 'gilded', 'gilt'],
  ['silver', 'sterling'],
  ['bronze', 'brass'],
  ['iron', 'steel', 'wrought iron'],

  // Art forms
  ['painting', 'oil painting', 'canvas'],
  ['sculpture', 'statue', 'figurine', 'bust'],
  ['print', 'engraving', 'etching', 'woodcut', 'lithograph'],
  ['drawing', 'sketch'],
  ['photograph', 'photo', 'daguerreotype'],

  // Furniture & household
  ['furniture', 'chair', 'table', 'chest', 'cabinet'],
  ['coin', 'coins', 'numismatic', 'medal', 'medallion'],

  // Regional/cultural
  ['medieval', 'middle ages'],
  ['renaissance', 'early modern'],
  ['viking', 'norse', 'scandinavian'],
  ['roman', 'roman empire'],
  ['greek', 'ancient greek', 'hellenistic'],
  ['egyptian', 'ancient egypt'],
  ['samurai', 'japanese warrior'],
  ['celtic', 'gaelic'],
];

// Build a lookup map: word -> array of synonym words
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
 * Expand a search query with synonyms.
 * Returns the original query plus an expanded version with OR'd synonyms.
 * Most museum APIs treat space-separated terms as AND, and support OR.
 */
export function expandQuery(query: string): string {
  const words = query.toLowerCase().trim().split(/\s+/);
  const expansions: string[] = [];

  // Try matching multi-word phrases first, then single words
  let i = 0;
  while (i < words.length) {
    let matched = false;

    // Try 3-word, 2-word phrases
    for (const len of [3, 2]) {
      if (i + len <= words.length) {
        const phrase = words.slice(i, i + len).join(' ');
        const syns = synonymMap.get(phrase);
        if (syns && syns.length > 0) {
          expansions.push(...syns.slice(0, 2)); // limit to 2 synonyms per term
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const syns = synonymMap.get(words[i]);
      if (syns && syns.length > 0) {
        expansions.push(...syns.slice(0, 2));
      }
      i++;
    }
  }

  if (expansions.length === 0) return query;

  // Return original query + unique expansions for broader results
  const unique = [...new Set(expansions)].filter(
    (e) => !query.toLowerCase().includes(e.toLowerCase())
  );

  if (unique.length === 0) return query;

  return `${query} ${unique.slice(0, 4).join(' ')}`;
}

/**
 * Get just the synonym terms for a query (for relevance scoring).
 */
export function getSynonyms(query: string): string[] {
  const words = query.toLowerCase().trim().split(/\s+/);
  const result: string[] = [];

  for (const word of words) {
    const syns = synonymMap.get(word);
    if (syns) result.push(...syns);
  }

  return [...new Set(result)];
}
