"use server";

// Encryption (lib/encryption.ts) only runs server-side — ENCRYPTION_KEY
// must never reach the browser. These actions are the only way client
// components may create/delete transactions; calling the query-layer
// functions in lib/queries/transactions.ts directly from a client
// component would bundle server-only code into the browser.

import { createClient } from "@/lib/supabase/server";
import {
  createTransaction,
  deleteTransaction,
  deleteLastTransaction,
  setTransactionTags,
} from "@/lib/queries/transactions";
import { completePendingRecurringEntry } from "@/lib/queries/recurring-transaction-pending";
import type { Direction } from "@/lib/types/database";

export async function createTransactionAction(input: {
  institutionId: string;
  name: string | null;
  amount: number;
  direction: Direction;
  date: string;
  tagIds?: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be logged in.");

  const transaction = await createTransaction(supabase, {
    user_id: user.id,
    institution_id: input.institutionId,
    name: input.name,
    amount: input.amount,
    direction: input.direction,
    date: input.date,
  });

  if (input.tagIds?.length) {
    await setTransactionTags(supabase, transaction.id, input.tagIds);
  }

  return transaction;
}

export async function deleteTransactionAction(id: string) {
  const supabase = await createClient();
  await deleteTransaction(supabase, id);
}

export async function deleteLastTransactionAction() {
  const supabase = await createClient();
  await deleteLastTransaction(supabase);
}

// Fills in a pending "amount varies" recurring occurrence: creates the
// realized transaction, then marks the pending entry completed.
export async function completePendingRecurringEntryAction(input: {
  pendingId: string;
  institutionId: string;
  recurringTransactionId: string;
  name: string | null;
  amount: number;
  direction: Direction;
  dueDate: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be logged in.");

  const transaction = await createTransaction(supabase, {
    user_id: user.id,
    institution_id: input.institutionId,
    recurring_transaction_id: input.recurringTransactionId,
    name: input.name,
    amount: input.amount,
    direction: input.direction,
    date: input.dueDate,
  });

  await completePendingRecurringEntry(supabase, input.pendingId, transaction.id);

  return transaction;
}
