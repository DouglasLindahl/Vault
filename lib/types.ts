import type { DashboardLayout } from "@/lib/dashboard-layout";
import type { FxRates } from "@/lib/currency";

export type Institution = {
  id: string;
  name: string;
  type: "bank" | "investment";
  balance: number; // in `currency`
  currency: string;
};

export type TagOption = {
  id: string;
  name: string;
  color: string;
};

export type Transaction = {
  id: string;
  name: string | null;
  tags: TagOption[];
  institutionName: string;
  amount: number; // in `currency` (the institution's)
  currency: string;
  direction: "in" | "out";
  date: string; // ISO date string
};

export type RecurringTransaction = {
  id: string;
  name: string | null;
  tags: TagOption[];
  institutionName: string;
  amount: number; // in `currency` (the institution's)
  currency: string;
  direction: "in" | "out";
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
  startDate: string; // ISO date string
};

export type DashboardData = {
  institutions: Institution[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  tags: TagOption[];
  isAdmin: boolean;
  displayName: string | null;
  dashboardLayout: DashboardLayout;
  // The user's display currency (profiles.currency) — every total across
  // institutions is converted into it with `fxRates`.
  baseCurrency: string;
  fxRates: FxRates;
};
