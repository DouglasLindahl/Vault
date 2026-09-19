"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteTransactionAction } from "@/lib/actions/transactions";
import { deleteRecurringTransactionAction } from "@/lib/actions/recurring-transactions";
import { deleteTag } from "@/lib/queries/tags";
import { deleteConversion } from "@/lib/queries/investments";

export function DeleteRowButton({
  kind,
  id,
}: {
  kind: "transaction" | "recurring-transaction" | "tag" | "investment";
  id: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsDeleting(true);
    setError(null);
    try {
      if (kind === "transaction") {
        await deleteTransactionAction(id);
      } else if (kind === "recurring-transaction") {
        await deleteRecurringTransactionAction(id);
      } else if (kind === "investment") {
        await deleteConversion(createClient(), id);
      } else {
        await deleteTag(createClient(), id);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't delete this.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDeleting}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-white/[0.04]"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {error && (
        <p className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl bg-red-500/[0.07] px-3 py-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
