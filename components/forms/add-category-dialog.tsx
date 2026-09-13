"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddCategoryForm } from "@/components/forms/add-category-form";
import { RestoreDefaultCategoriesButton } from "@/components/forms/restore-default-categories-button";
import { DeleteRowButton } from "@/components/forms/delete-row-button";
import { useDashboardData } from "@/app/protected/dashboard/dashboard-provider";

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { categories } = useDashboardData();

  const expense = categories.filter((c) => c.type === "expense");
  const income = categories.filter((c) => c.type === "income");

  function handleSuccess() {
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-xl border border-[#e5e2da] text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add category
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto rounded-[28px] border-[#e5e2da] dark:border-white/[0.07]">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#172033] dark:text-white">
            Categories
          </DialogTitle>
          <DialogDescription>
            Add a new category or manage your existing ones.
          </DialogDescription>
        </DialogHeader>

        <AddCategoryForm onSuccess={handleSuccess} />

        <div className="flex flex-col gap-4 border-t border-[#e5e2da] pt-4 dark:border-white/[0.07]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#172033] dark:text-white">
              Existing categories
            </p>
            <RestoreDefaultCategoriesButton />
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Expense
            </p>
            {expense.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No expense categories yet.
              </p>
            )}
            {expense.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
              >
                <span className="text-sm text-[#172033] dark:text-white">
                  {c.name}
                </span>
                <DeleteRowButton kind="category" id={c.id} />
              </div>
            ))}
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Income
            </p>
            {income.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No income categories yet.
              </p>
            )}
            {income.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
              >
                <span className="text-sm text-[#172033] dark:text-white">
                  {c.name}
                </span>
                <DeleteRowButton kind="category" id={c.id} />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
