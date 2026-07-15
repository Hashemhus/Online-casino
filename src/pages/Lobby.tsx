import { Link } from "react-router-dom";
import "./Lobby.css";

interface GameEntry {
  slug: string;
  name: string;
  tagline: string;
  detail: string;
  suit: string;
}

const GAMES: GameEntry[] = [
  {
    slug: "blackjack",
    name: "Blackjack",
    tagline: "Play up to 7 hands at once",
    detail: "Hit, stand, double down, plus Perfect Pairs and 21+3 side bets.",
    suit: "♠",
  },
  {
    slug: "roulette",
    name: "Roulette",
    tagline: "Red, black, or a single number",
    detail: "Place your bet, spin the wheel, see where it lands.",
    suit: "♦",
  },
  {
    slug: "slots",
    name: "Slots",
    tagline: "Three reels, one lever",
    detail: "Match symbols across the reels — triple sevens pays 100x.",
    suit: "♣",
  },
];

export function Lobby() {
  return (
    <div className="lobby">
      <p className="eyebrow">Table games — no dress code</p>
      <h1 className="lobby__title">Pick your table</h1>
      <p className="lobby__subtitle">
        Every chip here is imaginary. Play as loose as you want.
      </p>

      <div className="lobby__grid">
        {GAMES.map((game) => (
          <Link key={game.slug} to={`/${game.slug}`} className="game-card">
            <span className="game-card__suit" aria-hidden="true">
              {game.suit}
            </span>
            <h2 className="game-card__name">{game.name}</h2>
            <p className="game-card__tagline">{game.tagline}</p>
            <p className="game-card__detail">{game.detail}</p>
            <span className="game-card__cta">Sit down →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
