import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Direction,
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionWithRelations,
} from "@/lib/types/database";
import { decryptAmount, decryptNullable, encryptAmount, encryptNullable } from "@/lib/encryption";
import { adjustInstitutionBalance } from "@/lib/queries/institutions";

function signedAmount(direction: Direction, amount: number): number {
  return direction === "in" ? amount : -amount;
}

const WITH_RELATIONS_SELECT =
  "*, institutions(name), transaction_tags(tags(id,name,color))" as const;
const WITH_RELATIONS_SELECT_INNER_TAGS =
  "*, institutions(name), transaction_tags!inner(tags(id,name,color))" as const;

// `name`/`amount` are encrypted at rest (see supabase/sql/phase7_encryption.sql)
// — decrypt on the way out, encrypt on the way in, so every other file keeps
// working against plain `string | null`/`number` values.
type RawTransactionRow = Omit<Transaction, "name" | "amount"> & {
  name: string | null;
  amount: string;
};

function decryptRow(row: RawTransactionRow): Transaction {
  return { ...row, name: decryptNullable(row.name), amount: decryptAmount(row.amount) };
}

function encryptFields<T extends { name?: string | null; amount?: number }>(input: T): T {
  const result = { ...input };
  if ("name" in result) result.name = encryptNullable(result.name) as T["name"];
  if ("amount" in result && result.amount !== undefined) {
    result.amount = encryptAmount(result.amount) as unknown as T["amount"];
  }
  return result;
}

function mapWithRelations(row: any): TransactionWithRelations {
  const { institutions, transaction_tags, ...rest } = row;
  return {
    ...decryptRow(rest),
    tags: (transaction_tags ?? [])
      .map((jt: any) => jt.tags)
      .filter(Boolean),
    // institutions.name is encrypted too — the joined value here is raw
    // ciphertext unless decrypted, same bug already fixed in
    // lib/queries/recurring-transaction-pending.ts.
    institutionName: institutions?.name ? (decryptNullable(institutions.name) as string) : "Unknown",
  };
}

export async function getTransactions(
  supabase: SupabaseClient,
  options?: {
    institutionId?: string;
    tagIds?: string[];
    startDate?: string; // inclusive, ISO date
    endDate?: string; // inclusive, ISO date
    limit?: number;
  }
): Promise<TransactionWithRelations[]> {
  const hasTagFilter = !!options?.tagIds?.length;
  let query = supabase
    .from("transactions")
    .select(hasTagFilter ? WITH_RELATIONS_SELECT_INNER_TAGS : WITH_RELATIONS_SELECT);

  if (options?.institutionId) query = query.eq("institution_id", options.institutionId);
  if (hasTagFilter) query = query.in("transaction_tags.tag_id", options!.tagIds!);
  if (options?.startDate) query = query.gte("date", options.startDate);
  if (options?.endDate) query = query.lte("date", options.endDate);

  query = query.order("date", { ascending: false });
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapWithRelations);
}

// Every (recurring_transaction_id, date) pair that already has a generated
// transaction — used by the due-check to avoid regenerating an occurrence.
export async function getRecurringOccurrenceKeys(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("transactions")
    .select("recurring_transaction_id, date")
    .not("recurring_transaction_id", "is", null);
  if (error) throw error;
  return new Set(
    ((data ?? []) as { recurring_transaction_id: string; date: string }[]).map(
      (r) => `${r.recurring_transaction_id}_${r.date}`,
    ),
  );
}

export async function getTransactionById(
  supabase: SupabaseClient,
  id: string
): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? decryptRow(data) : null;
}

// Keeps institutions.current_balance in sync with transactions — this used
// to be a DB trigger (`apply_transaction_to_balance`), but that trigger did
// `current_balance - amount` arithmetic directly in SQL, which broke once
// both columns became encrypted text. Replicated here instead, working
// against the decrypted values the query layer already has.
export async function createTransaction(
  supabase: SupabaseClient,
  input: TransactionInsert
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert(encryptFields(input))
    .select()
    .single();

  if (error) throw error;
  const transaction = decryptRow(data);

  await adjustInstitutionBalance(
    supabase,
    transaction.institution_id,
    signedAmount(transaction.direction, transaction.amount),
  );

  return transaction;
}

export async function setTransactionTags(
  supabase: SupabaseClient,
  transactionId: string,
  tagIds: string[]
): Promise<void> {
  if (tagIds.length === 0) return;
  const { error } = await supabase
    .from("transaction_tags")
    .insert(tagIds.map((tagId) => ({ transaction_id: transactionId, tag_id: tagId })));
  if (error) throw error;
}

export async function updateTransaction(
  supabase: SupabaseClient,
  id: string,
  input: TransactionUpdate
): Promise<Transaction> {
  const existing = await getTransactionById(supabase, id);
  if (!existing) throw new Error("Transaction not found.");

  const { data, error } = await supabase
    .from("transactions")
    .update(encryptFields(input))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  const updated = decryptRow(data);

  const oldDelta = signedAmount(existing.direction, existing.amount);
  const newDelta = signedAmount(updated.direction, updated.amount);

  if (existing.institution_id === updated.institution_id) {
    await adjustInstitutionBalance(supabase, updated.institution_id, newDelta - oldDelta);
  } else {
    await adjustInstitutionBalance(supabase, existing.institution_id, -oldDelta);
    await adjustInstitutionBalance(supabase, updated.institution_id, newDelta);
  }

  return updated;
}

export async function deleteTransaction(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const existing = await getTransactionById(supabase, id);

  // transaction_tags has no ON DELETE CASCADE on transaction_id, so an
  // attached tag blocks the delete with a foreign-key violation unless we
  // clear it first.
  await supabase.from("transaction_tags").delete().eq("transaction_id", id);

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;

  if (existing) {
    await adjustInstitutionBalance(
      supabase,
      existing.institution_id,
      -signedAmount(existing.direction, existing.amount),
    );
  }
}

// Removes the single most-recently-created transaction for the
// logged-in user (RLS scopes this automatically). Used for a
// quick "undo" action after manual entry.
export async function deleteLastTransaction(
  supabase: SupabaseClient
): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!data) return;

  const existing = decryptRow(data);

  await supabase.from("transaction_tags").delete().eq("transaction_id", data.id);

  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("id", data.id);

  if (deleteError) throw deleteError;

  await adjustInstitutionBalance(
    supabase,
    existing.institution_id,
    -signedAmount(existing.direction, existing.amount),
  );
}
