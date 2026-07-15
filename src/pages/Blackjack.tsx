import { useRef, useState } from "react";
import { createShoe, type PlayingCard } from "../lib/deck";
import {
  handValue,
  isBlackjack,
  evaluatePerfectPairs,
  evaluateTwentyOnePlusThree,
  type PerfectPairsResult,
  type TwentyOnePlusThreeResult,
} from "../lib/blackjack";
import { sleep } from "../lib/sleep";
import { Card } from "../components/Card";
import { useChips } from "../context/ChipsContext";
import "./Blackjack.css";

type Phase = "setup" | "dealing" | "player-turn" | "dealer-turn" | "round-over";
type HandStatus = "playing" | "stood" | "bust" | "blackjack" | "doubled";
type Outcome = "win" | "lose" | "push" | "blackjack";

interface HandConfig {
  bet: number;
  pp: number;
  plus3: number;
}

interface HandState extends HandConfig {
  seat: number;
  cards: PlayingCard[];
  status: HandStatus;
  ppResult?: PerfectPairsResult;
  plus3Result?: TwentyOnePlusThreeResult;
  outcome?: Outcome;
}

const MAX_HANDS = 7;
const DEAL_DELAY = 200;
const DEALER_DRAW_DELAY = 550;
const DECKS = 6;
const RESHUFFLE_THRESHOLD = 20;

function draw(shoe: PlayingCard[]): [PlayingCard, PlayingCard[]] {
  const source = shoe.length <= RESHUFFLE_THRESHOLD ? createShoe(DECKS) : shoe;
  const [card, ...rest] = source;
  return [card, rest];
}

function nextPlayableIndex(hands: HandState[], from: number): number {
  for (let i = from; i < hands.length; i++) {
    if (hands[i].status === "playing") return i;
  }
  return -1;
}

function computeOutcome(hand: HandState, dealerFinal: PlayingCard[]): { outcome: Outcome; payout: number } {
  const pTotal = handValue(hand.cards);
  const dTotal = handValue(dealerFinal);
  const playerBJ = hand.status === "blackjack";
  const dealerBJ = isBlackjack(dealerFinal);

  if (hand.status === "bust") return { outcome: "lose", payout: 0 };
  if (playerBJ && dealerBJ) return { outcome: "push", payout: hand.bet };
  if (playerBJ) return { outcome: "blackjack", payout: Math.round(hand.bet * 2.5) };
  if (dealerBJ) return { outcome: "lose", payout: 0 };
  if (dTotal > 21) return { outcome: "win", payout: hand.bet * 2 };
  if (pTotal > dTotal) return { outcome: "win", payout: hand.bet * 2 };
  if (pTotal < dTotal) return { outcome: "lose", payout: 0 };
  return { outcome: "push", payout: hand.bet };
}

