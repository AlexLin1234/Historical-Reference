import type { NormalizedArtifact, MuseumSource } from '@/types/artifact';
import { tokenize } from './query';
import { normalizeTerm } from './lexicon';

/**
 * How each app category maps onto each museum's own filter vocabulary.
 * Where a museum has no usable server-side filter the entry is omitted and
 * results are filtered in the browser with CATEGORY_KEYWORDS instead.
 */
export interface CategoryMapping {
  met?: { departmentId?: number; medium?: string };
  cleveland?: { type: string };
  harvard?: { classification: string };
  chicago?: { artworkTypes: string[] };
  va?: { categoryId: string };
}

export const CATEGORY_MAP: Record<string, CategoryMapping> = {
  'arms-armor': {
    met: { departmentId: 4 },
    cleveland: { type: 'Arms and Armor' },
    harvard: { classification: 'Armor|Weapons and Ammunition' },
    chicago: { artworkTypes: ['Arms', 'Armor'] },
  },
  textiles: {
    met: { medium: 'Textiles' },
    cleveland: { type: 'Textile' },
    harvard: { classification: 'Textile Arts' },
    chicago: { artworkTypes: ['Textile', 'Costume and Accessories'] },
  },
  ceramics: {
    met: { medium: 'Ceramics' },
    cleveland: { type: 'Ceramic' },
    chicago: { artworkTypes: ['Ceramics', 'Vessel'] },
  },
  metalwork: {
    cleveland: { type: 'Metalwork' },
    chicago: { artworkTypes: ['Metalwork'] },
  },
  furniture: {
    met: { medium: 'Furniture' },
    cleveland: { type: 'Furniture and woodwork' },
    harvard: { classification: 'Furniture' },
    chicago: { artworkTypes: ['Furniture'] },
  },
  paintings: {
    met: { medium: 'Paintings' },
    cleveland: { type: 'Painting' },
    harvard: { classification: 'Paintings' },
    chicago: { artworkTypes: ['Painting'] },
  },
  sculpture: {
    met: { medium: 'Sculpture' },
    cleveland: { type: 'Sculpture' },
    harvard: { classification: 'Sculpture' },
    chicago: { artworkTypes: ['Sculpture'] },
  },
  prints: {
    met: { departmentId: 9 },
    cleveland: { type: 'Print' },
    harvard: { classification: 'Prints|Drawings' },
    chicago: { artworkTypes: ['Print', 'Drawing and Watercolor'] },
  },
};

/** Words that identify a category from a record's own descriptive fields. */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'arms-armor': [
    'arm', 'armor', 'weapon', 'sword', 'dagger', 'helmet', 'shield', 'firearm', 'gun', 'pistol',
    'musket', 'rifle', 'saber', 'rapier', 'halberd', 'spear', 'lance', 'mace', 'axe', 'bow',
    'crossbow', 'cannon', 'bayonet', 'gauntlet', 'cuirass', 'breastplate', 'mail', 'sallet',
    'scabbard', 'hilt', 'knife', 'edged', 'militaria', 'ammunition', 'spur', 'polearm',
  ],
  textiles: [
    'textile', 'costume', 'clothing', 'dress', 'fashion', 'garment', 'embroidery', 'tapestry',
    'lace', 'fabric', 'gown', 'coat', 'uniform', 'hat', 'shoe', 'glove', 'weaving', 'woven',
    'silk', 'wool', 'linen', 'cotton', 'velvet', 'sampler', 'quilt', 'needlework', 'apparel',
    'accessory', 'headwear', 'footwear', 'waistcoat', 'jacket', 'bodice', 'robe',
  ],
  ceramics: [
    'ceramic', 'pottery', 'porcelain', 'earthenware', 'stoneware', 'terracotta', 'faience',
    'maiolica', 'majolica', 'delftware', 'vessel', 'tile',
  ],
  metalwork: [
    'metalwork', 'silver', 'gold', 'bronze', 'brass', 'pewter', 'iron', 'copper', 'steel',
    'goldsmith', 'silversmith', 'jewelry', 'enamel', 'metal',
  ],
  furniture: ['furniture', 'chair', 'table', 'chest', 'cabinet', 'bed', 'stool', 'desk', 'woodwork', 'coffer', 'bench', 'cupboard'],
  paintings: ['painting', 'oil', 'tempera', 'canvas', 'panel', 'miniature', 'watercolor', 'fresco', 'portrait'],
  sculpture: ['sculpture', 'statue', 'statuette', 'figure', 'figurine', 'relief', 'bust', 'carving', 'effigy'],
  prints: ['print', 'engraving', 'etching', 'woodcut', 'lithograph', 'drawing', 'mezzotint', 'aquatint', 'sketch', 'illustration'],
};

const keywordSets = new Map(
  Object.entries(CATEGORY_KEYWORDS).map(([k, words]) => [k, new Set(words.map(normalizeTerm))])
);

function categoryTokens(a: NormalizedArtifact): string[] {
  // Structured fields first; the title is a fallback for sparse records.
  return tokenize(
    [a.classification, a.objectType, a.department, a.medium, a.title].filter(Boolean).join(' ')
  ).map(normalizeTerm);
}

