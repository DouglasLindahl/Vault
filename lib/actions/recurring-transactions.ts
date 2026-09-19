"use server";

// See lib/actions/transactions.ts for why these need to be server actions
// rather than being called directly from client components.

import { createClient } from "@/lib/supabase/server";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  setRecurringTransactionTags,
} from "@/lib/queries/recurring-transactions";
import type { Direction, Frequency } from "@/lib/types/database";

export async function createRecurringTransactionAction(input: {
  institutionId: string;
  name: string | null;
  amount: number;
  direction: Direction;
  frequency: Frequency;
  startDate: string;
  isEstimate: boolean;
  tagIds?: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be logged in.");

  const recurring = await createRecurringTransaction(supabase, {
    user_id: user.id,
    institution_id: input.institutionId,
    name: input.name,
    amount: input.amount,
    direction: input.direction,
    frequency: input.frequency,
    start_date: input.startDate,
    is_estimate: input.isEstimate,
  });

  if (input.tagIds?.length) {
    await setRecurringTransactionTags(supabase, recurring.id, input.tagIds);
  }

  return recurring;
}

export async function deleteRecurringTransactionAction(id: string) {
  const supabase = await createClient();
  await deleteRecurringTransaction(supabase, id);
}
