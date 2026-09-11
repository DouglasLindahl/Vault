import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionWithRelations,
} from "@/lib/types/database";

const WITH_RELATIONS_SELECT =
  "*, categories(name), institutions(name)" as const;

function mapWithRelations(row: any): TransactionWithRelations {
  const { categories, institutions, ...rest } = row;
  return {
    ...rest,
    categoryName: categories?.name ?? "Uncategorized",
    institutionName: institutions?.name ?? "Unknown",
  };
}

export async function getTransactions(
  supabase: SupabaseClient,
  options?: {
    institutionId?: string;
    categoryId?: string;
    startDate?: string; // inclusive, ISO date
    endDate?: string; // inclusive, ISO date
    limit?: number;
  }
): Promise<TransactionWithRelations[]> {
  let query = supabase.from("transactions").select(WITH_RELATIONS_SELECT);

  if (options?.institutionId) query = query.eq("institution_id", options.institutionId);
  if (options?.categoryId) query = query.eq("category_id", options.categoryId);
  if (options?.startDate) query = query.gte("date", options.startDate);
  if (options?.endDate) query = query.lte("date", options.endDate);

  query = query.order("date", { ascending: false });
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapWithRelations);
}

export async function createTransaction(
  supabase: SupabaseClient,
  input: TransactionInsert
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTransaction(
  supabase: SupabaseClient,
  id: string,
  input: TransactionUpdate
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

// Removes the single most-recently-created transaction for the
// logged-in user (RLS scopes this automatically). Used for a
// quick "undo" action after manual entry.
export async function deleteLastTransaction(
  supabase: SupabaseClient
): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from("transactions")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!data) return;

  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("id", data.id);

  if (deleteError) throw deleteError;
}
