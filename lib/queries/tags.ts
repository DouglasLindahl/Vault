import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tag, TagInsert, TagUpdate } from "@/lib/types/database";

export async function getTags(supabase: SupabaseClient): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createTag(
  supabase: SupabaseClient,
  input: TagInsert
): Promise<Tag> {
  const { data, error } = await supabase
    .from("tags")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTag(
  supabase: SupabaseClient,
  id: string,
  input: TagUpdate
): Promise<Tag> {
  const { data, error } = await supabase
    .from("tags")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTag(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw error;
}
