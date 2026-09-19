"use server";

// See lib/actions/transactions.ts for why these need to be server actions
// rather than being called directly from client components.

import { createClient } from "@/lib/supabase/server";
import {
  createInstitution,
  updateInstitution,
  deleteInstitution,
  reorderInstitutions,
} from "@/lib/queries/institutions";
import type { InstitutionType } from "@/lib/types/database";

export async function createInstitutionAction(input: {
  name: string;
  type: InstitutionType;
  startingBalance: number;
}) {
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
  });
}

export async function updateInstitutionBalanceAction(id: string, currentBalance: number) {
  const supabase = await createClient();
  return updateInstitution(supabase, id, { current_balance: currentBalance });
}

export async function deleteInstitutionAction(id: string) {
  const supabase = await createClient();
  await deleteInstitution(supabase, id);
}

export async function reorderInstitutionsAction(orderedIds: string[]) {
  const supabase = await createClient();
  await reorderInstitutions(supabase, orderedIds);
}
