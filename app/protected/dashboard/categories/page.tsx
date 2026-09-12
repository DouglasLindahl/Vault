import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries/categories";
import { AddCategoryDialog } from "@/components/forms/add-category-dialog";
import { RestoreDefaultCategoriesButton } from "@/components/forms/restore-default-categories-button";
import { DeleteRowButton } from "@/components/forms/delete-row-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function CategoriesList() {
  const supabase = await createClient();
  const categories = await getCategories(supabase);

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
          Categories
        </h1>
        <div className="flex items-center gap-3">
          <AddCategoryDialog />
          <RestoreDefaultCategoriesButton />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader>
            <CardTitle className="text-base text-[#172033] dark:text-white">
              Expense
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {expense.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No expense categories yet.
              </p>
            )}
            {expense.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
              >
                <span className="text-sm font-medium text-[#172033] dark:text-white">
                  {c.name}
                </span>
                <DeleteRowButton kind="category" id={c.id} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader>
            <CardTitle className="text-base text-[#172033] dark:text-white">
              Income
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {income.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No income categories yet.
              </p>
            )}
            {income.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
              >
                <span className="text-sm font-medium text-[#172033] dark:text-white">
                  {c.name}
                </span>
                <DeleteRowButton kind="category" id={c.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function CategoriesPage() {
  return (
    <div className="relative flex min-h-screen bg-zinc-50 dark:bg-[#0c0c0e]">
      <div className="flex-1 px-6 py-10 md:px-10">
        <Suspense>
          <CategoriesList />
        </Suspense>
      </div>
    </div>
  );
}
