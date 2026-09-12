"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteTransaction } from "@/lib/queries/transactions";
import { deleteRecurringTransaction } from "@/lib/queries/recurring-transactions";
import { deleteCategory } from "@/lib/queries/categories";
import { deleteConversion } from "@/lib/queries/investments";

export function DeleteRowButton({
  kind,
  id,
}: {
  kind: "transaction" | "recurring-transaction" | "category" | "investment";
  id: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleClick() {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      if (kind === "transaction") {
        await deleteTransaction(supabase, id);
      } else if (kind === "recurring-transaction") {
        await deleteRecurringTransaction(supabase, id);
      } else if (kind === "investment") {
        await deleteConversion(supabase, id);
      } else {
        await deleteCategory(supabase, id);
      }
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDeleting}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-white/[0.04]"
      aria-label="Delete"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
