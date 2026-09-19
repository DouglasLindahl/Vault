import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTags } from "@/lib/queries/tags";
import { getInstitutions } from "@/lib/queries/institutions";
import { getTransactions } from "@/lib/queries/transactions";
import { getRecurringTransactions } from "@/lib/queries/recurring-transactions";
import { getInvestmentSummary } from "@/lib/queries/investments";
import { runRecurringDueCheck } from "@/lib/due-check";
import { isAdminEmail } from "@/lib/admin";
import { DashboardProvider } from "@/app/protected/dashboard/dashboard-provider";
import { DashboardNav } from "@/components/nav/dashboard-nav";
import { PendingAmountBanner } from "@/components/recurring/pending-amount-banner";
import { PageLoading } from "@/components/ui/spinner";
import type {
  DashboardData,
  Institution,
  RecurringTransaction,
  Transaction,
  TagOption,
} from "@/lib/types";

async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    try {
      await runRecurringDueCheck(supabase, user.id);
    } catch (err) {
      console.error("Recurring due-check failed:", err);
    }
  }

  const [tags, institutionRows, transactionRows, recurringRows] = await Promise.all([
    getTags(supabase),
    getInstitutions(supabase),
    getTransactions(supabase, { limit: 200 }),
    getRecurringTransactions(supabase, { activeOnly: true }),
  ]);

  // Investment accounts don't carry a manually-adjusted balance — it's
  // whatever the account is actually holding (crypto at live price,
  // uninvested cash 1:1, stock at invested amount).
  const investmentRows = institutionRows.filter((row) => row.type === "investment");
  const investmentSummaries = await Promise.all(
    investmentRows.map((row) => getInvestmentSummary(supabase, row.id)),
  );
  const investmentBalanceById = new Map(
    investmentRows.map((row, i) => [row.id, investmentSummaries[i].totalValue]),
  );

  const institutions: Institution[] = institutionRows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    balance: investmentBalanceById.get(row.id) ?? row.current_balance,
  }));

  const transactions: Transaction[] = transactionRows.map((row) => ({
    id: row.id,
    name: row.name,
    tags: row.tags,
    institutionName: row.institutionName,
    amount: row.amount,
    direction: row.direction,
    date: row.date,
  }));

  const recurringTransactions: RecurringTransaction[] = recurringRows.map((row) => ({
    id: row.id,
    name: row.name,
    tags: row.tags,
    institutionName: row.institutionName,
    amount: row.amount,
    direction: row.direction,
    frequency: row.frequency,
    startDate: row.start_date,
  }));

  const tagOptions: TagOption[] = tags.map((t) => ({ id: t.id, name: t.name, color: t.color }));

  return {
    institutions,
    transactions,
    recurringTransactions,
    tags: tagOptions,
    isAdmin: isAdminEmail(user?.email),
  };
}

async function DashboardShell({ children }: { children: React.ReactNode }) {
  const data = await getDashboardData();

  return (
    <DashboardProvider data={data}>
      <DashboardNav />
      <PendingAmountBanner />
      {children}
    </DashboardProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<PageLoading />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
