/**
 * Domain vocabulary for reenactment research.
 *
 * Two different relationships are kept apart on purpose:
 *
 *  - SPELLINGS: the same word in American and British English. Museums catalogue
 *    in their own dialect (the Met has "armor", the V&A "armour"), so the query is
 *    rewritten per museum instead of sending both spellings and hoping.
 *
 *  - RELATED: families of kindred object names (helmet → sallet, bascinet…).
 *    These are *not* interchangeable, so they are never added to the query sent
 *    to a museum (most APIs AND their terms, which would shrink the results).
 *    They are used to offer "related searches" and as a weak ranking signal.
 */

export type Dialect = 'us' | 'uk';

/** [american, british] */
const SPELLINGS: [string, string][] = [
  ['armor', 'armour'],
  ['armored', 'armoured'],
  ['armorer', 'armourer'],
  ['saber', 'sabre'],
  ['jewelry', 'jewellery'],
  ['jeweled', 'jewelled'],
  ['color', 'colour'],
  ['colored', 'coloured'],
  ['gray', 'grey'],
  ['mold', 'mould'],
  ['molded', 'moulded'],
  ['plow', 'plough'],
  ['caliber', 'calibre'],
  ['fiber', 'fibre'],
  ['enameled', 'enamelled'],
  ['center', 'centre'],
  ['theater', 'theatre'],
  ['harbor', 'harbour'],
  ['woolen', 'woollen'],
  ['traveling', 'travelling'],
  ['checkered', 'chequered'],
  ['mustache', 'moustache'],
  ['artifact', 'artefact'],
  ['specter', 'spectre'],
  ['scepter', 'sceptre'],
  ['miter', 'mitre'],
  ['luster', 'lustre'],
  ['ocher', 'ochre'],
  ['carburetor', 'carburettor'],
  ['aluminum', 'aluminium'],
  ['defense', 'defence'],
];

const toUk = new Map<string, string>();
const toUs = new Map<string, string>();
for (const [us, uk] of SPELLINGS) {
  if (us === uk) continue;
  toUk.set(us, uk);
  toUs.set(uk, us);
}

/** Canonical (American) form of a single lowercase token. */
export function canonicalSpelling(token: string): string {
  return toUs.get(token) ?? token;
}

/** Rewrite every word of a query into the given dialect, preserving the rest. */
export function toDialect(query: string, dialect: Dialect): string {
  const map = dialect === 'uk' ? toUk : toUs;
  return query.replace(/[A-Za-z]+/g, (word) => {
    const swap = map.get(word.toLowerCase());
    if (!swap) return word;
    return word[0] === word[0].toUpperCase() ? swap[0].toUpperCase() + swap.slice(1) : swap;
  });
}

