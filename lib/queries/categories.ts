import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  CategoryInsert,
  CategoryUpdate,
} from "@/lib/types/database";

export async function getCategories(
  supabase: SupabaseClient
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCategory(
  supabase: SupabaseClient,
  input: CategoryInsert
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(
  supabase: SupabaseClient,
  id: string,
  input: CategoryUpdate
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
