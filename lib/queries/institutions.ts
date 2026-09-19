import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Institution,
  InstitutionInsert,
  InstitutionUpdate,
} from "@/lib/types/database";
import { decryptAmount, decryptNullable, encryptAmount, encryptNullable } from "@/lib/encryption";

// RLS scopes every row to auth.uid() already, so these queries
// don't need an explicit user_id filter — Postgres enforces it.

// `name`/`starting_balance`/`current_balance` are encrypted at rest (see
// supabase/sql/phase7_encryption.sql).
type RawInstitutionRow = Omit<Institution, "name" | "starting_balance" | "current_balance"> & {
  name: string;
  starting_balance: string;
  current_balance: string;
};

function decryptRow(row: RawInstitutionRow): Institution {
  return {
    ...row,
    name: decryptNullable(row.name) as string,
    starting_balance: decryptAmount(row.starting_balance),
    current_balance: decryptAmount(row.current_balance),
  };
}

function encryptFields<
  T extends { name?: string; starting_balance?: number; current_balance?: number },
>(input: T): T {
  const result = { ...input };
  if ("name" in result) result.name = encryptNullable(result.name) as T["name"];
  if ("starting_balance" in result && result.starting_balance !== undefined) {
    result.starting_balance = encryptAmount(result.starting_balance) as unknown as T["starting_balance"];
  }
  if ("current_balance" in result && result.current_balance !== undefined) {
    result.current_balance = encryptAmount(result.current_balance) as unknown as T["current_balance"];
  }
  return result;
}

export async function getInstitutions(
  supabase: SupabaseClient
): Promise<Institution[]> {
  const { data, error } = await supabase
    .from("institutions")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(decryptRow);
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
  return data ? decryptRow(data) : null;
}

export async function createInstitution(
  supabase: SupabaseClient,
  input: InstitutionInsert
): Promise<Institution> {
  const { data, error } = await supabase
    .from("institutions")
    .insert(
      encryptFields({
        ...input,
        current_balance: input.current_balance ?? input.starting_balance ?? 0,
      }),
    )
    .select()
    .single();

  if (error) throw error;
  return decryptRow(data);
}

export async function updateInstitution(
  supabase: SupabaseClient,
  id: string,
  input: InstitutionUpdate
): Promise<Institution> {
  const { data, error } = await supabase
    .from("institutions")
    .update(encryptFields(input))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return decryptRow(data);
}

// Replaces the DB trigger `apply_transaction_to_balance`, which can no
// longer do arithmetic directly on `current_balance` now that it's an
// encrypted column — see lib/queries/transactions.ts, which calls this
// after every insert/update/delete instead. Not atomic the way the old
// trigger was (read-then-write instead of a single UPDATE), which is an
// acceptable trade-off for a single-user app but could race under truly
// concurrent writes to the same institution.
export async function adjustInstitutionBalance(
  supabase: SupabaseClient,
  institutionId: string,
  delta: number,
): Promise<void> {
  const institution = await getInstitutionById(supabase, institutionId);
  if (!institution) return;
  await updateInstitution(supabase, institutionId, {
    current_balance: institution.current_balance + delta,
  });
}

export async function deleteInstitution(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("institutions").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderInstitutions(
  supabase: SupabaseClient,
  orderedIds: string[]
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      updateInstitution(supabase, id, { sort_order: index })
    )
  );
}
