"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getTags, createTag } from "@/lib/queries/tags";
import { TAG_COLORS } from "@/lib/tag-colors";

import { Button } from "@/components/ui/button";

const DEFAULT_TAGS = [
  "Groceries",
  "Rent/Mortgage",
  "Utilities",
  "Transportation",
  "Dining Out",
  "Entertainment",
  "Health",
  "Shopping",
  "Subscriptions",
  "Insurance",
  "Salary",
  "Freelance",
  "Investments",
  "Gifts",
];

export function RestoreDefaultTagsButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const existing = await getTags(supabase);
      const existingNames = new Set(
        existing.map((t) => t.name.trim().toLowerCase()),
      );

      const missing = DEFAULT_TAGS.filter(
        (name) => !existingNames.has(name.toLowerCase()),
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be logged in.");

      for (let i = 0; i < missing.length; i++) {
        await createTag(supabase, {
          user_id: user.id,
          name: missing[i],
          color: TAG_COLORS[(existing.length + i) % TAG_COLORS.length],
        });
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
      className="h-11 rounded-2xl border border-border"
    >
      {isLoading ? "Restoring..." : "Restore defaults"}
    </Button>
  );
}
