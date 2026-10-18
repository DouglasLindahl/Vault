import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getInstitutions } from "@/lib/queries/institutions";
import { getTransactions } from "@/lib/queries/transactions";
import { getRecurringTransactions } from "@/lib/queries/recurring-transactions";
import { getInvestmentSummary } from "@/lib/queries/investments";
import { StatsCharts } from "@/components/charts/stats-charts";
import { MONTHLY_MULTIPLIER } from "@/lib/recurrence";
import { getBaseCurrency } from "@/lib/queries/dashboard-layout";
import { getFxRates } from "@/lib/fx";
import { convert, formatMoney } from "@/lib/currency";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { InvestmentsChart } from "@/components/charts/investments-chart";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/spinner";

// Every figure on this page is in the user's display currency: amounts are
// converted from their institution's currency (holdings from USD) first.
async function StatsContent() {
  const supabase = await createClient();

  const [institutions, transactions, recurring, base, rates] = await Promise.all([
    getInstitutions(supabase),
    getTransactions(supabase),
    getRecurringTransactions(supabase, { activeOnly: true }),
    getBaseCurrency(supabase),
    getFxRates(),
  ]);
  const toBase = (amount: number, from: string) => convert(amount, from, base, rates);
  const currency = (n: number) => formatMoney(n, base);

  const recurringByInstitution = new Map<string, number>();
  const recurringByTag = new Map<string, number>();
  for (const r of recurring) {
    const monthly = toBase(
      (r.direction === "in" ? r.amount : -r.amount) * MONTHLY_MULTIPLIER[r.frequency],
      r.currency,
    );
    recurringByInstitution.set(
      r.institutionName,
      (recurringByInstitution.get(r.institutionName) ?? 0) + monthly,
    );
    if (r.tags.length === 0) {
      recurringByTag.set("Untagged", (recurringByTag.get("Untagged") ?? 0) + monthly);
    } else {
      for (const tag of r.tags) {
        recurringByTag.set(tag.name, (recurringByTag.get(tag.name) ?? 0) + monthly);
      }
    }
  }
  const recurringByInstitutionData = Array.from(recurringByInstitution.entries()).map(
    ([name, amount]) => ({ name, amount }),
  );
  const recurringByTagData = Array.from(recurringByTag.entries()).map(([name, amount]) => ({
    name,
    amount,
  }));

  // Converted once; everything below works in the display currency.
  const baseTransactions = transactions.map((t) => ({ ...t, amount: toBase(t.amount, t.currency) }));

  const tagSpend = new Map<string, number>();
  for (const t of baseTransactions) {
    if (t.direction !== "out") continue;
    if (t.tags.length === 0) {
      tagSpend.set("Untagged", (tagSpend.get("Untagged") ?? 0) + t.amount);
      continue;
    }
    for (const tag of t.tags) {
      tagSpend.set(tag.name, (tagSpend.get(tag.name) ?? 0) + t.amount);
    }
  }
  const spendingByTag = Array.from(tagSpend.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const totalIncome = baseTransactions
    .filter((t) => t.direction === "in")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = baseTransactions
    .filter((t) => t.direction === "out")
    .reduce((s, t) => s + t.amount, 0);

  // Investment accounts don't carry a manually-adjusted balance — it's
  // whatever the account is actually holding (crypto at live price,
  // uninvested cash 1:1, stock at invested amount), priced in USD.
  const investmentInstitutions = institutions.filter((i) => i.type === "investment");
  const investmentSummaries = await Promise.all(
    investmentInstitutions.map((i) => getInvestmentSummary(supabase, i.id)),
  );
  const investmentValueById = new Map(
    investmentInstitutions.map((i, idx) => [i.id, toBase(investmentSummaries[idx].totalValue, "USD")]),
  );

  const balanceInBase = (a: (typeof institutions)[number]) =>
    investmentValueById.get(a.id) ?? toBase(a.current_balance, a.currency);
  const netWorth = institutions.reduce((s, a) => s + balanceInBase(a), 0);
  const balanceByAccount = institutions
    .map((a) => ({ name: a.name, balance: balanceInBase(a) }))
    .sort((a, b) => b.balance - a.balance);

  const allPositions = investmentSummaries
    .flatMap((s) => s.positions)
    .map((p) => ({
      ...p,
      invested: toBase(p.invested, "USD"),
      value: p.value == null ? null : toBase(p.value, "USD"),
    }));
  const totalInvested = allPositions.reduce((s, p) => s + p.invested, 0);
  const totalInvestmentValue = allPositions.reduce((s, p) => s + (p.value ?? p.invested), 0);

  const byAssetTotals = new Map<string, { invested: number; value: number }>();
  for (const p of allPositions) {
    const entry = byAssetTotals.get(p.symbol) ?? { invested: 0, value: 0 };
    entry.invested += p.invested;
    entry.value += p.value ?? p.invested;
    byAssetTotals.set(p.symbol, entry);
  }
  const investmentsByAsset = Array.from(byAssetTotals.entries())
    .map(([symbol, totals]) => ({ symbol, ...totals }))
    .sort((a, b) => b.value - a.value);

  const investedByMonth = new Map<string, number>();
  for (const p of allPositions) {
    const key = p.date.slice(0, 7);
    investedByMonth.set(key, (investedByMonth.get(key) ?? 0) + p.invested);
  }
  let running = 0;
  const investedOverTime = Array.from(investedByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amount]) => {
      running += amount;
      const [year, month] = key.split("-").map(Number);
      const label = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });
      return { label, invested: running };
    });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
          Stats
        </h1>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Net worth</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-foreground dark:text-white">
              {currency(netWorth)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Total income</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-foreground dark:text-white">
              {currency(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Total spending</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-foreground dark:text-white">
              {currency(totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <CashFlowChart
          transactions={baseTransactions.map((t) => ({
            date: t.date,
            direction: t.direction,
            amount: t.amount,
          }))}
        />
      </div>

      {investmentInstitutions.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground dark:text-white">
            Investments
          </h2>
          <InvestmentsChart
            totalInvested={totalInvested}
            totalValue={totalInvestmentValue}
            byAsset={investmentsByAsset}
            investedOverTime={investedOverTime}
          />
        </div>
      )}

      <StatsCharts
        spendingByTag={spendingByTag}
        balanceByAccount={balanceByAccount}
        recurringByInstitution={recurringByInstitutionData}
        recurringByTag={recurringByTagData}
      />
    </>
  );
}

export default function StatsPage() {
  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="flex-1 px-6 py-10 md:px-10">
        <Suspense fallback={<PageLoading />}>
          <StatsContent />
        </Suspense>
      </div>
    </div>
  );
}
