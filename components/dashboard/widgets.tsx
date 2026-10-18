"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  PiggyBank,
  Receipt,
  Repeat,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { cn, parseDateOnly } from "@/lib/utils";
import { monthlyAmount, nextOccurrence } from "@/lib/recurrence";
import {
  ACCENTS,
  DENSITIES,
  RADII,
  ROW_HEIGHT,
  WIDGET_CATALOG,
  sortByPosition,
  type DashboardLayout,
  type DashboardTheme,
  type Timeframe,
  type Widget,
} from "@/lib/dashboard-layout";
import { useDashboardData, useMoney } from "@/app/protected/dashboard/dashboard-provider";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddInstitutionDialog } from "@/components/forms/add-institution-dialog";
import { AddTransactionDialog } from "@/components/forms/add-transaction-dialog";
import { ManageTagsDialog } from "@/components/forms/manage-tags-dialog";
import { SortableAccountsList } from "@/components/accounts/sortable-accounts-list";
import { TagChips } from "@/components/tag-chips";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";

// ---------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------

const PrefsContext = createContext<{ hideAmounts: boolean; accentCustomized: boolean }>({
  hideAmounts: false,
  accentCustomized: false,
});

// Bars keep the app's original primary look (navy in light, pink gradient
// in dark) unless the user picked an accent for the page or this card.
function useBarClass(widget: Widget) {
  const { accentCustomized } = useContext(PrefsContext);
  return accentCustomized || widget.color ? "bg-accent" : "bg-primary-surface";
}

// Every amount on the dashboard goes through this so "Hide amounts" can
// blur them all (hover/focus to peek). `currency` defaults to the user's
// display currency — pass the institution's for per-account amounts.
function Money({
  value,
  currency,
  className,
}: {
  value: number;
  currency?: string;
  className?: string;
}) {
  const { hideAmounts } = useContext(PrefsContext);
  const money = useMoney();
  return (
    <span
      tabIndex={hideAmounts ? 0 : undefined}
      className={cn(
        "tabular-nums",
        hideAmounts && "select-none blur-[6px] transition hover:blur-none focus:blur-none",
        className,
      )}
    >
      {money.format(value, currency)}
    </span>
  );
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function withinTimeframe(dateStr: string, timeframe: Timeframe) {
  const days = timeframe === "Week" ? 7 : timeframe === "Month" ? 30 : 365;
  return parseDateOnly(dateStr) >= daysAgo(days);
}

function widgetTitle(widget: Widget) {
  return widget.title ?? WIDGET_CATALOG[widget.type].label;
}

const titleClass = "text-base text-foreground dark:text-white";
const mutedClass = "text-sm text-zinc-500 dark:text-zinc-400";

// ---------------------------------------------------------------------
// Page surface + header
// ---------------------------------------------------------------------

// Applies the page-level theme: accent color (via the --accent token the
// whole UI already uses), card corner radius, spacing and background.
export function DashboardSurface({
  theme,
  children,
  className,
}: {
  theme: DashboardTheme;
  children: React.ReactNode;
  className?: string;
}) {
  const accent = ACCENTS[theme.accent].hsl;
  const style = {
    "--dash-radius": `${RADII[theme.radius].px}px`,
    ...(accent ? { "--accent": accent } : {}),
  } as React.CSSProperties;

  return (
    <PrefsContext.Provider
      value={{ hideAmounts: theme.hideAmounts, accentCustomized: accent !== null }}
    >
      <div style={style} className={cn("relative overflow-hidden bg-background", className)}>
        {theme.background === "glow" &&
          (accent ? (
            <div className="pointer-events-none absolute -inset-10 -z-0 rounded-[40px] bg-[radial-gradient(circle_at_top,hsl(var(--accent)/0.10),transparent_45%)] blur-2xl" />
          ) : (
            <div className="pointer-events-none absolute -inset-10 -z-0 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(49,92,255,0.08),transparent_45%)] blur-2xl dark:bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.12),transparent_45%)]" />
          ))}
        {theme.background === "dots" && (
          <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(hsl(var(--accent)/0.18)_1px,transparent_1px)] [background-size:18px_18px]" />
        )}
        <div className="relative w-full min-w-0">{children}</div>
      </div>
    </PrefsContext.Provider>
  );
}

