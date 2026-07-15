export type PocketColor = "red" | "black" | "green";

// European single-zero wheel, in physical wheel order (not numeric order) —
// this is what makes the spin animation land correctly on the segment layout.
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export function colorOf(n: number): PocketColor {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

export type BetType =
  | { kind: "number"; value: number }
  | { kind: "color"; value: "red" | "black" }
  | { kind: "parity"; value: "odd" | "even" }
  | { kind: "range"; value: "low" | "high" };

export function betPayoutMultiplier(bet: BetType): number {
  return bet.kind === "number" ? 35 : 1;
}

export function betWins(bet: BetType, result: number): boolean {
  if (result === 0) return bet.kind === "number" && bet.value === 0;
  switch (bet.kind) {
    case "number":
      return bet.value === result;
    case "color":
      return colorOf(result) === bet.value;
    case "parity":
      return bet.value === "odd" ? result % 2 === 1 : result % 2 === 0;
    case "range":
      return bet.value === "low" ? result <= 18 : result >= 19;
  }
}

export function describeBet(bet: BetType): string {
  switch (bet.kind) {
    case "number":
      return `Number ${bet.value}`;
    case "color":
      return bet.value === "red" ? "Red" : "Black";
    case "parity":
      return bet.value === "odd" ? "Odd" : "Even";
    case "range":
      return bet.value === "low" ? "1–18" : "19–36";
  }
}
