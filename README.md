# After Hours 🎲

A play-money casino built with React, TypeScript, and Vite. No real currency,
no accounts, no payments — just blackjack and roulette with a shared chip
balance that persists in your browser.



![status](https://img.shields.io/badge/status-for%20fun-c9a227)

## Why this exists

A small portfolio project to demonstrate frontend fundamentals without
leaning on a UI kit: game logic (card counting, dealer AI, wheel physics),
shared state via context, CSS design tokens, and a from-scratch visual
identity.

## Features

- **Blackjack** — play up to 7 hands at once, each with its own bet.
  Hit, stand, double down. Dealer stands on 17, checks for blackjack before
  play continues, blackjack pays 3:2, correct ace soft/hard scoring, cards
  deal one at a time instead of snapping in. Side bets: **Perfect Pairs**
  (mixed 6:1, colored 12:1, perfect 40:1) and **21+3** (flush 5:1, straight
  10:1, three of a kind 30:1, straight flush 40:1, suited trips 100:1),
  evaluated the moment cards hit the table, independent of the hand outcome.
- **Roulette** — European single-zero wheel, bet on color/parity/range/
  straight-up numbers, animated spin that lands on the actual result.
- **Slots** — 3-reel machine with a weighted symbol pool, staggered reel
  stops, and a paytable from cherries up to a 100x triple-seven jackpot.
- **Shared chip balance** — persisted to `localStorage`, ticks like a
  mechanical counter when it changes, with a "reload" button if you go bust.
- Fully typed, no `any`, no runtime dependencies beyond React and
  `react-router-dom`. Game math (hand values, side bet evaluation, wheel
  logic, slot payouts) lives in pure functions under `src/lib/` so it's easy
  to unit test.

## Stack

- React 19 + TypeScript
- Vite
- `react-router-dom` (hash routing, so it deploys to GitHub Pages with zero
  server config)
- Plain CSS with custom properties — no Tailwind/UI kit, by design

## Getting started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Deploying to GitHub Pages

The app uses a hash router and a relative Vite `base`, so the build output
in `dist/` works when served from a project subpath. Push `dist/` to a
`gh-pages` branch (or use an action like `peaceiris/actions-gh-pages`) and
point Pages at it.

## Project structure

```
src/
  components/   Card, ChipCounter (shared UI)
  context/      ChipsContext — the shared, persisted balance
  lib/          deck.ts, blackjack.ts, roulette.ts, slots.ts — pure game
                logic, unit-testable, no React
  pages/        Lobby, Blackjack, Roulette, Slots
  styles/       shared table/button styles
```

## Disclaimer

This is a game with imaginary chips. No real money is used, wagered, or
paid out anywhere in this project.
