"use server";

// See lib/actions/transactions.ts for why these need to be server actions
// rather than being called directly from client components.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrency } from "@/lib/currency";
import {
  createInstitution,
  updateInstitution,
  setInstitutionBalance,
  deleteInstitution,
  reorderInstitutions,
} from "@/lib/queries/institutions";
import type { InstitutionType } from "@/lib/types/database";

// `asOfDate` is the user's local today (YYYY-MM-DD) — the server's UTC date
// can be a day off, which would shift which transactions count toward the
// balance anchor (see lib/queries/institutions.ts).
export async function createInstitutionAction(input: {
  name: string;
  type: InstitutionType;
  startingBalance: number;
  asOfDate: string;
  currency: string;
}) {
  if (!isCurrency(input.currency)) throw new Error("Unsupported currency.");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be logged in.");

  return createInstitution(supabase, {
    user_id: user.id,
    name: input.name,
    type: input.type,
    starting_balance: input.startingBalance,
    starting_balance_date: input.asOfDate,
    currency: input.currency,
  });
}

export async function updateInstitutionBalanceAction(
  id: string,
  currentBalance: number,
  asOfDate: string,
) {
  const supabase = await createClient();
  await setInstitutionBalance(supabase, id, currentBalance, asOfDate);
}

// Relabels the institution's currency. Amounts aren't converted — this is
// for saying "these numbers were SEK all along", not for moving money.
export async function updateInstitutionCurrencyAction(id: string, currency: string) {
  if (!isCurrency(currency)) throw new Error("Unsupported currency.");
  const supabase = await createClient();
  await updateInstitution(supabase, id, { currency });
  revalidatePath("/protected", "layout");
}

export async function deleteInstitutionAction(id: string) {
  const supabase = await createClient();
  await deleteInstitution(supabase, id);
}

export async function reorderInstitutionsAction(orderedIds: string[]) {
  const supabase = await createClient();
  await reorderInstitutions(supabase, orderedIds);
}
