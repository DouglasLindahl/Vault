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

// ---------------------------------------------------------------------
// Balances
//
// A bank balance is *derived*, never incrementally patched:
//
//   balance = starting_balance + Σ signed(transactions dated >= starting_balance_date)
//
// `starting_balance`/`starting_balance_date` are the "anchor": what the
// user said the balance was on that date (set when the institution is
// created and every time they use "Adjust balance"). Transactions dated
// before the anchor are already reflected in it, so they don't count —
// which is what makes backdated recurring catch-ups and pending "amount
// varies" entries line up with a balance the user copied from their bank.
//
// This replaced a running `current_balance += delta` (read-then-write on
// every insert/delete, racing with the due-check that runs on every page
// load). `current_balance` is still written on anchor changes as a
// snapshot, but only used for rows not yet migrated (`balance_anchored`
// false — see migrateLegacyBalances).
// ---------------------------------------------------------------------

function roundCents(n: number) {
  return Math.round(n * 100) / 100;
}

type BalanceTxn = { institution_id: string; direction: "in" | "out"; amount: number; date: string };

async function getBalanceTransactions(
  supabase: SupabaseClient,
  institutionId?: string,
): Promise<BalanceTxn[]> {
  let query = supabase.from("transactions").select("institution_id, direction, amount, date");
  if (institutionId) query = query.eq("institution_id", institutionId);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as (Omit<BalanceTxn, "amount"> & { amount: string })[]).map((t) => ({
    ...t,
    amount: decryptAmount(t.amount),
  }));
}

function sumSince(txns: BalanceTxn[], institutionId: string, fromDate: string) {
  let sum = 0;
  for (const t of txns) {
    if (t.institution_id !== institutionId || t.date < fromDate) continue;
    sum += t.direction === "in" ? t.amount : -t.amount;
  }
  return sum;
}

function withDerivedBalance(row: Institution, txns: BalanceTxn[]): Institution {
  if (!row.balance_anchored) return row;
  return {
    ...row,
    current_balance: roundCents(
      row.starting_balance + sumSince(txns, row.id, row.starting_balance_date),
    ),
  };
}

export async function getInstitutions(
  supabase: SupabaseClient
): Promise<Institution[]> {
  const [{ data, error }, txns] = await Promise.all([
    supabase.from("institutions").select("*").order("sort_order", { ascending: true }),
    getBalanceTransactions(supabase),
  ]);

  if (error) throw error;
  return (data ?? []).map((row) => withDerivedBalance(decryptRow(row), txns));
}

export async function getInstitutionById(
  supabase: SupabaseClient,
  id: string
): Promise<Institution | null> {
  const [{ data, error }, txns] = await Promise.all([
    supabase.from("institutions").select("*").eq("id", id).maybeSingle(),
    getBalanceTransactions(supabase, id),
  ]);

  if (error) throw error;
  return data ? withDerivedBalance(decryptRow(data), txns) : null;
}

// "The balance is `balance` as of `asOfDate`" — used by Adjust balance.
// Transactions already dated on/after that day are part of the new figure,
// so they're subtracted out of the anchor to avoid counting them twice.
export async function setInstitutionBalance(
  supabase: SupabaseClient,
  id: string,
  balance: number,
  asOfDate: string,
): Promise<void> {
  const txns = await getBalanceTransactions(supabase, id);
  await updateInstitution(supabase, id, {
    starting_balance: roundCents(balance - sumSince(txns, id, asOfDate)),
    starting_balance_date: asOfDate,
    current_balance: roundCents(balance),
    balance_anchored: true,
  });
}

// One-time move of pre-derived-balance institutions onto the anchor model,
// keeping whatever balance they show right now (their stored
// current_balance, which already includes every transaction so far).
// Must run before the recurring due-check, which no longer touches
// current_balance. See supabase/sql/phase10_derived_balances.sql.
export async function migrateLegacyBalances(
  supabase: SupabaseClient,
  today: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("institutions")
    .select("*")
    .eq("balance_anchored", false);
  if (error) throw error;
  if (!data?.length) return;

  const txns = await getBalanceTransactions(supabase);
  for (const raw of data) {
    const row = decryptRow(raw);
    // Guarded on balance_anchored = false so a concurrent request that
    // already migrated this row (and may have generated new transactions
    // since) isn't overwritten.
    const { error: updateError } = await supabase
      .from("institutions")
      .update(
        encryptFields({
          starting_balance: roundCents(row.current_balance - sumSince(txns, row.id, today)),
          starting_balance_date: today,
          balance_anchored: true,
        }),
      )
      .eq("id", row.id)
      .eq("balance_anchored", false);
    if (updateError) throw updateError;
  }
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
        balance_anchored: true,
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
