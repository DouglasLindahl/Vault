import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getInstitutionById } from "@/lib/queries/institutions";
import { getTransactions } from "@/lib/queries/transactions";
import { getRecurringTransactions } from "@/lib/queries/recurring-transactions";
import { getInvestmentSummary } from "@/lib/queries/investments";
import { nextOccurrence } from "@/lib/recurrence";
import { AdjustBalanceDialog } from "@/components/forms/adjust-balance-dialog";
import { AddHoldingDialog } from "@/components/forms/add-holding-dialog";
import { DeleteRowButton } from "@/components/forms/delete-row-button";
import { DeleteInstitutionDialog } from "@/components/forms/delete-institution-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseDateOnly } from "@/lib/utils";

function currency(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const frequencyLabel = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  yearly: "Yearly",
} as const;

async function InstitutionDetail({ id }: { id: string }) {
  const supabase = await createClient();

  const institution = await getInstitutionById(supabase, id);
  if (!institution) notFound();

  const [transactions, recurring] = await Promise.all([
    getTransactions(supabase, { institutionId: id }),
    getRecurringTransactions(supabase, { institutionId: id }),
  ]);

  const categorySpend = (() => {
    const totals = new Map<string, number>();
    for (const t of transactions) {
      if (t.direction !== "out") continue;
      totals.set(t.categoryName, (totals.get(t.categoryName) ?? 0) + t.amount);
    }
    return Array.from(totals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  })();
  const maxSpend = Math.max(...categorySpend.map((c) => c.amount), 1);

  let holdingsView: Awaited<ReturnType<typeof getInvestmentSummary>>["positions"] = [];
  // For investment accounts the balance isn't a manually-adjusted
  // number — it's whatever the account is actually holding (crypto at
  // live price, uninvested cash 1:1, stock at invested amount).
  let investmentBalance = 0;

  if (institution.type === "investment") {
    const summary = await getInvestmentSummary(supabase, id);
    holdingsView = summary.positions;
    investmentBalance = summary.totalValue;
  }

  const displayBalance =
    institution.type === "investment" ? investmentBalance : institution.current_balance;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {institution.type === "bank" ? "Bank account" : "Investment account"}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
            {institution.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tabular-nums text-[#172033] dark:text-white">
            {currency(displayBalance)}
          </span>
          {institution.type === "bank" && (
            <AdjustBalanceDialog
              institutionId={institution.id}
              institutionName={institution.name}
              currentBalance={institution.current_balance}
            />
          )}
          <DeleteInstitutionDialog
            institutionId={institution.id}
            institutionName={institution.name}
          />
        </div>
      </div>

      {institution.type === "investment" && (
        <Card className="mb-6 rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base text-[#172033] dark:text-white">
              Holdings
            </CardTitle>
            <AddHoldingDialog institutionId={institution.id} />
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {holdingsView.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No holdings yet.
              </p>
            )}
            {holdingsView.map((h) => {
              const delta = h.value != null ? h.value - h.invested : null;
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-[#172033] dark:text-white">
                        {h.quantity} {h.symbol}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
                        {h.assetType}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {parseDateOnly(h.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-right">
                      {h.value != null ? (
                        <>
                          <p className="text-sm font-semibold tabular-nums text-[#172033] dark:text-white">
                            {currency(h.value)}
                          </p>
                          <p
                            className={
                              delta !== null && delta >= 0
                                ? "text-xs tabular-nums text-emerald-600 dark:text-emerald-400"
                                : "text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
                            }
                          >
                            {delta !== null && delta >= 0 ? "+" : ""}
                            {delta !== null ? currency(delta) : null} · {currency(h.invested)} invested
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          {currency(h.invested)} invested
                        </p>
                      )}
                    </div>
                    <DeleteRowButton kind="investment" id={h.id} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader>
            <CardTitle className="text-base text-[#172033] dark:text-white">
              Spending by category
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {categorySpend.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No spending logged for this account.
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

        <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader>
            <CardTitle className="text-base text-[#172033] dark:text-white">
              Recurring transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {recurring.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No recurring transactions for this account.
              </p>
            )}
            {recurring.map((r) => {
              const next = nextOccurrence(r.start_date, r.frequency);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#172033] dark:text-white">
                        {r.name ?? r.categoryName}
                      </p>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
                        {frequencyLabel[r.frequency]}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      next{" "}
                      {next.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={
                        r.direction === "in"
                          ? "text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
                          : "text-sm font-semibold tabular-nums text-[#172033] dark:text-white"
                      }
                    >
                      {r.direction === "in" ? currency(r.amount) : currency(-r.amount)}
                    </span>
                    <DeleteRowButton kind="recurring-transaction" id={r.id} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
        <CardHeader>
          <CardTitle className="text-base text-[#172033] dark:text-white">
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {transactions.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No transactions for this account.
            </p>
          )}
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
            >
              <div>
                <p className="text-sm font-medium text-[#172033] dark:text-white">
                  {t.name ?? t.categoryName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.categoryName} ·{" "}
                  {parseDateOnly(t.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={
                    t.direction === "in"
                      ? "text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
                      : "text-sm font-semibold tabular-nums text-[#172033] dark:text-white"
                  }
                >
                  {t.direction === "in" ? currency(t.amount) : currency(-t.amount)}
                </span>
                <DeleteRowButton kind="transaction" id={t.id} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

export default async function InstitutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="relative flex min-h-screen bg-zinc-50 dark:bg-[#0c0c0e]">
      <div className="flex-1 px-6 py-10 md:px-10">
        <Suspense>
          <InstitutionDetail id={id} />
        </Suspense>
      </div>
    </div>
  );
}