function greetingFor(hour: number) {
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({
  theme,
  interactive = true,
}: {
  theme: DashboardTheme;
  interactive?: boolean;
}) {
  const { institutions, tags, displayName } = useDashboardData();
  // Time-of-day depends on the viewer's clock, so it's only computed after
  // mount (the server-rendered HTML can't know it).
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    if (!theme.greeting) return setGreeting(null);
    const first = displayName?.trim().split(/\s+/)[0];
    setGreeting(`${greetingFor(new Date().getHours())}${first ? `, ${first}` : ""} 👋`);
  }, [theme.greeting, displayName]);

  const subtitle = greeting ?? theme.subtitle;

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        {subtitle && <p className={mutedClass}>{subtitle}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
          {theme.title}
        </h1>
      </div>
      {theme.showHeaderActions && (
        <div
          className={cn("flex flex-wrap items-center gap-3", !interactive && "pointer-events-none")}
          inert={!interactive}
        >
          <AddTransactionDialog institutions={institutions} tags={tags} />
          <div className="hidden sm:contents">
            <AddInstitutionDialog />
            <ManageTagsDialog />
          </div>
        </div>
      )}
    </div>
  );
}

export function gridGap(theme: DashboardTheme) {
  return DENSITIES[theme.density].gap;
}

// The saved dashboard. From `md` up it's a 12-column CSS grid with each card
// at its exact cells; on phones the cards stack in reading order at their
// natural height (grid-column/row are ignored outside a grid container).
export function DashboardGrid({ layout }: { layout: DashboardLayout }) {
  return (
    <div
      className="flex flex-col md:grid md:grid-cols-12"
      style={{ gap: gridGap(layout.theme), gridAutoRows: `${ROW_HEIGHT}px` }}
    >
      {sortByPosition(layout.widgets).map((widget) => (
        <div
          key={widget.id}
          className="min-w-0"
          style={{
            gridColumn: `${widget.x + 1} / span ${widget.w}`,
            gridRow: `${widget.y + 1} / span ${widget.h}`,
          }}
        >
          <WidgetContent widget={widget} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Frame
// ---------------------------------------------------------------------

// Fills its grid cell exactly. The last child (the card's content) takes
// the remaining height and scrolls if the card is sized smaller than its
// content.
export function WidgetFrame({
  widget,
  children,
}: {
  widget: Widget;
  children: React.ReactNode;
}) {
  const accent = widget.color ? ACCENTS[widget.color].hsl : null;
  return (
    <Card
      style={accent ? ({ "--accent": accent } as React.CSSProperties) : undefined}
      className="relative flex h-full flex-col overflow-hidden rounded-[var(--dash-radius,28px)] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur [&>*:last-child]:min-h-0 [&>*:last-child]:flex-1 [&>*:last-child]:overflow-y-auto"
    >
      {accent && <div className="absolute inset-x-0 top-0 h-1 bg-accent" />}
      {children}
    </Card>
  );
}

// ---------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------

function MetricWidget({
  widget,
  value,
  icon: Icon,
  footer,
}: {
  widget: Widget;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  footer?: React.ReactNode;
}) {
  return (
    <WidgetFrame widget={widget}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{widgetTitle(widget)}</CardDescription>
        <Icon className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground dark:text-white">
          <Money value={value} />
        </p>
        {footer}
      </CardContent>
    </WidgetFrame>
  );
}

// Totals in the display currency.
function useBalances() {
  const { institutions } = useDashboardData();
  const { toBase } = useMoney();
  return useMemo(() => {
    const sum = (type: "bank" | "investment") =>
      institutions
        .filter((a) => a.type === type)
        .reduce((s, a) => s + toBase(a.balance, a.currency), 0);
    const cash = sum("bank");
    const investments = sum("investment");
    return { cash, investments, netWorth: cash + investments };
  }, [institutions, toBase]);
}

function AccountsWidget({ widget }: { widget: Widget }) {
  const { institutions } = useDashboardData();
  return (
    <WidgetFrame widget={widget}>
      <CardHeader>
        <CardTitle className={titleClass}>{widgetTitle(widget)}</CardTitle>
        <CardDescription>Balances across every institution</CardDescription>
      </CardHeader>
      <CardContent>
        <SortableAccountsList institutions={institutions} />
      </CardContent>
    </WidgetFrame>
  );
}

const TIMEFRAMES: Timeframe[] = ["Week", "Month", "Year"];

function TagSpendWidget({ widget }: { widget: Widget }) {
  const { transactions } = useDashboardData();
  const { toBase } = useMoney();
  const [timeframe, setTimeframe] = useState<Timeframe>(widget.options?.timeframe ?? "Month");
  useEffect(() => setTimeframe(widget.options?.timeframe ?? "Month"), [widget.options?.timeframe]);

  const { rows, total } = useMemo(() => {
    const totals = new Map<string, { amount: number; color?: string }>();
    let total = 0;
    for (const t of transactions) {
      if (t.direction !== "out" || !withinTimeframe(t.date, timeframe)) continue;
      const amount = toBase(t.amount, t.currency);
      total += amount;
      if (t.tags.length === 0) {
        const prev = totals.get("Untagged");
        totals.set("Untagged", { amount: (prev?.amount ?? 0) + amount });
        continue;
      }
      for (const tag of t.tags) {
        const prev = totals.get(tag.name);
        totals.set(tag.name, { amount: (prev?.amount ?? 0) + amount, color: tag.color });
      }
    }
    return {
      rows: Array.from(totals.entries())
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.amount - a.amount),
      total,
    };
  }, [transactions, timeframe, toBase]);
  const max = Math.max(...rows.map((r) => r.amount), 1);
  const barClass = useBarClass(widget);

  return (
    <WidgetFrame widget={widget}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className={titleClass}>{widgetTitle(widget)}</CardTitle>
          <CardDescription>
            <Money value={total} /> this {timeframe.toLowerCase()}
          </CardDescription>
        </div>
        <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-white/[0.04]">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeframe(t)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                timeframe === t
                  ? "bg-white text-foreground shadow-sm dark:bg-white/[0.1] dark:text-white"
                  : "text-zinc-500",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.length === 0 && (
          <p className={mutedClass}>No spending logged for this {timeframe.toLowerCase()}.</p>
        )}
        {rows.map((c) => (
          <div key={c.name} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-sm text-foreground dark:text-white">
              {c.name}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
              <div
                className={cn("h-full rounded-full", barClass)}
                style={{ width: `${(c.amount / max) * 100}%` }}
              />
            </div>
            <Money
              value={c.amount}
              className="min-w-16 shrink-0 text-right text-sm text-zinc-500 dark:text-zinc-400"
            />
          </div>
        ))}
      </CardContent>
    </WidgetFrame>
  );
}

function TransactionRow({
  name,
  subtitle,
  amount,
  currency,
  direction,
  icon,
  tags,
}: {
  name: string;
  subtitle: string;
  amount: number;
  currency: string;
  direction: "in" | "out";
  icon: React.ReactNode;
  tags?: { id: string; name: string; color: string }[];
}) {
  return (
    <div className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground dark:text-white">{name}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          {tags && (
            <div className="mt-1">
              <TagChips tags={tags} />
            </div>
          )}
        </div>
      </div>
      <Money
        value={direction === "in" ? amount : -amount}
        currency={currency}
        className={cn(
          "shrink-0 text-sm font-semibold",
          direction === "in" ? "text-success" : "text-foreground dark:text-white",
        )}
      />
    </div>
  );
}

function DirectionIcon({ direction }: { direction: "in" | "out" }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        direction === "in"
          ? "bg-success/10 text-success"
          : "bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400",
      )}
    >
      {direction === "in" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
    </div>
  );
}

