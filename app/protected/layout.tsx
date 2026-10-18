import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTags } from "@/lib/queries/tags";
import { getInstitutions, migrateLegacyBalances } from "@/lib/queries/institutions";
import { getTransactions } from "@/lib/queries/transactions";
import { formatDateOnly } from "@/lib/recurring-due";
import { getRecurringTransactions } from "@/lib/queries/recurring-transactions";
import { getInvestmentSummary } from "@/lib/queries/investments";
import { runRecurringDueCheck } from "@/lib/due-check";
import { syncLegalAcceptance } from "@/lib/legal-acceptance";
import { isAdminEmail } from "@/lib/admin";
import { getDashboardPrefs } from "@/lib/queries/dashboard-layout";
import { sanitizeLayout } from "@/lib/dashboard-layout";
import { convert, DEFAULT_CURRENCY } from "@/lib/currency";
import { getFxRates } from "@/lib/fx";
import { DashboardProvider } from "@/app/protected/dashboard/dashboard-provider";
import { DashboardNav } from "@/components/nav/dashboard-nav";
import { PendingAmountProvider } from "@/components/recurring/pending-amount-dialog";
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
    // Must run before the due-check: legacy balances are anchored to their
    // stored value, which doesn't include occurrences generated from now on.
    try {
      await migrateLegacyBalances(supabase, formatDateOnly(new Date()));
    } catch (err) {
      console.error("Balance migration failed:", err);
    }
    try {
      await runRecurringDueCheck(supabase, user.id);
    } catch (err) {
      console.error("Recurring due-check failed:", err);
    }
    try {
      await syncLegalAcceptance(supabase, user);
    } catch (err) {
      console.error("Legal-acceptance sync failed:", err);
    }
  }

  const [tags, institutionRows, transactionRows, recurringRows, prefs, fxRates] = await Promise.all([
    getTags(supabase),
    getInstitutions(supabase),
    // The dashboard's widest window is "Year" (last 365 days). A row-count
    // limit here used to cut that total short once there were >200 rows.
    getTransactions(supabase, {
      startDate: formatDateOnly(new Date(Date.now() - 366 * 24 * 60 * 60 * 1000)),
    }),
    getRecurringTransactions(supabase, { activeOnly: true }),
    user
      ? getDashboardPrefs(supabase, user.id)
      : Promise.resolve({
          displayName: null,
          baseCurrency: DEFAULT_CURRENCY,
          layout: sanitizeLayout(null),
        }),
    getFxRates(),
  ]);

  // Investment accounts don't carry a manually-adjusted balance — it's
  // whatever the account is actually holding (crypto at live price,
  // uninvested cash 1:1, stock at invested amount). Holdings are priced in
  // USD, so the total is converted into the institution's own currency.
  const investmentRows = institutionRows.filter((row) => row.type === "investment");
  const investmentSummaries = await Promise.all(
    investmentRows.map((row) => getInvestmentSummary(supabase, row.id)),
  );
  const investmentBalanceById = new Map(
    investmentRows.map((row, i) => [
      row.id,
      convert(investmentSummaries[i].totalValue, "USD", row.currency, fxRates),
    ]),
  );

  const institutions: Institution[] = institutionRows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    balance: investmentBalanceById.get(row.id) ?? row.current_balance,
    currency: row.currency,
  }));

  const transactions: Transaction[] = transactionRows.map((row) => ({
    id: row.id,
    name: row.name,
    tags: row.tags,
    institutionName: row.institutionName,
    amount: row.amount,
    currency: row.currency,
    direction: row.direction,
    date: row.date,
  }));

  const recurringTransactions: RecurringTransaction[] = recurringRows.map((row) => ({
    id: row.id,
    name: row.name,
    tags: row.tags,
    institutionName: row.institutionName,
    amount: row.amount,
    currency: row.currency,
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
    displayName: prefs.displayName,
    dashboardLayout: prefs.layout,
    baseCurrency: prefs.baseCurrency,
    fxRates,
  };
}

async function DashboardShell({ children }: { children: React.ReactNode }) {
  const data = await getDashboardData();

  return (
    <DashboardProvider data={data}>
      <PendingAmountProvider>
        <DashboardNav />
        {children}
      </PendingAmountProvider>
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
