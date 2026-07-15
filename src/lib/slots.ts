export interface SlotSymbol {
  id: string;
  glyph: string;
  name: string;
  /** Higher weight = more common on the reel strip. */
  weight: number;
  /** Payout multiplier for landing three of this symbol. */
  payout3: number;
  /** Payout multiplier for landing two of this symbol (adjacent reels). */
  payout2: number;
}

export const SYMBOLS: SlotSymbol[] = [
  { id: "cherry", glyph: "🍒", name: "Cherry", weight: 28, payout3: 3, payout2: 1 },
  { id: "lemon", glyph: "🍋", name: "Lemon", weight: 24, payout3: 5, payout2: 0 },
  { id: "bell", glyph: "🔔", name: "Bell", weight: 18, payout3: 10, payout2: 0 },
  { id: "clover", glyph: "🍀", name: "Clover", weight: 14, payout3: 15, payout2: 0 },
  { id: "star", glyph: "⭐", name: "Star", weight: 10, payout3: 25, payout2: 0 },
  { id: "diamond", glyph: "💎", name: "Diamond", weight: 5, payout3: 50, payout2: 0 },
  { id: "seven", glyph: "7️⃣", name: "Seven", weight: 2, payout3: 100, payout2: 0 },
];

const WEIGHTED_POOL: SlotSymbol[] = SYMBOLS.flatMap((s) => Array(s.weight).fill(s));

export function spinReel(): SlotSymbol {
  return WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
}

export interface SpinResult {
  symbols: SlotSymbol[];
  multiplier: number;
  description: string;
}

export function evaluateSpin(symbols: SlotSymbol[]): { multiplier: number; description: string } {
  const [a, b, c] = symbols;
  if (a.id === b.id && b.id === c.id) {
    return { multiplier: a.payout3, description: `Triple ${a.name}!` };
  }
  if (a.id === b.id && a.payout2 > 0) {
    return { multiplier: a.payout2, description: `Pair of ${a.name}s` };
  }
  if (b.id === c.id && b.payout2 > 0) {
    return { multiplier: b.payout2, description: `Pair of ${b.name}s` };
  }
  return { multiplier: 0, description: "No match" };
}