function UpcomingRecurringWidget({ widget }: { widget: Widget }) {
  const { recurringTransactions } = useDashboardData();
  const count = widget.options?.count ?? 6;
  const upcoming = useMemo(
    () =>
      recurringTransactions
        .map((r) => ({ ...r, next: nextOccurrence(r.startDate, r.frequency) }))
        .sort((a, b) => a.next.getTime() - b.next.getTime())
        .slice(0, count),
    [recurringTransactions, count],
  );

  return (
    <WidgetFrame widget={widget}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className={titleClass}>{widgetTitle(widget)}</CardTitle>
        <Link
          href="/protected/dashboard/recurring-transactions"
          className="text-xs font-medium text-accent"
        >
          See all
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {upcoming.length === 0 && <p className={mutedClass}>No recurring transactions yet.</p>}
        {upcoming.map((r) => (
          <TransactionRow
            key={r.id}
            name={r.name ?? (r.direction === "in" ? "Income" : "Expense")}
            subtitle={`${r.institutionName} · next ${r.next.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}`}
            amount={r.amount}
            currency={r.currency}
            direction={r.direction}
            tags={r.tags}
            icon={
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
                <Repeat className="h-4 w-4" />
              </div>
            }
          />
        ))}
      </CardContent>
    </WidgetFrame>
  );
}

