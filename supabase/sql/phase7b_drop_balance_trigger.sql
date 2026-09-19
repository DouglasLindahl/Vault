-- Phase 7b: drop the `apply_transaction_to_balance` trigger, since its
-- SQL arithmetic (`current_balance - amount`) broke once both columns
-- became encrypted text. Its logic is now replicated in the app —
-- see adjustInstitutionBalance() in lib/queries/institutions.ts, called
-- from createTransaction/updateTransaction/deleteTransaction/
-- deleteLastTransaction in lib/queries/transactions.ts.

drop trigger if exists trg_apply_transaction_to_balance on public.transactions;
drop function if exists apply_transaction_to_balance();
