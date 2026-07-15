import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "after-hours:balance";
const STARTING_BALANCE = 1000;

interface ChipsContextValue {
  balance: number;
  /** Adds (or subtracts, if negative) chips from the balance. */
  adjustBalance: (delta: number) => void;
  /** Resets the balance back to the house stake. Used when a player busts out. */
  resetBalance: () => void;
}

const ChipsContext = createContext<ChipsContextValue | null>(null);

function readStoredBalance(): number {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return STARTING_BALANCE;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : STARTING_BALANCE;
  } catch {
    return STARTING_BALANCE;
  }
}

export function ChipsProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(readStoredBalance);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(balance));
    } catch {
      // Storage may be unavailable (private browsing, etc). Balance still works in-session.
    }
  }, [balance]);

  const adjustBalance = useCallback((delta: number) => {
    setBalance((prev) => Math.max(0, prev + delta));
  }, []);

  const resetBalance = useCallback(() => {
    setBalance(STARTING_BALANCE);
  }, []);

  const value = useMemo(
    () => ({ balance, adjustBalance, resetBalance }),
    [balance, adjustBalance, resetBalance],
  );

  return <ChipsContext.Provider value={value}>{children}</ChipsContext.Provider>;
}

export function useChips(): ChipsContextValue {
  const ctx = useContext(ChipsContext);
  if (!ctx) throw new Error("useChips must be used within a ChipsProvider");
  return ctx;
}

export { STARTING_BALANCE };