function RecentActivityWidget({ widget }: { widget: Widget }) {
  const { transactions } = useDashboardData();
  const count = widget.options?.count ?? 5;
  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => parseDateOnly(b.date).getTime() - parseDateOnly(a.date).getTime())
        .slice(0, count),
    [transactions, count],
  );

  return (
    <WidgetFrame widget={widget}>
      <CardHeader>
        <CardTitle className={titleClass}>{widgetTitle(widget)}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {recent.length === 0 && <p className={mutedClass}>No transactions yet.</p>}
        {recent.map((t) => (
          <TransactionRow
            key={t.id}
            name={t.name ?? (t.direction === "in" ? "Income" : "Expense")}
            subtitle={`${t.institutionName} · ${parseDateOnly(t.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}`}
            amount={t.amount}
            currency={t.currency}
            direction={t.direction}
            tags={t.tags}
            icon={<DirectionIcon direction={t.direction} />}
          />
        ))}
      </CardContent>
    </WidgetFrame>
  );
}

function InOutNet({
  totalIn,
  totalOut,
  barClass,
}: {
  totalIn: number;
  totalOut: number;
  barClass: string;
}) {
  const net = totalIn - totalOut;
  const outShare = totalIn > 0 ? Math.min(100, (totalOut / totalIn) * 100) : totalOut > 0 ? 100 : 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">In</p>
          <Money value={totalIn} className="text-lg font-semibold text-success" />
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Out</p>
          <Money value={-totalOut} className="text-lg font-semibold text-foreground dark:text-white" />
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Left</p>
          <Money
            value={net}
            className={cn("text-lg font-semibold", net >= 0 ? "text-success" : "text-red-500")}
          />
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
        <div className={cn("h-full rounded-full", barClass)} style={{ width: `${outShare}%` }} />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {totalIn > 0 ? `${Math.round(outShare)}% of income spent` : "No income logged"}
      </p>
    </div>
  );
}

function MonthFlowWidget({ widget }: { widget: Widget }) {
  const { transactions } = useDashboardData();
  const { toBase } = useMoney();
  const { totalIn, totalOut, label } = useMemo(() => {
    const now = new Date();
    let totalIn = 0;
    let totalOut = 0;
    for (const t of transactions) {
      const d = parseDateOnly(t.date);
      if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) continue;
      const amount = toBase(t.amount, t.currency);
      if (t.direction === "in") totalIn += amount;
      else totalOut += amount;
    }
    return {
      totalIn,
      totalOut,
      label: now.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    };
  }, [transactions, toBase]);

  return (
    <WidgetFrame widget={widget}>
      <CardHeader>
        <CardTitle className={titleClass}>{widgetTitle(widget)}</CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <InOutNet totalIn={totalIn} totalOut={totalOut} barClass={useBarClass(widget)} />
      </CardContent>
    </WidgetFrame>
  );
}

