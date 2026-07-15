import type { PlayingCard } from "./deck";
import { isRed } from "./deck";

export function handValue(hand: PlayingCard[]): number {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.rank === "A") {
      aces += 1;
      total += 11;
    } else if (card.rank === "K" || card.rank === "Q" || card.rank === "J") {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

export function isBlackjack(hand: PlayingCard[]): boolean {
  return hand.length === 2 && handValue(hand) === 21;
}

export function isSoft17(hand: PlayingCard[]): boolean {
  // A hand counts as "soft" if an ace is still being counted as 11.
  const hard = hand.reduce((sum, c) => {
    if (c.rank === "A") return sum + 1;
    if (c.rank === "K" || c.rank === "Q" || c.rank === "J") return sum + 10;
    return sum + Number(c.rank);
  }, 0);
  const hasAce = hand.some((c) => c.rank === "A");
  return handValue(hand) === 17 && hasAce && hard !== 17;
}

// ---------- Side bet: Perfect Pairs ----------
// Requires the player's first two cards. Evaluated the moment the hand is dealt.

export type PerfectPairsResult = { name: string; multiplier: number } | null;

export function evaluatePerfectPairs(cards: [PlayingCard, PlayingCard]): PerfectPairsResult {
  const [a, b] = cards;
  if (a.rank !== b.rank) return null;
  if (a.suit === b.suit) return { name: "Perfect Pair", multiplier: 40 };
  if (isRed(a.suit) === isRed(b.suit)) return { name: "Colored Pair", multiplier: 12 };
  return { name: "Mixed Pair", multiplier: 6 };
}

// ---------- Side bet: 21+3 ----------
// Player's first two cards plus the dealer's up card, scored as 3-card poker.

export type TwentyOnePlusThreeResult = { name: string; multiplier: number } | null;

const RANK_VALUE: Record<string, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

function isStraight(values: number[]): boolean {
  const sorted = [...values].sort((x, y) => x - y);
  const consecutive = sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1;
  // Ace can also play low, as in A-2-3.
  const lowAceSorted = values
    .map((v) => (v === 14 ? 1 : v))
    .sort((x, y) => x - y);
  const consecutiveLowAce =
    lowAceSorted[1] === lowAceSorted[0] + 1 && lowAceSorted[2] === lowAceSorted[1] + 1;
  return consecutive || consecutiveLowAce;
}

export function evaluateTwentyOnePlusThree(
  cards: [PlayingCard, PlayingCard, PlayingCard],
): TwentyOnePlusThreeResult {
  const suits = cards.map((c) => c.suit);
  const values = cards.map((c) => RANK_VALUE[c.rank]);
  const flush = suits.every((s) => s === suits[0]);
  const trips = values.every((v) => v === values[0]);
  const straight = isStraight(values);

  if (trips && flush) return { name: "Suited Trips", multiplier: 100 };
  if (straight && flush) return { name: "Straight Flush", multiplier: 40 };
  if (trips) return { name: "Three of a Kind", multiplier: 30 };
  if (straight) return { name: "Straight", multiplier: 10 };
  if (flush) return { name: "Flush", multiplier: 5 };
  return null;
}
