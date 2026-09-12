"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCategories, createCategory } from "@/lib/queries/categories";
import type { CategoryType } from "@/lib/types/database";

import { Button } from "@/components/ui/button";

const DEFAULT_CATEGORIES: { name: string; type: CategoryType }[] = [
  { name: "Groceries", type: "expense" },
  { name: "Rent/Mortgage", type: "expense" },
  { name: "Utilities", type: "expense" },
  { name: "Transportation", type: "expense" },
  { name: "Dining Out", type: "expense" },
  { name: "Entertainment", type: "expense" },
  { name: "Health", type: "expense" },
  { name: "Shopping", type: "expense" },
  { name: "Subscriptions", type: "expense" },
  { name: "Insurance", type: "expense" },
  { name: "Salary", type: "income" },
  { name: "Freelance", type: "income" },
  { name: "Investments", type: "income" },
  { name: "Gifts", type: "income" },
];

export function RestoreDefaultCategoriesButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const existing = await getCategories(supabase);
      const existingNames = new Set(
        existing.map((c) => c.name.trim().toLowerCase()),
      );

      const missing = DEFAULT_CATEGORIES.filter(
        (c) => !existingNames.has(c.name.toLowerCase()),
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be logged in.");

      for (const category of missing) {
        await createCategory(supabase, { user_id: user.id, ...category });
      }

      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleClick}
      disabled={isLoading}
      className="h-11 rounded-2xl border border-[#e5e2da] dark:border-white/[0.07]"
    >
      {isLoading ? "Restoring..." : "Restore defaults"}
    </Button>
  );
}
