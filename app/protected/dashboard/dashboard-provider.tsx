"use client";

import { createContext, useContext, useMemo } from "react";
import type { DashboardData } from "@/lib/types";
import { convert, formatMoney } from "@/lib/currency";

const DashboardContext = createContext<DashboardData | null>(null);

export function DashboardProvider({
  data,
  children,
}: {
  data: DashboardData;
  children: React.ReactNode;
}) {
  return (
    <DashboardContext.Provider value={data}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardData() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboardData must be used inside DashboardProvider");
  }
  return ctx;
}

// Money helpers bound to the user's display currency and today's rates.
//   toBase(amount, from) — convert an institution-currency amount for totals
//   format(amount, currency?) — format in `currency`, default display currency
export function useMoney() {
  const { baseCurrency, fxRates } = useDashboardData();
  return useMemo(
    () => ({
      base: baseCurrency,
      toBase: (amount: number, from: string) => convert(amount, from, baseCurrency, fxRates),
      format: (amount: number, currency: string = baseCurrency, decimals?: 0 | 2) =>
        formatMoney(amount, currency, { decimals }),
    }),
    [baseCurrency, fxRates],
  );
}