export function Blackjack() {
  const { balance, adjustBalance } = useChips();
  const shoeRef = useRef<PlayingCard[]>(createShoe(DECKS));

  const [numHands, setNumHands] = useState(3);
  const [configs, setConfigs] = useState<HandConfig[]>(
    Array.from({ length: 3 }, () => ({ bet: 25, pp: 0, plus3: 0 })),
  );

  const [phase, setPhase] = useState<Phase>("setup");
  const [hands, setHands] = useState<HandState[]>([]);
  const [dealerCards, setDealerCards] = useState<PlayingCard[]>([]);
  const [revealDealer, setRevealDealer] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("Choose your hands and bets, then deal.");

  const totalWager = configs.reduce((sum, c) => sum + c.bet + c.pp + c.plus3, 0);
  const canDeal =
    phase === "setup" && totalWager > 0 && totalWager <= balance && configs.every((c) => c.bet > 0);

  function setHandCount(n: number) {
    const clamped = Math.max(1, Math.min(MAX_HANDS, n));
    setNumHands(clamped);
    setConfigs((prev) => {
      const next = [...prev];
      while (next.length < clamped) next.push({ bet: 25, pp: 0, plus3: 0 });
      return next.slice(0, clamped);
    });
  }

  function updateConfig(i: number, patch: Partial<HandConfig>) {
    setConfigs((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  async function dealRound() {
    if (!canDeal) return;
    setPhase("dealing");
    setRevealDealer(false);
    setMessage("Dealing…");
    adjustBalance(-totalWager);

    const seats: HandState[] = configs.map((c, i) => ({
      ...c,
      seat: i + 1,
      cards: [],
      status: "playing",
    }));
    let dCards: PlayingCard[] = [];

    setHands(seats.map((h) => ({ ...h })));
    setDealerCards([]);

    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < seats.length; i++) {
        const [card, rest] = draw(shoeRef.current);
        shoeRef.current = rest;
        seats[i] = { ...seats[i], cards: [...seats[i].cards, card] };
        setHands(seats.map((h) => ({ ...h })));
        await sleep(DEAL_DELAY);
      }
      const [card, rest] = draw(shoeRef.current);
      shoeRef.current = rest;
      dCards = [...dCards, card];
      setDealerCards([...dCards]);
      await sleep(DEAL_DELAY + 60);
    }

    let sideBetPayout = 0;
    const withResults = seats.map((h) => {
      let ppResult: PerfectPairsResult = null;
      let plus3Result: TwentyOnePlusThreeResult = null;
      if (h.pp > 0) {
        ppResult = evaluatePerfectPairs([h.cards[0], h.cards[1]]);
        if (ppResult) sideBetPayout += h.pp * (ppResult.multiplier + 1);
      }
      if (h.plus3 > 0) {
        plus3Result = evaluateTwentyOnePlusThree([h.cards[0], h.cards[1], dCards[0]]);
        if (plus3Result) sideBetPayout += h.plus3 * (plus3Result.multiplier + 1);
      }
      const status: HandStatus = isBlackjack(h.cards) ? "blackjack" : "playing";
      return { ...h, ppResult, plus3Result, status };
    });
    if (sideBetPayout > 0) adjustBalance(sideBetPayout);
    setHands(withResults);

    if (isBlackjack(dCards)) {
      setRevealDealer(true);
      setMessage("Dealer has blackjack.");
      settleAll(withResults, dCards);
      setPhase("round-over");
      return;
    }

    const first = nextPlayableIndex(withResults, 0);
    if (first === -1) {
      await dealerPlay(withResults, dCards);
    } else {
      setActiveIndex(first);
      setPhase("player-turn");
      setMessage(`Playing hand ${first + 1}.`);
    }
  }

  async function hit() {
    if (activeIndex === null || phase !== "player-turn") return;
    const current = hands[activeIndex];
    const [card, rest] = draw(shoeRef.current);
    shoeRef.current = rest;
    const newCards = [...current.cards, card];
    const bust = handValue(newCards) > 21;
    const updated: HandState = { ...current, cards: newCards, status: bust ? "bust" : "playing" };
    const newHands = hands.map((h, i) => (i === activeIndex ? updated : h));
    setHands(newHands);
    await sleep(280);
    if (bust) {
      setMessage(`Hand ${current.seat} busts at ${handValue(newCards)}.`);
      await advance(newHands);
    }
  }

  async function stand() {
    if (activeIndex === null || phase !== "player-turn") return;
    const current = hands[activeIndex];
    const updated: HandState = { ...current, status: "stood" };
    const newHands = hands.map((h, i) => (i === activeIndex ? updated : h));
    setHands(newHands);
    await advance(newHands);
  }

  async function doubleDown() {
    if (activeIndex === null || phase !== "player-turn") return;
    const current = hands[activeIndex];
    if (current.cards.length !== 2 || current.bet > balance) return;
    adjustBalance(-current.bet);
    const [card, rest] = draw(shoeRef.current);
    shoeRef.current = rest;
    const newCards = [...current.cards, card];
    const bust = handValue(newCards) > 21;
    const updated: HandState = {
      ...current,
      cards: newCards,
      bet: current.bet * 2,
      status: bust ? "bust" : "doubled",
    };
    const newHands = hands.map((h, i) => (i === activeIndex ? updated : h));
    setHands(newHands);
    await sleep(280);
    await advance(newHands);
  }

  async function advance(currentHands: HandState[]) {
    if (activeIndex === null) return;
    const next = nextPlayableIndex(currentHands, activeIndex + 1);
    if (next === -1) {
      setActiveIndex(null);
      await dealerPlay(currentHands, dealerCards);
    } else {
      setActiveIndex(next);
      setMessage(`Playing hand ${next + 1}.`);
    }
  }

  async function dealerPlay(currentHands: HandState[], startingDealerCards: PlayingCard[]) {
    setPhase("dealer-turn");
    setRevealDealer(true);
    setMessage("Dealer plays…");
    await sleep(400);

    const allBust = currentHands.every((h) => h.status === "bust");
    let dCards = startingDealerCards;
    if (!allBust) {
      while (handValue(dCards) < 17) {
        await sleep(DEALER_DRAW_DELAY);
        const [card, rest] = draw(shoeRef.current);
        shoeRef.current = rest;
        dCards = [...dCards, card];
        setDealerCards(dCards);
      }
    }
    await sleep(300);
    settleAll(currentHands, dCards);
    setPhase("round-over");
  }

  function settleAll(finalHands: HandState[], dealerFinal: PlayingCard[]) {
    let totalPayout = 0;
    const settled = finalHands.map((h) => {
      const { outcome, payout } = computeOutcome(h, dealerFinal);
      totalPayout += payout;
      return { ...h, outcome };
    });
    if (totalPayout > 0) adjustBalance(totalPayout);
    setHands(settled);
    const wins = settled.filter((h) => h.outcome === "win" || h.outcome === "blackjack").length;
    setMessage(
      wins > 0
        ? `Round over — ${wins} of ${settled.length} hand${settled.length > 1 ? "s" : ""} won.`
        : "Round over — house takes it.",
    );
  }

  function newRound() {
    setHands([]);
    setDealerCards([]);
    setActiveIndex(null);
    setRevealDealer(false);
    setPhase("setup");
    setMessage("Choose your hands and bets, then deal.");
  }

  const dealerTotal = handValue(dealerCards);

  return (
    <div className="blackjack">
      <p className="eyebrow">Table 1 — Blackjack · {DECKS} decks</p>
      <h1 className="blackjack__title">Blackjack</h1>

      <div className="bj-table felt-texture">
        <div className="bj-dealer">
          <span className="bj-dealer__label">
            Dealer {revealDealer && dealerCards.length > 0 ? `— ${dealerTotal}` : ""}
          </span>
          <div className="bj-dealer__cards">
            {dealerCards.map((card, i) => (
              <Card key={card.id} card={card} faceDown={i === 1 && !revealDealer} />
            ))}
            {dealerCards.length === 0 && <p className="hand-row__empty">—</p>}
          </div>
        </div>

        <div className="bj-seats">
          {phase === "setup"
            ? Array.from({ length: numHands }, (_, i) => (
                <SeatSetup
                  key={i}
                  index={i}
                  config={configs[i]}
                  balance={balance}
                  onChange={(patch) => updateConfig(i, patch)}
                />
              ))
            : hands.map((hand, i) => (
                <SeatPlay key={hand.seat} hand={hand} isActive={i === activeIndex} />
              ))}
        </div>
      </div>

      <p className={`blackjack__message ${phase === "round-over" ? "is-settled" : ""}`}>{message}</p>

      {phase === "setup" && (
        <div className="controls bj-setup-controls">
          <div className="bet-row">
            <span className="bet-row__label">Hands</span>
            <button type="button" className="secondary-button bj-step" onClick={() => setHandCount(numHands - 1)}>
              −
            </button>
            <span className="bj-hand-count">{numHands}</span>
            <button type="button" className="secondary-button bj-step" onClick={() => setHandCount(numHands + 1)}>
              +
            </button>
          </div>
          <p className="bj-total-wager">
            Total wager: <strong>{totalWager.toLocaleString()}</strong> chips
          </p>
          <button type="button" className="primary-button" onClick={dealRound} disabled={!canDeal}>
            Deal
          </button>
        </div>
      )}

      {phase === "player-turn" && activeIndex !== null && (
        <div className="controls">
          <button type="button" className="primary-button" onClick={hit}>
            Hit
          </button>
          <button type="button" className="secondary-button" onClick={stand}>
            Stand
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={doubleDown}
            disabled={hands[activeIndex].cards.length !== 2 || hands[activeIndex].bet > balance}
          >
            Double
          </button>
        </div>
      )}

      {phase === "round-over" && (
        <div className="controls">
          <button type="button" className="primary-button" onClick={newRound}>
            New round
          </button>
        </div>
      )}
    </div>
  );
}

function SeatSetup({
  index,
  config,
  balance,
  onChange,
}: {
  index: number;
  config: HandConfig;
  balance: number;
  onChange: (patch: Partial<HandConfig>) => void;
}) {
  return (
    <div className="seat seat--setup">
      <span className="seat__number">Hand {index + 1}</span>
      <label className="seat__field">
        Bet
        <input
          type="number"
          min={1}
          max={balance}
          value={config.bet}
          onChange={(e) => onChange({ bet: Math.max(0, Number(e.target.value)) })}
        />
      </label>
      <label className="seat__field seat__field--side">
        Perfect Pairs
        <input
          type="number"
          min={0}
          max={balance}
          value={config.pp}
          onChange={(e) => onChange({ pp: Math.max(0, Number(e.target.value)) })}
        />
      </label>
      <label className="seat__field seat__field--side">
        21+3
        <input
          type="number"
          min={0}
          max={balance}
          value={config.plus3}
          onChange={(e) => onChange({ plus3: Math.max(0, Number(e.target.value)) })}
        />
      </label>
    </div>
  );
}

function SeatPlay({ hand, isActive }: { hand: HandState; isActive: boolean }) {
  const total = handValue(hand.cards);
  return (
    <div className={`seat seat--play ${isActive ? "is-active" : ""} ${hand.outcome ? `is-${hand.outcome}` : ""}`}>
      <span className="seat__number">
        Hand {hand.seat} <span className="seat__bet">· {hand.bet}</span>
      </span>
      <div className="seat__cards">
        {hand.cards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </div>
      <div className="seat__footer">
        <span className="seat__total">{hand.cards.length > 0 ? total : ""}</span>
        <span className={`seat__status seat__status--${hand.status}`}>
          {hand.status === "bust" && "Bust"}
          {hand.status === "blackjack" && "Blackjack"}
          {hand.status === "doubled" && "Doubled"}
          {hand.status === "stood" && "Stand"}
          {hand.status === "playing" && isActive && "Your turn"}
        </span>
        {hand.outcome && <span className={`seat__outcome seat__outcome--${hand.outcome}`}>{hand.outcome}</span>}
      </div>
      {(hand.ppResult || hand.plus3Result || hand.pp > 0 || hand.plus3 > 0) && (
        <div className="seat__sidebets">
          {hand.pp > 0 && (
            <span className={hand.ppResult ? "is-win" : "is-lose"}>
              PP: {hand.ppResult ? `${hand.ppResult.name} ${hand.ppResult.multiplier}:1` : "no win"}
            </span>
          )}
          {hand.plus3 > 0 && (
            <span className={hand.plus3Result ? "is-win" : "is-lose"}>
              21+3: {hand.plus3Result ? `${hand.plus3Result.name} ${hand.plus3Result.multiplier}:1` : "no win"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
