import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getRecurringTransactions } from "@/lib/queries/recurring-transactions";
import { getInstitutions } from "@/lib/queries/institutions";
import { getCategories } from "@/lib/queries/categories";
import { nextOccurrence } from "@/lib/recurrence";
import { AddTransactionDialog } from "@/components/forms/add-transaction-dialog";
import { DeleteRowButton } from "@/components/forms/delete-row-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

async function RecurringTransactionsList() {
  const supabase = await createClient();

  const [recurring, institutions, categories] = await Promise.all([
    getRecurringTransactions(supabase),
    getInstitutions(supabase),
    getCategories(supabase),
  ]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
          Recurring transactions
        </h1>
        <AddTransactionDialog institutions={institutions} categories={categories} />
      </div>

      <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
        <CardHeader>
          <CardTitle className="text-base text-[#172033] dark:text-white">
            All recurring transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {recurring.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No recurring transactions yet. Toggle "Recurring" when adding a
              transaction to create one.
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
                    {!r.active && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {r.institutionName} · {r.categoryName} · next{" "}
                    {next.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
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
    </>
  );
}

export default function RecurringTransactionsPage() {
  return (
    <div className="relative flex min-h-screen bg-zinc-50 dark:bg-[#0c0c0e]">
      <div className="flex-1 px-6 py-10 md:px-10">
        <Suspense>
          <RecurringTransactionsList />
        </Suspense>
      </div>
    </div>
  );
}
