import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries/categories";
import { AddInstitutionForm } from "@/components/forms/add-institution-form";

export default async function NewInstitutionPage() {
  const supabase = await createClient();
  const categories = await getCategories(supabase);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <AddInstitutionForm categories={categories} />
    </div>
  );
}
