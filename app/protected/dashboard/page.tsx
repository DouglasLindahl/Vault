"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn, parseDateOnly } from "@/lib/utils";
import { useDashboardData } from "./dashboard-provider";
import { nextOccurrence } from "@/lib/recurrence";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddInstitutionDialog } from "@/components/forms/add-institution-dialog";
import { AddTransactionDialog } from "@/components/forms/add-transaction-dialog";
import { AddCategoryDialog } from "@/components/forms/add-category-dialog";
import { SortableAccountsList } from "@/components/accounts/sortable-accounts-list";

import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Wallet,
  PiggyBank,
  Repeat,
} from "lucide-react";

const timeframes = ["Week", "Month", "Year"] as const;
type Timeframe = (typeof timeframes)[number];

function currency(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function withinTimeframe(dateStr: string, timeframe: Timeframe) {
  const date = parseDateOnly(dateStr);
  const now = new Date();
  const days = timeframe === "Week" ? 7 : timeframe === "Month" ? 30 : 365;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date >= cutoff;
}

export default function Dashboard() {
  const {
    institutions,
    transactions,
    recurringTransactions,
    categories: allCategories,
  } = useDashboardData();
  const [timeframe, setTimeframe] = useState<Timeframe>("Month");

  const cashBalance = useMemo(
    () =>
      institutions
        .filter((a) => a.type === "bank")
        .reduce((s, a) => s + a.balance, 0),
    [institutions],
  );
  const investmentsBalance = useMemo(
    () =>
      institutions
        .filter((a) => a.type === "investment")
        .reduce((s, a) => s + a.balance, 0),
    [institutions],
  );
  const netWorth = cashBalance + investmentsBalance;

  const categorySpend = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of transactions) {
      if (t.direction !== "out") continue;
      if (!withinTimeframe(t.date, timeframe)) continue;
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
    return Array.from(totals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, timeframe]);

  const maxSpend = Math.max(...categorySpend.map((c) => c.amount), 1);
  const totalSpend = categorySpend.reduce((s, c) => s + c.amount, 0);

  const recentActivity = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => parseDateOnly(b.date).getTime() - parseDateOnly(a.date).getTime())
        .slice(0, 5),
    [transactions],
  );

  const upcomingRecurring = useMemo(
    () =>
      recurringTransactions
        .map((r) => ({ ...r, next: nextOccurrence(r.startDate, r.frequency) }))
        .sort((a, b) => a.next.getTime() - b.next.getTime())
        .slice(0, 6),
    [recurringTransactions],
  );

  return (
    <div className="relative flex min-h-screen bg-zinc-50 dark:bg-[#0c0c0e]">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(49,92,255,0.08),transparent_45%)] blur-2xl dark:bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.12),transparent_45%)]" />

      <div className="flex-1 px-6 py-10 md:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Good afternoon
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <AddTransactionDialog
              institutions={institutions}
              categories={allCategories}
            />
            <AddInstitutionDialog />
            <AddCategoryDialog />
          </div>
        </div>

        {/* Metric cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Net worth</CardDescription>
              <TrendingUp className="h-4 w-4 text-[#315cff] dark:text-pink-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums text-[#172033] dark:text-white">
                {currency(netWorth)}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Cash across banks</CardDescription>
              <Wallet className="h-4 w-4 text-[#315cff] dark:text-pink-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums text-[#172033] dark:text-white">
                {currency(cashBalance)}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Investments value</CardDescription>
              <PiggyBank className="h-4 w-4 text-[#315cff] dark:text-pink-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums text-[#172033] dark:text-white">
                {currency(investmentsBalance)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Accounts */}
          <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
            <CardHeader>
              <CardTitle className="text-base text-[#172033] dark:text-white">
                Accounts
              </CardTitle>
              <CardDescription>
                Balances across every institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SortableAccountsList institutions={institutions} />
            </CardContent>
          </Card>

          {/* Category spend */}
          <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base text-[#172033] dark:text-white">
                  Spending by category
                </CardTitle>
                <CardDescription>
                  {currency(totalSpend)} this {timeframe.toLowerCase()}
                </CardDescription>
              </div>
              <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-white/[0.04]">
                {timeframes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                      timeframe === t
                        ? "bg-white text-[#172033] shadow-sm dark:bg-white/[0.1] dark:text-white"
                        : "text-zinc-500",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {categorySpend.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No spending logged for this {timeframe.toLowerCase()}.
                </p>
              )}
              {categorySpend.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-sm text-[#172033] dark:text-white">
                    {c.name}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-[#315cff] dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600"
                      style={{ width: `${(c.amount / maxSpend) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                    {currency(c.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming recurring */}
        <Card className="mt-6 rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base text-[#172033] dark:text-white">
              Upcoming recurring
            </CardTitle>
            <Link
              href="/protected/dashboard/recurring-transactions"
              className="text-xs font-medium text-[#315cff] dark:text-pink-400"
            >
              See all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {upcomingRecurring.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No recurring transactions yet.
              </p>
            )}
            {upcomingRecurring.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
                    <Repeat className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#172033] dark:text-white">
                      {r.name ?? r.category}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {r.institutionName} · next{" "}
                      {r.next.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    r.direction === "in"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-[#172033] dark:text-white",
                  )}
                >
                  {r.direction === "in" ? currency(r.amount) : currency(-r.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="mt-6 rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader>
            <CardTitle className="text-base text-[#172033] dark:text-white">
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {recentActivity.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No transactions yet.
              </p>
            )}
            {recentActivity.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      t.direction === "in"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400",
                    )}
                  >
                    {t.direction === "in" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#172033] dark:text-white">
                      {t.name ?? t.category}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t.institutionName} ·{" "}
                      {parseDateOnly(t.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    t.direction === "in"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-[#172033] dark:text-white",
                  )}
                >
                  {t.direction === "in"
                    ? currency(t.amount)
                    : currency(-t.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