/** Families of related object names. First entry is the general term. */
const RELATED_GROUPS: string[][] = [
  // Head protection
  ['helmet', 'helm', 'sallet', 'bascinet', 'barbute', 'armet', 'kettle hat', 'great helm', 'close helmet', 'burgonet', 'morion', 'cabasset', 'spangenhelm', 'nasal helmet'],
  ['roman helmet', 'galea', 'cassis', 'coolus', 'montefortino'],
  // Body armour
  ['armor', 'harness', 'cuirass', 'breastplate', 'backplate', 'brigandine', 'coat of plates', 'corslet'],
  ['mail', 'chainmail', 'maille', 'hauberk', 'haubergeon', 'byrnie', 'mail shirt', 'coif'],
  ['gambeson', 'aketon', 'arming doublet', 'pourpoint', 'padded jack', 'jupon'],
  ['gauntlet', 'mitten gauntlet', 'vambrace', 'couter', 'rerebrace', 'pauldron', 'spaulder', 'besagew'],
  ['leg armor', 'cuisse', 'poleyn', 'greave', 'sabaton', 'tasset'],
  ['gorget', 'bevor', 'aventail', 'collar'],
  ['lorica', 'lorica segmentata', 'lorica hamata', 'lorica squamata'],
  ['shield', 'buckler', 'targe', 'pavise', 'heater shield', 'kite shield', 'scutum', 'rotella'],
  ['horse armor', 'shaffron', 'bard', 'crinet', 'spur', 'stirrup', 'bit', 'saddle'],
  // Edged weapons
  ['sword', 'longsword', 'arming sword', 'broadsword', 'falchion', 'messer', 'backsword', 'estoc', 'claymore', 'hanger'],
  ['rapier', 'smallsword', 'side sword', 'cup-hilt rapier', 'main gauche'],
  ['saber', 'cutlass', 'scimitar', 'shamshir', 'hussar saber', 'briquet'],
  ['roman sword', 'gladius', 'spatha', 'pugio'],
  ['dagger', 'rondel dagger', 'ballock dagger', 'baselard', 'dirk', 'stiletto', 'seax', 'knife', 'quillon dagger'],
  ['sword fittings', 'pommel', 'hilt', 'scabbard', 'chape', 'crossguard', 'sword belt', 'baldric'],
  // Staff weapons & blunt
  ['polearm', 'halberd', 'pike', 'spear', 'lance', 'glaive', 'bill', 'partisan', 'poleaxe', 'spontoon', 'pilum'],
  ['axe', 'battle axe', 'hatchet', 'tomahawk', 'bearded axe', 'francisca'],
  ['mace', 'war hammer', 'flail', 'morning star', 'club'],
  // Missile weapons
  ['bow', 'longbow', 'crossbow', 'arrow', 'arrowhead', 'quiver', 'bolt', 'bracer', 'cranequin'],
  ['firearm', 'musket', 'matchlock', 'wheellock', 'flintlock', 'arquebus', 'caliver', 'fusil', 'carbine', 'rifle', 'pistol', 'blunderbuss', 'percussion rifle'],
  ['shooting accessories', 'powder flask', 'powder horn', 'bandolier', 'cartridge box', 'bullet mould', 'bayonet', 'ramrod'],
  ['cannon', 'artillery', 'mortar', 'swivel gun', 'bombard'],
  // Clothing — medieval / early modern
  ['tunic', 'kirtle', 'cote', 'cotehardie', 'surcoat', 'houppelande', 'tabard', 'smock'],
  ['doublet', 'jerkin', 'jacket', 'waistcoat', 'buff coat', 'cassock'],
  ['hose', 'chausses', 'braies', 'breeches', 'trunk hose', 'stockings', 'garter'],
  ['gown', 'dress', 'robe', 'mantua', 'petticoat', 'bodice', 'stays', 'corset', 'farthingale'],
  ['cloak', 'mantle', 'cape', 'greatcoat', 'plaid'],
  ['headwear', 'hat', 'cap', 'coif', 'hood', 'chaperon', 'bonnet', 'wimple', 'veil', 'hennin', 'tricorne', 'bicorne'],
  ['shoe', 'boot', 'turnshoe', 'patten', 'poulaine', 'sandal', 'caligae', 'latchet shoe', 'buckle shoe'],
  ['roman dress', 'toga', 'tunica', 'stola', 'palla', 'paenula', 'sagum'],
  ['linen', 'shirt', 'shift', 'chemise', 'cravat', 'ruff', 'collar', 'cuff'],
  // Military uniform 18th–20th c.
  ['uniform', 'coatee', 'frock coat', 'shell jacket', 'tunic', 'regimental coat', 'pelisse', 'dolman', 'greatcoat'],
  ['military headdress', 'shako', 'kepi', 'forage cap', 'busby', 'bearskin', 'czapka', 'pickelhaube', 'slouch hat', 'brodie helmet'],
  ['accoutrements', 'haversack', 'knapsack', 'canteen', 'cartridge box', 'crossbelt', 'belt plate', 'gorget', 'epaulette', 'sash'],
  ['insignia', 'button', 'badge', 'medal', 'cockade', 'shoulder strap', 'chevron'],
  // Dress accessories & small finds
  ['brooch', 'fibula', 'penannular brooch', 'ring brooch', 'cloak pin', 'annular brooch', 'disc brooch'],
  ['belt', 'buckle', 'strap end', 'belt mount', 'girdle', 'belt fitting', 'chape'],
  ['purse', 'pouch', 'scrip', 'bag', 'sporran', 'wallet', 'chatelaine'],
  ['jewelry', 'ring', 'pendant', 'necklace', 'bracelet', 'torc', 'bead', 'signet ring', 'arm ring'],
  ['badge', 'pilgrim badge', 'livery badge', 'token', 'seal matrix', 'ampulla'],
  ['comb', 'mirror', 'tweezers', 'ear scoop', 'razor', 'toilet set'],
  // Textiles
  ['textile', 'fabric', 'cloth', 'wool', 'linen', 'silk', 'velvet', 'damask', 'brocade', 'fustian'],
  ['needlework', 'embroidery', 'tapestry', 'tablet weaving', 'braid', 'lace', 'sampler'],
  ['textile tools', 'spindle whorl', 'loom weight', 'distaff', 'needle', 'thimble', 'shears', 'spinning wheel'],
  // Domestic & camp life
  ['tableware', 'bowl', 'cup', 'tankard', 'goblet', 'beaker', 'trencher', 'plate', 'spoon', 'jug', 'flagon', 'mazer', 'costrel'],
  ['cookware', 'cauldron', 'skillet', 'pipkin', 'kettle', 'trivet', 'ladle', 'spit', 'gridiron'],
  ['pottery', 'ceramics', 'earthenware', 'stoneware', 'porcelain', 'amphora', 'samian ware', 'bellarmine'],
  ['lighting', 'lantern', 'candlestick', 'oil lamp', 'rushlight', 'cresset'],
  ['furniture', 'chest', 'stool', 'bench', 'trestle table', 'chair', 'coffer', 'cabinet'],
  ['tent', 'pavilion', 'camp bed', 'campaign furniture'],
  ['tools', 'hammer', 'tongs', 'anvil', 'adze', 'chisel', 'plane', 'auger', 'awl'],
  ['writing', 'manuscript', 'wax tablet', 'stylus', 'inkwell', 'quill', 'seal', 'book of hours'],
  ['games', 'gaming piece', 'dice', 'chess piece', 'playing cards', 'hnefatafl'],
  ['musical instrument', 'lute', 'horn', 'drum', 'fife', 'bugle', 'pipe', 'harp', 'trumpet'],
  ['coin', 'penny', 'groat', 'denarius', 'token', 'jetton', 'medal'],
  // Imagery used as evidence
  ['depiction', 'portrait', 'effigy', 'brass rubbing', 'illumination', 'fashion plate', 'engraving', 'miniature', 'photograph', 'daguerreotype'],
  // Cultures & eras
  ['viking', 'norse', 'scandinavian', 'anglo-scandinavian'],
  ['anglo-saxon', 'saxon', 'early medieval', 'migration period', 'frankish', 'merovingian'],
  ['medieval', 'gothic', 'norman', 'plantagenet'],
  ['roman', 'romano-british', 'imperial roman', 'late roman'],
  ['celtic', 'iron age', 'la tène', 'gallic'],
  ['renaissance', 'tudor', 'elizabethan', 'landsknecht'],
  ['stuart', 'jacobean', 'english civil war', 'thirty years war', 'cavalier'],
  ['georgian', 'napoleonic', 'regency', 'revolutionary war', 'continental army'],
  ['victorian', 'american civil war', 'crimean war', 'union army', 'confederate'],
  ['samurai', 'japanese armor', 'kabuto', 'katana', 'wakizashi', 'tsuba', 'do'],
];

