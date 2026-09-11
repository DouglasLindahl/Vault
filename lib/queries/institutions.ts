import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Institution,
  InstitutionInsert,
  InstitutionUpdate,
} from "@/lib/types/database";

// RLS scopes every row to auth.uid() already, so these queries
// don't need an explicit user_id filter — Postgres enforces it.

export async function getInstitutions(
  supabase: SupabaseClient
): Promise<Institution[]> {
  const { data, error } = await supabase
    .from("institutions")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getInstitutionById(
  supabase: SupabaseClient,
  id: string
): Promise<Institution | null> {
  const { data, error } = await supabase
    .from("institutions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createInstitution(
  supabase: SupabaseClient,
  input: InstitutionInsert
): Promise<Institution> {
  const { data, error } = await supabase
    .from("institutions")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInstitution(
  supabase: SupabaseClient,
  id: string,
  input: InstitutionUpdate
): Promise<Institution> {
  const { data, error } = await supabase
    .from("institutions")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInstitution(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("institutions").delete().eq("id", id);
  if (error) throw error;
}
