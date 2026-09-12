import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries/categories";
import { getInvestmentSummary } from "@/lib/queries/investments";
import { DashboardProvider } from "@/app/protected/dashboard/dashboard-provider";
import { DashboardNav } from "@/components/nav/dashboard-nav";
import type {
  DashboardData,
  Institution,
  RecurringTransaction,
  Transaction,
} from "@/lib/types";

async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const categories = await getCategories(supabase);

  const { data: institutionRows } = await supabase
    .from("institutions")
    .select("id, name, type, current_balance, sort_order")
    .order("sort_order", { ascending: true });

  // Investment accounts don't carry a manually-adjusted balance — it's
  // whatever the account is actually holding (crypto at live price,
  // uninvested cash 1:1, stock at invested amount).
  const investmentRows = (institutionRows ?? []).filter(
    (row) => row.type === "investment",
  );
  const investmentSummaries = await Promise.all(
    investmentRows.map((row) => getInvestmentSummary(supabase, row.id)),
  );
  const investmentBalanceById = new Map(
    investmentRows.map((row, i) => [row.id, investmentSummaries[i].totalValue]),
  );

  const institutions: Institution[] = (institutionRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    balance: investmentBalanceById.get(row.id) ?? row.current_balance,
  }));

  const { data: transactionRows } = await supabase
    .from("transactions")
    .select(
      "id, name, amount, direction, date, categories(name), institutions(name)",
    )
    .order("date", { ascending: false })
    .limit(200);

  const transactions: Transaction[] = (transactionRows ?? []).map(
    (row: any) => ({
      id: row.id,
      name: row.name,
      category: row.categories?.name ?? "Uncategorized",
      institutionName: row.institutions?.name ?? "Unknown",
      amount: row.amount,
      direction: row.direction,
      date: row.date,
    }),
  );

  const { data: recurringRows } = await supabase
    .from("recurring_transactions")
    .select(
      "id, name, amount, direction, frequency, start_date, categories(name), institutions(name)",
    )
    .eq("active", true);

  const recurringTransactions: RecurringTransaction[] = (
    recurringRows ?? []
  ).map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.categories?.name ?? "Uncategorized",
    institutionName: row.institutions?.name ?? "Unknown",
    amount: row.amount,
    direction: row.direction,
    frequency: row.frequency,
    startDate: row.start_date,
  }));

  return { institutions, transactions, recurringTransactions, categories };
}

async function DashboardData({ children }: { children: React.ReactNode }) {
  const data = await getDashboardData();

  return <DashboardProvider data={data}>{children}</DashboardProvider>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense>
        <DashboardNav />
      </Suspense>
      <Suspense>
        <DashboardData>{children}</DashboardData>
      </Suspense>
    </>
  );
}