const relatedIndex = new Map<string, Set<string>>();
const vocabulary = new Set<string>();

for (const group of RELATED_GROUPS) {
  for (const term of group) {
    const key = term.toLowerCase();
    for (const word of key.split(/\s+/)) if (word.length >= 4) vocabulary.add(word);
    let set = relatedIndex.get(key);
    if (!set) relatedIndex.set(key, (set = new Set()));
    for (const other of group) if (other !== term) set.add(other.toLowerCase());
  }
}
for (const [us, uk] of SPELLINGS) {
  vocabulary.add(us);
  vocabulary.add(uk);
}

function singular(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 4 && /(ches|shes|sses|xes)$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) {
    return word.slice(0, -1);
  }
  return word;
}

/** Light normalisation used for matching: lowercase, singular, US spelling. */
export function normalizeTerm(word: string): string {
  const lower = word.toLowerCase();
  return canonicalSpelling(singular(canonicalSpelling(lower)));
}

function lookupKey(term: string): string {
  return term
    .toLowerCase()
    .split(/\s+/)
    .map((w) => canonicalSpelling(w))
    .join(' ');
}

/** Related object names for a term (empty when the term is not in the lexicon). */
export function relatedTerms(term: string): string[] {
  const key = lookupKey(term);
  const hit =
    relatedIndex.get(key) ??
    relatedIndex.get(key.split(' ').map(singular).join(' '));
  return hit ? [...hit] : [];
}

