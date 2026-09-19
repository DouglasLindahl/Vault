-- Fixes a foreign-key gap: deleting a recurring_transactions row was
-- blocked whenever it had already generated real transactions (e.g. via
-- the due-check), because transactions.recurring_transaction_id had no
-- ON DELETE behavior (defaults to RESTRICT).
--
-- Choosing SET NULL rather than CASCADE here on purpose: removing a
-- recurring rule should detach its past transactions, not delete your
-- transaction history / silently change account balances.

alter table public.transactions
  drop constraint transactions_recurring_transaction_id_fkey;

alter table public.transactions
  add constraint transactions_recurring_transaction_id_fkey
  foreign key (recurring_transaction_id)
  references public.recurring_transactions(id)
  on delete set null;