export function matchesCategory(artifact: NormalizedArtifact, category: string): boolean {
  const set = keywordSets.get(category);
  if (!set) return true;
  return categoryTokens(artifact).some((t) => set.has(t));
}

export function hasServerCategory(source: MuseumSource, category: string | null): boolean {
  if (!category) return true;
  return Boolean(CATEGORY_MAP[category]?.[source as keyof CategoryMapping]);
}

// ── Kit slots (where a piece sits in a reenactor's kit) ─────────────────────

export const KIT_SLOTS = [
  'Headwear & helmets',
  'Body armour',
  'Clothing',
  'Footwear & legwear',
  'Weapons',
  'Belts, bags & accessories',
  'Jewellery & dress fittings',
  'Camp & domestic',
  'Pictorial evidence',
  'Other references',
] as const;

export type KitSlot = (typeof KIT_SLOTS)[number];

const SLOT_KEYWORDS: [KitSlot, string[]][] = [
  ['Pictorial evidence', ['painting', 'print', 'engraving', 'etching', 'woodcut', 'drawing', 'photograph', 'daguerreotype', 'portrait', 'manuscript', 'illumination', 'miniature', 'effigy', 'lithograph', 'tapestry', 'fresco', 'statue', 'sculpture', 'relief']],
  ['Headwear & helmets', ['helmet', 'helm', 'sallet', 'bascinet', 'armet', 'barbute', 'burgonet', 'morion', 'cabasset', 'hat', 'cap', 'coif', 'hood', 'bonnet', 'shako', 'kepi', 'busby', 'tricorne', 'bicorne', 'headdress', 'veil', 'wimple', 'chaperon', 'headwear', 'kabuto']],
  ['Body armour', ['armor', 'cuirass', 'breastplate', 'backplate', 'mail', 'hauberk', 'brigandine', 'gauntlet', 'vambrace', 'pauldron', 'gorget', 'bevor', 'tasset', 'corslet', 'lorica', 'shield', 'buckler', 'pavise', 'gambeson', 'jack', 'harness']],
  ['Footwear & legwear', ['shoe', 'boot', 'sandal', 'patten', 'turnshoe', 'poulaine', 'hose', 'stocking', 'breeches', 'trousers', 'chausses', 'greave', 'sabaton', 'cuisse', 'poleyn', 'gaiter', 'spur', 'footwear', 'caligae']],
  ['Weapons', ['sword', 'dagger', 'knife', 'saber', 'rapier', 'falchion', 'seax', 'gladius', 'spear', 'lance', 'pike', 'halberd', 'polearm', 'axe', 'mace', 'hammer', 'bow', 'crossbow', 'arrow', 'musket', 'rifle', 'pistol', 'gun', 'firearm', 'carbine', 'bayonet', 'cannon', 'scabbard', 'hilt', 'pommel', 'weapon', 'katana', 'smallsword', 'cutlass', 'dirk']],
  ['Jewellery & dress fittings', ['brooch', 'fibula', 'ring', 'pendant', 'necklace', 'bracelet', 'torc', 'bead', 'buckle', 'button', 'badge', 'pin', 'clasp', 'jewelry', 'medal', 'mount', 'aglet', 'cockade', 'epaulette']],
  ['Belts, bags & accessories', ['belt', 'girdle', 'purse', 'pouch', 'bag', 'haversack', 'knapsack', 'canteen', 'flask', 'bandolier', 'baldric', 'glove', 'fan', 'comb', 'mirror', 'sash', 'cartridge', 'sporran', 'chatelaine', 'spectacles', 'watch']],
  ['Clothing', ['tunic', 'gown', 'dress', 'robe', 'doublet', 'jerkin', 'coat', 'jacket', 'waistcoat', 'cloak', 'mantle', 'cape', 'shirt', 'shift', 'chemise', 'kirtle', 'surcoat', 'tabard', 'uniform', 'costume', 'garment', 'bodice', 'stays', 'corset', 'petticoat', 'skirt', 'toga', 'textile', 'clothing', 'apron', 'coatee', 'frock', 'suit', 'ensemble', 'vest']],
  ['Camp & domestic', ['bowl', 'cup', 'jug', 'tankard', 'goblet', 'spoon', 'plate', 'dish', 'pot', 'cauldron', 'kettle', 'lantern', 'candlestick', 'lamp', 'chest', 'stool', 'chair', 'table', 'tent', 'tool', 'needle', 'thimble', 'shears', 'whorl', 'coin', 'die', 'dice', 'pipe', 'bottle', 'vessel', 'key', 'lock', 'bucket', 'flagon', 'beaker', 'trencher', 'costrel', 'furniture', 'ceramic', 'pottery', 'instrument']],
];

const slotSets = SLOT_KEYWORDS.map(([slot, words]) => [slot, new Set(words.map(normalizeTerm))] as const);

/** Best-guess kit slot from the object's type and title. */
export function guessKitSlot(a: NormalizedArtifact): KitSlot {
  const primary = tokenize([a.objectType, a.classification].filter(Boolean).join(' ')).map(normalizeTerm);
  const title = tokenize(a.title).map(normalizeTerm);
  for (const tokens of [primary, title]) {
    for (const [slot, set] of slotSets) {
      if (tokens.some((t) => set.has(t))) return slot;
    }
  }
  return 'Other references';
}