/**
 * Related searches for a whole query: for each recognised term (longest phrase
 * first) swap it for its relatives, keeping the rest of the query intact.
 * "viking sword" → "viking seax", "norse sword", …
 */
export function relatedSearches(query: string, limit = 10): string[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const perTerm: string[][] = [];

  let i = 0;
  while (i < words.length) {
    let matched = false;
    for (const len of [3, 2, 1]) {
      if (i + len > words.length) continue;
      const phrase = words.slice(i, i + len).join(' ');
      const related = relatedTerms(phrase);
      if (related.length > 0) {
        const before = words.slice(0, i).join(' ');
        const after = words.slice(i + len).join(' ');
        perTerm.push(related.map((r) => [before, r, after].filter(Boolean).join(' ')));
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) i++;
  }

  // Round-robin across the recognised terms so each gets a share of the slots.
  // Object names come last in a query ("viking sword"), so start from the end.
  perTerm.reverse();
  const out: string[] = [];
  const seen = new Set([words.join(' ')]);
  for (let n = 0; out.length < limit && perTerm.some((list) => n < list.length); n++) {
    for (const list of perTerm) {
      const candidate = list[n];
      if (candidate && !seen.has(candidate) && out.length < limit) {
        seen.add(candidate);
        out.push(candidate);
      }
    }
  }
  return out;
}

export function editDistance(a: string, b: string, max = Infinity): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > max) return max + 1;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    let best = row[0];
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, row[j - 1], row[j]);
      prev = tmp;
      if (row[j] < best) best = row[j];
    }
    if (best > max) return max + 1;
  }
  return row[n];
}

/**
 * Suggest a corrected query when a word looks like a typo of a lexicon term
 * ("bascinett" → "bascinet", "swrod" → "sword"). Returns null if nothing to fix.
 */
export function suggestCorrection(query: string): string | null {
  let changed = false;
  const corrected = query.split(/\s+/).map((word) => {
    const lower = word.toLowerCase();
    if (lower.length < 5 || !/^[a-z]+$/.test(lower)) return word;
    if (vocabulary.has(lower) || vocabulary.has(singular(lower))) return word;
    const max = lower.length >= 8 ? 2 : 1;
    let best: string | null = null;
    let bestDist = max + 1;
    for (const candidate of vocabulary) {
      if (candidate[0] !== lower[0] && candidate[1] !== lower[1]) continue;
      const d = damerau(lower, candidate, max);
      if (d < bestDist) {
        bestDist = d;
        best = candidate;
      }
    }
    if (best) {
      changed = true;
      return best;
    }
    return word;
  });
  return changed ? corrected.join(' ') : null;
}

/** Edit distance that counts an adjacent transposition ("swrod") as one edit. */
function damerau(a: string, b: string, max: number): number {
  const d = editDistance(a, b, max + 1);
  if (d <= 1) return d;
  if (a.length === b.length) {
    for (let i = 0; i < a.length - 1; i++) {
      if (a[i] !== b[i]) {
        const swapped = a.slice(0, i) + a[i + 1] + a[i] + a.slice(i + 2);
        if (swapped === b) return 1;
        break;
      }
    }
  }
  return d;
}
