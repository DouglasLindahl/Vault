import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RecurringTransaction,
  RecurringTransactionInsert,
  RecurringTransactionUpdate,
  RecurringTransactionWithRelations,
} from "@/lib/types/database";
import { decryptAmount, decryptNullable, encryptAmount, encryptNullable } from "@/lib/encryption";

const WITH_RELATIONS_SELECT =
  "*, institutions(name), recurring_transaction_tags(tags(id,name,color))" as const;
const WITH_RELATIONS_SELECT_INNER_TAGS =
  "*, institutions(name), recurring_transaction_tags!inner(tags(id,name,color))" as const;

// `name`/`amount` are encrypted at rest (see supabase/sql/phase7_encryption.sql).
type RawRecurringTransactionRow = Omit<RecurringTransaction, "name" | "amount"> & {
  name: string | null;
  amount: string;
};

function decryptRow(row: RawRecurringTransactionRow): RecurringTransaction {
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

function mapWithRelations(row: any): RecurringTransactionWithRelations {
  const { institutions, recurring_transaction_tags, ...rest } = row;
  return {
    ...decryptRow(rest),
    tags: (recurring_transaction_tags ?? [])
      .map((jt: any) => jt.tags)
      .filter(Boolean),
    institutionName: institutions?.name ?? "Unknown",
  };
}

export async function getRecurringTransactions(
  supabase: SupabaseClient,
  options?: { institutionId?: string; activeOnly?: boolean; tagIds?: string[] }
): Promise<RecurringTransactionWithRelations[]> {
  const hasTagFilter = !!options?.tagIds?.length;
  let query = supabase
    .from("recurring_transactions")
    .select(hasTagFilter ? WITH_RELATIONS_SELECT_INNER_TAGS : WITH_RELATIONS_SELECT);

  if (options?.institutionId) {
    query = query.eq("institution_id", options.institutionId);
  }
  if (options?.activeOnly) {
    query = query.eq("active", true);
  }
  if (hasTagFilter) {
    query = query.in("recurring_transaction_tags.tag_id", options!.tagIds!);
  }

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapWithRelations);
}

export async function createRecurringTransaction(
  supabase: SupabaseClient,
  input: RecurringTransactionInsert
): Promise<RecurringTransaction> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .insert(encryptFields(input))
    .select()
    .single();

  if (error) throw error;
  return decryptRow(data);
}

export async function setRecurringTransactionTags(
  supabase: SupabaseClient,
  recurringTransactionId: string,
  tagIds: string[]
): Promise<void> {
  if (tagIds.length === 0) return;
  const { error } = await supabase.from("recurring_transaction_tags").insert(
    tagIds.map((tagId) => ({
      recurring_transaction_id: recurringTransactionId,
      tag_id: tagId,
    })),
  );
  if (error) throw error;
}

export async function updateRecurringTransaction(
  supabase: SupabaseClient,
  id: string,
  input: RecurringTransactionUpdate
): Promise<RecurringTransaction> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .update(encryptFields(input))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return decryptRow(data);
}

export async function deleteRecurringTransaction(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  // recurring_transaction_tags has no ON DELETE CASCADE on
  // recurring_transaction_id, so an attached tag blocks the delete with a
  // foreign-key violation unless we clear it first (same issue as
  // transaction_tags in lib/queries/transactions.ts).
  await supabase.from("recurring_transaction_tags").delete().eq("recurring_transaction_id", id);

  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
