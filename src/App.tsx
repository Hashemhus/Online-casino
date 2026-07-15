import { NavLink, Outlet } from "react-router-dom";
import { ChipCounter } from "./components/ChipCounter";
import { useChips } from "./context/ChipsContext";
import "./App.css";

export default function App() {
  const { balance, resetBalance } = useChips();
  const isBroke = balance === 0;

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink to="/" className="brand">
            <span className="brand__mark">♦</span>
            <span className="brand__name">After Hours</span>
          </NavLink>

          <nav className="site-nav" aria-label="Games">
            <NavLink to="/blackjack" className="site-nav__link">
              Blackjack
            </NavLink>
            <NavLink to="/roulette" className="site-nav__link">
              Roulette
            </NavLink>
            <NavLink to="/slots" className="site-nav__link">
              Slots
            </NavLink>
          </nav>

          <ChipCounter value={balance} />
        </div>
      </header>

      {isBroke && (
        <div className="broke-banner" role="alert">
          <span>You're out of chips. The house always restocks the tray.</span>
          <button type="button" className="broke-banner__button" onClick={resetBalance}>
            Get 1,000 more chips
          </button>
        </div>
      )}

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>Play money only — no real currency, no real stakes, no real regrets.</p>
      </footer>
    </>
  );
}
