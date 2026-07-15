import type { PlayingCard } from "../lib/deck";
import { isRed } from "../lib/deck";
import "./Card.css";

interface CardProps {
  card?: PlayingCard;
  faceDown?: boolean;
}

export function Card({ card, faceDown }: CardProps) {
  if (faceDown || !card) {
    return (
      <div className="playing-card playing-card--back" aria-label="Face-down card">
        <span className="playing-card__back-pattern" />
      </div>
    );
  }

  const red = isRed(card.suit);

  return (
    <div
      className={`playing-card ${red ? "playing-card--red" : "playing-card--black"}`}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <span className="playing-card__corner playing-card__corner--top">
        {card.rank}
        <br />
        {card.suit}
      </span>
      <span className="playing-card__pip">{card.suit}</span>
      <span className="playing-card__corner playing-card__corner--bottom">
        {card.rank}
        <br />
        {card.suit}
      </span>
    </div>
  );
}
