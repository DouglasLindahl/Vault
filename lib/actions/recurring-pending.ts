"use server";

// getPendingRecurringEntries decrypts the joined recurring_transactions/
// institutions names (lib/queries/recurring-transaction-pending.ts), which
// makes it server-only — this is the client-callable wrapper.

import { createClient } from "@/lib/supabase/server";
import { getPendingRecurringEntries } from "@/lib/queries/recurring-transaction-pending";

export async function getPendingRecurringEntriesAction() {
  const supabase = await createClient();
  return getPendingRecurringEntries(supabase, { status: "pending" });
}
