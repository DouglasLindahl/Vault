import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PendingStatus,
  RecurringTransactionPending,
  RecurringTransactionPendingInsert,
  RecurringTransactionPendingWithRelations,
} from "@/lib/types/database";
import { decryptNullable } from "@/lib/encryption";

const WITH_RELATIONS_SELECT =
  "*, recurring_transactions(name, direction, institution_id, institutions(name))" as const;

type PendingRow = RecurringTransactionPending & {
  recurring_transactions: {
    name: string | null;
    direction: RecurringTransactionPendingWithRelations["direction"];
    institution_id: string;
    institutions: { name: string } | null;
  } | null;
};

// The joined `recurring_transactions.name`/`institutions.name` are
// encrypted at rest (see supabase/sql/phase7_encryption.sql) — decrypt
// them here so this stays the only place that needs to know that. This
// import of lib/encryption.ts means every function in this file is
// server-only now; see lib/actions/recurring-pending.ts for the client-
// callable wrapper.
function mapWithRelations(row: PendingRow): RecurringTransactionPendingWithRelations {
  const { recurring_transactions, ...rest } = row;
  return {
    ...rest,
    name: decryptNullable(recurring_transactions?.name),
    direction: recurring_transactions?.direction ?? "out",
    institutionId: recurring_transactions?.institution_id ?? "",
    institutionName: recurring_transactions?.institutions?.name
      ? (decryptNullable(recurring_transactions.institutions.name) as string)
      : "Unknown",
  };
}

export async function getPendingRecurringEntries(
  supabase: SupabaseClient,
  options?: { status?: PendingStatus }
): Promise<RecurringTransactionPendingWithRelations[]> {
  let query = supabase.from("recurring_transaction_pending").select(WITH_RELATIONS_SELECT);
  if (options?.status) query = query.eq("status", options.status);
  query = query.order("due_date", { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapWithRelations);
}

// Every (recurring_transaction_id, due_date) pair that already has a
// pending/completed/skipped row — used by the due-check to avoid
// re-flagging an occurrence that's already been handled.
export async function getExistingPendingKeys(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("recurring_transaction_pending")
    .select("recurring_transaction_id, due_date");
  if (error) throw error;
  return new Set(
    ((data ?? []) as { recurring_transaction_id: string; due_date: string }[]).map(
      (r) => `${r.recurring_transaction_id}_${r.due_date}`,
    ),
  );
}

export async function createPendingRecurringEntry(
  supabase: SupabaseClient,
  input: RecurringTransactionPendingInsert
): Promise<RecurringTransactionPending> {
  const { data, error } = await supabase
    .from("recurring_transaction_pending")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completePendingRecurringEntry(
  supabase: SupabaseClient,
  id: string,
  transactionId: string
): Promise<void> {
  const { error } = await supabase
    .from("recurring_transaction_pending")
    .update({
      status: "completed",
      transaction_id: transactionId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}
