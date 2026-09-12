import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTransactions } from "@/lib/queries/transactions";
import { getInstitutions } from "@/lib/queries/institutions";
import { getCategories } from "@/lib/queries/categories";
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

async function TransactionsList() {
  const supabase = await createClient();

  const [transactions, institutions, categories] = await Promise.all([
    getTransactions(supabase),
    getInstitutions(supabase),
    getCategories(supabase),
  ]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
          Transactions
        </h1>
        <AddTransactionDialog institutions={institutions} categories={categories} />
      </div>

      <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
        <CardHeader>
          <CardTitle className="text-base text-[#172033] dark:text-white">
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
              <div>
                <p className="text-sm font-medium text-[#172033] dark:text-white">
                  {t.name ?? t.categoryName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.institutionName} · {t.categoryName} ·{" "}
                  {new Date(t.date).toLocaleDateString(undefined, {
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

export default function TransactionsPage() {
  return (
    <div className="relative flex min-h-screen bg-zinc-50 dark:bg-[#0c0c0e]">
      <div className="flex-1 px-6 py-10 md:px-10">
        <Suspense>
          <TransactionsList />
        </Suspense>
      </div>
    </div>
  );
}