function RecurringSummaryWidget({ widget }: { widget: Widget }) {
  const { recurringTransactions } = useDashboardData();
  const { toBase } = useMoney();
  const { totalIn, totalOut } = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const r of recurringTransactions) {
      const monthly = toBase(monthlyAmount(r.amount, r.frequency), r.currency);
      if (r.direction === "in") totalIn += monthly;
      else totalOut += monthly;
    }
    return { totalIn, totalOut };
  }, [recurringTransactions, toBase]);

  return (
    <WidgetFrame widget={widget}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className={titleClass}>{widgetTitle(widget)}</CardTitle>
          <CardDescription>Monthly equivalent of active recurring</CardDescription>
        </div>
        <Repeat className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent>
        <InOutNet totalIn={totalIn} totalOut={totalOut} barClass={useBarClass(widget)} />
      </CardContent>
    </WidgetFrame>
  );
}

function SavingsRateWidget({ widget }: { widget: Widget }) {
  const { transactions } = useDashboardData();
  const { toBase } = useMoney();
  const rate = useMemo(() => {
    const cutoff = daysAgo(30);
    let totalIn = 0;
    let totalOut = 0;
    for (const t of transactions) {
      if (parseDateOnly(t.date) < cutoff) continue;
      const amount = toBase(t.amount, t.currency);
      if (t.direction === "in") totalIn += amount;
      else totalOut += amount;
    }
    return totalIn > 0 ? (totalIn - totalOut) / totalIn : null;
  }, [transactions, toBase]);

  const pct = rate === null ? null : Math.round(rate * 100);
  const barClass = useBarClass(widget);
  return (
    <WidgetFrame widget={widget}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{widgetTitle(widget)}</CardDescription>
        <PiggyBank className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-bold tabular-nums",
            pct === null || pct >= 0 ? "text-foreground dark:text-white" : "text-red-500",
          )}
        >
          {pct === null ? "—" : `${pct}%`}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
          <div
            className={cn("h-full rounded-full", barClass)}
            style={{ width: `${Math.max(0, Math.min(100, pct ?? 0))}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {pct === null ? "No income in the last 30 days" : "of income kept, last 30 days"}
        </p>
      </CardContent>
    </WidgetFrame>
  );
}

function BiggestExpensesWidget({ widget }: { widget: Widget }) {
  const { transactions } = useDashboardData();
  const { toBase } = useMoney();
  const count = widget.options?.count ?? 5;
  // Ranked by display-currency value, shown in each account's currency.
  const biggest = useMemo(() => {
    const cutoff = daysAgo(30);
    return transactions
      .filter((t) => t.direction === "out" && parseDateOnly(t.date) >= cutoff)
      .sort((a, b) => toBase(b.amount, b.currency) - toBase(a.amount, a.currency))
      .slice(0, count);
  }, [transactions, count, toBase]);

  return (
    <WidgetFrame widget={widget}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className={titleClass}>{widgetTitle(widget)}</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </div>
        <Receipt className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {biggest.length === 0 && <p className={mutedClass}>No spending in the last 30 days.</p>}
        {biggest.map((t, i) => (
          <TransactionRow
            key={t.id}
            name={t.name ?? "Expense"}
            subtitle={`${t.institutionName} · ${parseDateOnly(t.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}`}
            amount={t.amount}
            currency={t.currency}
            direction="out"
            icon={
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                {i + 1}
              </div>
            }
          />
        ))}
      </CardContent>
    </WidgetFrame>
  );
}

function CashFlowWidget() {
  const { transactions } = useDashboardData();
  const { toBase } = useMoney();
  return (
    <div className="h-full overflow-y-auto">
      <CashFlowChart
        transactions={transactions.map((t) => ({
          date: t.date,
          direction: t.direction,
          amount: toBase(t.amount, t.currency),
        }))}
      />
    </div>
  );
}

function QuickActionsWidget({ widget }: { widget: Widget }) {
  const { institutions, tags } = useDashboardData();
  return (
    <WidgetFrame widget={widget}>
      <CardHeader>
        <CardTitle className={titleClass}>{widgetTitle(widget)}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <AddTransactionDialog institutions={institutions} tags={tags} />
        <AddInstitutionDialog />
        <ManageTagsDialog triggerClassName="h-11 rounded-2xl" />
        <Link
          href="/protected/dashboard/stats"
          className="flex h-11 items-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground hover:bg-zinc-50 dark:text-white dark:hover:bg-white/[0.04]"
        >
          <BarChart3 className="h-4 w-4 text-accent" />
          Stats
        </Link>
      </CardContent>
    </WidgetFrame>
  );
}

const GOAL_SOURCE_LABELS = {
  "net-worth": "net worth",
  cash: "cash",
  investments: "investments",
} as const;

function SavingsGoalWidget({ widget }: { widget: Widget }) {
  const balances = useBalances();
  const source = widget.options?.source ?? "cash";
  const target = widget.options?.target ?? 10000;
  const current = source === "net-worth" ? balances.netWorth : balances[source];
  const pct = Math.max(0, Math.min(100, (current / target) * 100));
  const done = current >= target;
  const barClass = useBarClass(widget);

  return (
    <WidgetFrame widget={widget}>
      <CardHeader className="pb-2">
        <CardTitle className={titleClass}>
          {widget.options?.emoji ? `${widget.options.emoji} ` : ""}
          {widgetTitle(widget)}
        </CardTitle>
        <CardDescription>
          Tracking your {GOAL_SOURCE_LABELS[source]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <Money value={current} className="text-xl font-bold text-foreground dark:text-white" />
          {" of "}
          <Money value={target} />
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
          <div
            className={cn("h-full rounded-full transition-all", barClass)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-medium text-accent">
          {done ? "Goal reached 🎉" : `${Math.floor(pct)}% there`}
        </p>
      </CardContent>
    </WidgetFrame>
  );
}

function NoteWidget({ widget }: { widget: Widget }) {
  return (
    <WidgetFrame widget={widget}>
      <CardHeader className="pb-2">
        <CardTitle className={titleClass}>
          {widget.options?.emoji ? `${widget.options.emoji} ` : ""}
          {widgetTitle(widget)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm text-foreground dark:text-zinc-200">
          {widget.options?.text || "Empty note — add some text in edit mode."}
        </p>
      </CardContent>
    </WidgetFrame>
  );
}

export function WidgetContent({ widget }: { widget: Widget }) {
  const balances = useBalances();
  switch (widget.type) {
    case "net-worth":
      return <MetricWidget widget={widget} value={balances.netWorth} icon={TrendingUp} />;
    case "cash":
      return <MetricWidget widget={widget} value={balances.cash} icon={Wallet} />;
    case "investments":
      return <MetricWidget widget={widget} value={balances.investments} icon={PiggyBank} />;
    case "accounts":
      return <AccountsWidget widget={widget} />;
    case "tag-spend":
      return <TagSpendWidget widget={widget} />;
    case "upcoming-recurring":
      return <UpcomingRecurringWidget widget={widget} />;
    case "recent-activity":
      return <RecentActivityWidget widget={widget} />;
    case "month-flow":
      return <MonthFlowWidget widget={widget} />;
    case "recurring-summary":
      return <RecurringSummaryWidget widget={widget} />;
    case "savings-rate":
      return <SavingsRateWidget widget={widget} />;
    case "biggest-expenses":
      return <BiggestExpensesWidget widget={widget} />;
    case "cash-flow-chart":
      return <CashFlowWidget />;
    case "quick-actions":
      return <QuickActionsWidget widget={widget} />;
    case "savings-goal":
      return <SavingsGoalWidget widget={widget} />;
    case "note":
      return <NoteWidget widget={widget} />;
  }
}
