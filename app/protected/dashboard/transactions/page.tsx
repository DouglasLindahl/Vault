import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTransactions } from "@/lib/queries/transactions";
import { getInstitutions } from "@/lib/queries/institutions";
import { getTags } from "@/lib/queries/tags";
import { AddTransactionDialog } from "@/components/forms/add-transaction-dialog";
import { DeleteRowButton } from "@/components/forms/delete-row-button";
import { TagChips } from "@/components/tag-chips";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/spinner";
import { parseDateOnly } from "@/lib/utils";

function currency(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function TransactionsList() {
  const supabase = await createClient();

  const [transactions, institutions, tags] = await Promise.all([
    getTransactions(supabase),
    getInstitutions(supabase),
    getTags(supabase),
  ]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
          Transactions
        </h1>
        <AddTransactionDialog institutions={institutions} tags={tags} />
      </div>

      <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base text-foreground dark:text-white">
            All transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {transactions.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No transactions yet.
            </p>
          )}
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground dark:text-white">
                  {t.name ?? (t.direction === "in" ? "Income" : "Expense")}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {t.institutionName} ·{" "}
                  {parseDateOnly(t.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div className="mt-1">
                  <TagChips tags={t.tags} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={
                    t.direction === "in"
                      ? "text-sm font-semibold tabular-nums text-success"
                      : "text-sm font-semibold tabular-nums text-foreground dark:text-white"
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

export default function TransactionsPage() {
  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="flex-1 px-6 py-10 md:px-10">
        <Suspense fallback={<PageLoading />}>
          <TransactionsList />
        </Suspense>
      </div>
    </div>
  );
}
