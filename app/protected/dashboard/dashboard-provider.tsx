"use client";

import { createContext, useContext } from "react";
import type { DashboardData } from "@/lib/types";

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
