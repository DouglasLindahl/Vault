import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTransactions } from "@/lib/queries/transactions";
import { getInstitutions } from "@/lib/queries/institutions";
import { getTags } from "@/lib/queries/tags";
import { AddTransactionDialog } from "@/components/forms/add-transaction-dialog";
import { TransactionsList } from "@/components/transactions/transactions-list";
import { PageLoading } from "@/components/ui/spinner";

async function TransactionsContent() {
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

      <TransactionsList transactions={transactions} institutions={institutions} />
    </>
  );
}

export default function TransactionsPage() {
  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="flex-1 px-6 py-10 md:px-10">
        <Suspense fallback={<PageLoading />}>
          <TransactionsContent />
        </Suspense>
      </div>
    </div>
  );
}
