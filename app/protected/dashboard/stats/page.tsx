import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getInstitutions } from "@/lib/queries/institutions";
import { getTransactions } from "@/lib/queries/transactions";
import { getInvestmentSummary } from "@/lib/queries/investments";
import { StatsCharts } from "@/components/charts/stats-charts";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { InvestmentsChart } from "@/components/charts/investments-chart";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/spinner";

function currency(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function StatsContent() {
  const supabase = await createClient();

  const [institutions, transactions] = await Promise.all([
    getInstitutions(supabase),
    getTransactions(supabase),
  ]);

  const categorySpend = new Map<string, number>();
  for (const t of transactions) {
    if (t.direction !== "out") continue;
    categorySpend.set(
      t.categoryName,
      (categorySpend.get(t.categoryName) ?? 0) + t.amount,
    );
  }
  const spendingByCategory = Array.from(categorySpend.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const totalIncome = transactions
    .filter((t) => t.direction === "in")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.direction === "out")
    .reduce((s, t) => s + t.amount, 0);

  // Investment accounts don't carry a manually-adjusted balance — it's
  // whatever the account is actually holding (crypto at live price,
  // uninvested cash 1:1, stock at invested amount).
  const investmentInstitutions = institutions.filter((i) => i.type === "investment");
  const investmentSummaries = await Promise.all(
    investmentInstitutions.map((i) => getInvestmentSummary(supabase, i.id)),
  );
  const investmentBalanceById = new Map(
    investmentInstitutions.map((i, idx) => [i.id, investmentSummaries[idx].totalValue]),
  );

  const netWorth = institutions.reduce(
    (s, a) => s + (investmentBalanceById.get(a.id) ?? a.current_balance),
    0,
  );
  const balanceByAccount = institutions
    .map((a) => ({
      name: a.name,
      balance: investmentBalanceById.get(a.id) ?? a.current_balance,
    }))
    .sort((a, b) => b.balance - a.balance);

  const allPositions = investmentSummaries.flatMap((s) => s.positions);
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
        <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
          Stats
        </h1>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader className="pb-2">
            <CardDescription>Net worth</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-[#172033] dark:text-white">
              {currency(netWorth)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader className="pb-2">
            <CardDescription>Total income</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-[#172033] dark:text-white">
              {currency(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader className="pb-2">
            <CardDescription>Total spending</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-[#172033] dark:text-white">
              {currency(totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <CashFlowChart
          transactions={transactions.map((t) => ({
            date: t.date,
            direction: t.direction,
            amount: t.amount,
          }))}
        />
      </div>

      {investmentInstitutions.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-[#172033] dark:text-white">
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
        spendingByCategory={spendingByCategory}
        balanceByAccount={balanceByAccount}
      />
    </>
  );
}

export default function StatsPage() {
  return (
    <div className="relative flex min-h-screen bg-zinc-50 dark:bg-[#0c0c0e]">
      <div className="flex-1 px-6 py-10 md:px-10">
        <Suspense fallback={<PageLoading />}>
          <StatsContent />
        </Suspense>
      </div>
    </div>
  );
}
