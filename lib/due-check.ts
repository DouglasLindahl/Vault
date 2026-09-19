import type { SupabaseClient } from "@supabase/supabase-js";
import { getRecurringTransactions } from "@/lib/queries/recurring-transactions";
import { createTransaction, getRecurringOccurrenceKeys } from "@/lib/queries/transactions";
import {
  createPendingRecurringEntry,
  getExistingPendingKeys,
} from "@/lib/queries/recurring-transaction-pending";
import { createNotification } from "@/lib/queries/notifications";
import { getOccurrencesUpTo, formatDateOnly } from "@/lib/recurring-due";

// Runs on every authenticated page load (called from app/protected/layout.tsx)
// since this app has no cron/background job. Catches up any recurring
// occurrence that's due but hasn't been generated yet: fixed-amount
// recurring transactions become a transaction outright, "amount varies"
// ones become a pending entry + a notification asking the user to fill in
// the actual amount. Best-effort — the caller treats failures as non-fatal
// so a write hiccup here never breaks the dashboard.
export async function runRecurringDueCheck(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const [recurring, occurrenceKeys, pendingKeys] = await Promise.all([
    getRecurringTransactions(supabase, { activeOnly: true }),
    getRecurringOccurrenceKeys(supabase),
    getExistingPendingKeys(supabase),
  ]);

  for (const r of recurring) {
    const occurrences = getOccurrencesUpTo(r.start_date, r.frequency);

    for (const occurrence of occurrences) {
      const date = formatDateOnly(occurrence);
      const key = `${r.id}_${date}`;
      if (occurrenceKeys.has(key) || pendingKeys.has(key)) continue;

      if (r.is_estimate) {
        await createPendingRecurringEntry(supabase, {
          user_id: userId,
          recurring_transaction_id: r.id,
          due_date: date,
        });
        await createNotification(supabase, {
          user_id: userId,
          type: "recurring_amount_needed",
          title: `${r.name ?? r.institutionName} was due ${date} — enter the amount`,
          body: "This recurring transaction's amount varies each time — let us know what it actually was.",
          link: "/protected/dashboard/recurring-transactions",
        });
      } else {
        await createTransaction(supabase, {
          user_id: userId,
          institution_id: r.institution_id,
          recurring_transaction_id: r.id,
          name: r.name,
          amount: r.amount,
          direction: r.direction,
          date,
        });
      }
    }
  }
}
