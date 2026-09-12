import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RecurringTransaction,
  RecurringTransactionInsert,
  RecurringTransactionUpdate,
  RecurringTransactionWithRelations,
} from "@/lib/types/database";

const WITH_RELATIONS_SELECT =
  "*, categories(name), institutions(name)" as const;

function mapWithRelations(row: any): RecurringTransactionWithRelations {
  const { categories, institutions, ...rest } = row;
  return {
    ...rest,
    categoryName: categories?.name ?? "Uncategorized",
    institutionName: institutions?.name ?? "Unknown",
  };
}

export async function getRecurringTransactions(
  supabase: SupabaseClient,
  options?: { institutionId?: string; activeOnly?: boolean }
): Promise<RecurringTransactionWithRelations[]> {
  let query = supabase
    .from("recurring_transactions")
    .select(WITH_RELATIONS_SELECT);

  if (options?.institutionId) {
    query = query.eq("institution_id", options.institutionId);
  }
  if (options?.activeOnly) {
    query = query.eq("active", true);
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
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecurringTransaction(
  supabase: SupabaseClient,
  id: string,
  input: RecurringTransactionUpdate
): Promise<RecurringTransaction> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecurringTransaction(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
