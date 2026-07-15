import { useEffect, useRef, useState } from "react";
import { SYMBOLS, spinReel, evaluateSpin, type SlotSymbol } from "../lib/slots";
import { useChips } from "../context/ChipsContext";
import "./Slots.css";

const BET_STEPS = [5, 10, 25, 50];
const REEL_STOP_DELAYS = [900, 1300, 1750];
const SPIN_TICK_MS = 70;

export function Slots() {
  const { balance, adjustBalance } = useChips();
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState<SlotSymbol[]>([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
  const [spinningFlags, setSpinningFlags] = useState([false, false, false]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState("Set your bet and pull the lever.");
  const [messageTone, setMessageTone] = useState<"win" | "lose" | "">("");
  const intervalsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      intervalsRef.current.forEach((id) => clearInterval(id));
    };
  }, []);

  function spin() {
    if (isSpinning || bet <= 0 || bet > balance) return;
    adjustBalance(-bet);
    setIsSpinning(true);
    setSpinningFlags([true, true, true]);
    setMessage("Spinning…");
    setMessageTone("");

    const finalSymbols: SlotSymbol[] = [spinReel(), spinReel(), spinReel()];

    [0, 1, 2].forEach((reelIndex) => {
      const intervalId = window.setInterval(() => {
        setReels((prev) => {
          const next = [...prev];
          next[reelIndex] = spinReel();
          return next;
        });
      }, SPIN_TICK_MS);
      intervalsRef.current.push(intervalId);

      window.setTimeout(() => {
        clearInterval(intervalId);
        setReels((prev) => {
          const next = [...prev];
          next[reelIndex] = finalSymbols[reelIndex];
          return next;
        });
        setSpinningFlags((prev) => {
          const next = [...prev];
          next[reelIndex] = false;
          return next;
        });

        if (reelIndex === 2) {
          const { multiplier, description } = evaluateSpin(finalSymbols);
          if (multiplier > 0) {
            const payout = bet * multiplier;
            adjustBalance(payout);
            setMessage(`${description} — paid ${payout} chips (${multiplier}x).`);
            setMessageTone("win");
          } else {
            setMessage("No match — try again.");
            setMessageTone("lose");
          }
          setIsSpinning(false);
        }
      }, REEL_STOP_DELAYS[reelIndex]);
    });
  }

  const canSpin = !isSpinning && bet > 0 && bet <= balance;

  return (
    <div className="slots">
      <p className="eyebrow">Table 3 — Slots</p>
      <h1 className="slots__title">Diamond Reels</h1>

      <div className="slot-machine">
        <div className="slot-machine__marquee">
          <span>💎 JACKPOT ON TRIPLE SEVENS 💎</span>
        </div>

        <div className="slot-machine__window">
          {reels.map((symbol, i) => (
            <div key={i} className={`reel ${spinningFlags[i] ? "is-spinning" : ""}`}>
              <span className="reel__symbol">{symbol.glyph}</span>
            </div>
          ))}
        </div>

        <div className="slot-machine__lever-row">
          <div className="bet-row">
            <span className="bet-row__label">Bet</span>
            {BET_STEPS.map((step) => (
              <button
                key={step}
                type="button"
                className={`chip-button ${bet === step ? "is-selected" : ""}`}
                onClick={() => setBet(step)}
                disabled={step > balance || isSpinning}
              >
                {step}
              </button>
            ))}
          </div>
          <button type="button" className="primary-button lever-button" onClick={spin} disabled={!canSpin}>
            {isSpinning ? "Spinning…" : "Pull lever"}
          </button>
        </div>
      </div>

      <p className={`slots__message ${messageTone ? `is-${messageTone}` : ""}`}>{message}</p>

      <div className="paytable">
        <p className="eyebrow">Paytable (× bet)</p>
        <div className="paytable__grid">
          {SYMBOLS.map((s) => (
            <div key={s.id} className="paytable__row">
              <span className="paytable__glyphs">
                {s.glyph}
                {s.glyph}
                {s.glyph}
              </span>
              <span className="paytable__name">{s.name}</span>
              <span className="paytable__value">{s.payout3}x</span>
            </div>
          ))}
        </div>
        <p className="paytable__note">Cherries also pay 1x for any two adjacent from the left.</p>
      </div>
    </div>
  );
}
