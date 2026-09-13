import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getInstitutions } from "@/lib/queries/institutions";
import { getCategories } from "@/lib/queries/categories";
import { AddTransactionForm } from "@/components/forms/add-transaction-form";
import { PageLoading } from "@/components/ui/spinner";

async function NewTransactionForm() {
  const supabase = await createClient();
  const [institutions, categories] = await Promise.all([
    getInstitutions(supabase),
    getCategories(supabase),
  ]);

  return (
    <AddTransactionForm institutions={institutions} categories={categories} />
  );
}

export default function NewTransactionPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Suspense fallback={<PageLoading />}>
        <NewTransactionForm />
      </Suspense>
    </div>
  );
}
