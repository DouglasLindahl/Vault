import { createClient } from "@/lib/supabase/server";
import { getInstitutions } from "@/lib/queries/institutions";
import { getCategories } from "@/lib/queries/categories";
import { AddTransactionForm } from "@/components/forms/add-transaction-form";

export default async function NewTransactionPage() {
  const supabase = await createClient();
  const [institutions, categories] = await Promise.all([
    getInstitutions(supabase),
    getCategories(supabase),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <AddTransactionForm institutions={institutions} categories={categories} />
    </div>
  );
}
