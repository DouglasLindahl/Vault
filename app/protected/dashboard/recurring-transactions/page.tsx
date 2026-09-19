import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getRecurringTransactions } from "@/lib/queries/recurring-transactions";
import { getInstitutions } from "@/lib/queries/institutions";
import { getTags } from "@/lib/queries/tags";
import { AddTransactionDialog } from "@/components/forms/add-transaction-dialog";
import { RecurringTransactionsList } from "@/components/recurring/recurring-transactions-list";
import { PageLoading } from "@/components/ui/spinner";

async function RecurringTransactionsContent() {
  const supabase = await createClient();

  const [recurring, institutions, tags] = await Promise.all([
    getRecurringTransactions(supabase),
    getInstitutions(supabase),
    getTags(supabase),
  ]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
          Recurring transactions
        </h1>
        <AddTransactionDialog institutions={institutions} tags={tags} />
      </div>

      <RecurringTransactionsList recurring={recurring} />
    </>
  );
}

export default function RecurringTransactionsPage() {
  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="flex-1 px-6 py-10 md:px-10">
        <Suspense fallback={<PageLoading />}>
          <RecurringTransactionsContent />
        </Suspense>
      </div>
    </div>
  );
}
