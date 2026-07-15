import { useMemo, useState } from "react";
import {
  WHEEL_ORDER,
  colorOf,
  betPayoutMultiplier,
  betWins,
  describeBet,
  type BetType,
} from "../lib/roulette";
import { useChips } from "../context/ChipsContext";
import "./Roulette.css";

const BET_STEPS = [10, 25, 50, 100];
const POCKET_ANGLE = 360 / WHEEL_ORDER.length;
const SPIN_DURATION_MS = 3600;

const COLOR_HEX: Record<string, string> = {
  red: "#7a1f2b",
  black: "#151515",
  green: "#0b6e3f",
};

function buildWheelGradient(): string {
  const stops = WHEEL_ORDER.map((n, i) => {
    const from = (i * POCKET_ANGLE).toFixed(3);
    const to = ((i + 1) * POCKET_ANGLE).toFixed(3);
    return `${COLOR_HEX[colorOf(n)]} ${from}deg ${to}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export function Roulette() {
  const { balance, adjustBalance } = useChips();
  const wheelGradient = useMemo(buildWheelGradient, []);

  const [bet, setBet] = useState<BetType>({ kind: "color", value: "red" });
  const [amount, setAmount] = useState(25);
  const [numberInput, setNumberInput] = useState("17");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState("Place your bet and spin the wheel.");
  const [messageTone, setMessageTone] = useState<"win" | "lose" | "">("");

  const canSpin = !spinning && amount > 0 && amount <= balance;

  function spin() {
    if (!canSpin) return;
    setSpinning(true);
    setResult(null);
    setMessage("No more bets…");
    setMessageTone("");

    const winningIndex = Math.floor(Math.random() * WHEEL_ORDER.length);
    const winningNumber = WHEEL_ORDER[winningIndex];
    const extraSpins = 4 + Math.floor(Math.random() * 3);
    const withinPocketJitter = Math.random() * POCKET_ANGLE * 0.7 + POCKET_ANGLE * 0.15;
    const targetDeg =
      extraSpins * 360 + (360 - winningIndex * POCKET_ANGLE - withinPocketJitter);

    setRotation((prev) => prev + targetDeg);

    window.setTimeout(() => {
      setSpinning(false);
      setResult(winningNumber);
      const won = betWins(bet, winningNumber);
      const color = colorOf(winningNumber);
      if (won) {
        const payout = amount * betPayoutMultiplier(bet);
        adjustBalance(payout);
        setMessage(`${winningNumber} (${color}) — you won ${payout} chips.`);
        setMessageTone("win");
      } else {
        adjustBalance(-amount);
        setMessage(`${winningNumber} (${color}) — no match, lost ${amount} chips.`);
        setMessageTone("lose");
      }
    }, SPIN_DURATION_MS);
  }

  function selectNumberBet() {
    const n = Number(numberInput);
    if (Number.isInteger(n) && n >= 0 && n <= 36) {
      setBet({ kind: "number", value: n });
    }
  }

  return (
    <div className="roulette">
      <p className="eyebrow">Table 2 — Roulette</p>
      <h1 className="roulette__title">Roulette</h1>

      <div className="roulette-layout">
        <div className="wheel-wrap">
          <div className="wheel-pointer" aria-hidden="true" />
          <div
            className="wheel"
            style={{
              backgroundImage: wheelGradient,
              transform: `rotate(${rotation}deg)`,
              transitionDuration: `${SPIN_DURATION_MS}ms`,
            }}
          />
          <div className="wheel-hub">{result === null ? "?" : result}</div>
        </div>

        <div className="table roulette-controls">
          <div className="bet-type-grid">
            <button
              type="button"
              className={`bet-type ${bet.kind === "color" && bet.value === "red" ? "is-selected" : ""}`}
              onClick={() => setBet({ kind: "color", value: "red" })}
              style={{ borderColor: bet.kind === "color" && bet.value === "red" ? "var(--gold)" : undefined }}
            >
              Red
            </button>
            <button
              type="button"
              className={`bet-type ${bet.kind === "color" && bet.value === "black" ? "is-selected" : ""}`}
              onClick={() => setBet({ kind: "color", value: "black" })}
            >
              Black
            </button>
            <button
              type="button"
              className={`bet-type ${bet.kind === "parity" && bet.value === "odd" ? "is-selected" : ""}`}
              onClick={() => setBet({ kind: "parity", value: "odd" })}
            >
              Odd
            </button>
            <button
              type="button"
              className={`bet-type ${bet.kind === "parity" && bet.value === "even" ? "is-selected" : ""}`}
              onClick={() => setBet({ kind: "parity", value: "even" })}
            >
              Even
            </button>
            <button
              type="button"
              className={`bet-type ${bet.kind === "range" && bet.value === "low" ? "is-selected" : ""}`}
              onClick={() => setBet({ kind: "range", value: "low" })}
            >
              1–18
            </button>
            <button
              type="button"
              className={`bet-type ${bet.kind === "range" && bet.value === "high" ? "is-selected" : ""}`}
              onClick={() => setBet({ kind: "range", value: "high" })}
            >
              19–36
            </button>
          </div>

          <div className="number-bet-row">
            <label htmlFor="number-bet">Straight number (pays 35:1)</label>
            <div className="number-bet-row__inputs">
              <input
                id="number-bet"
                type="number"
                min={0}
                max={36}
                value={numberInput}
                onChange={(e) => setNumberInput(e.target.value)}
              />
              <button
                type="button"
                className={`secondary-button ${bet.kind === "number" ? "is-selected" : ""}`}
                onClick={selectNumberBet}
              >
                Bet this number
              </button>
            </div>
          </div>

          <hr className="divider" />

          <div className="bet-row">
            <span className="bet-row__label">Amount</span>
            {BET_STEPS.map((step) => (
              <button
                key={step}
                type="button"
                className={`chip-button ${amount === step ? "is-selected" : ""}`}
                onClick={() => setAmount(step)}
                disabled={step > balance}
              >
                {step}
              </button>
            ))}
          </div>

          <p className="roulette__current-bet">
            Betting <strong>{amount}</strong> on <strong>{describeBet(bet)}</strong>
          </p>

          <button type="button" className="primary-button" onClick={spin} disabled={!canSpin}>
            {spinning ? "Spinning…" : "Spin"}
          </button>
        </div>
      </div>

      <p className={`roulette__message ${messageTone ? `is-${messageTone}` : ""}`}>{message}</p>
    </div>
  );
}
