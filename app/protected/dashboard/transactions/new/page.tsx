import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getInstitutions } from "@/lib/queries/institutions";
import { getTags } from "@/lib/queries/tags";
import { AddTransactionForm } from "@/components/forms/add-transaction-form";
import { PageLoading } from "@/components/ui/spinner";

async function NewTransactionForm() {
  const supabase = await createClient();
  const [institutions, tags] = await Promise.all([
    getInstitutions(supabase),
    getTags(supabase),
  ]);

  return <AddTransactionForm institutions={institutions} tags={tags} />;
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
