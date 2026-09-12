// Row, Insert, and Update types for every table in the schema.
// Keep these in sync with the SQL schema — this is the single
// source of truth for table shapes across the app.

export type InstitutionType = "bank" | "investment";
export type Direction = "in" | "out";
export type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
export type AssetType = "crypto" | "stock" | "cash";

// ---------------------------------------------------
// institutions
// ---------------------------------------------------
export type Institution = {
  id: string;
  user_id: string;
  name: string;
  type: InstitutionType;
  starting_balance: number;
  starting_balance_date: string; // date
  current_balance: number;
  sort_order: number;
  created_at: string;
};

export type InstitutionInsert = {
  user_id: string;
  name: string;
  type: InstitutionType;
  starting_balance?: number;
  starting_balance_date?: string;
  current_balance?: number;
  sort_order?: number;
};

export type InstitutionUpdate = Partial<
  Omit<InstitutionInsert, "user_id">
>;

// ---------------------------------------------------
// categories
// ---------------------------------------------------
export type CategoryType = "income" | "expense";

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
};

export type CategoryInsert = {
  user_id: string;
  name: string;
  type: CategoryType;
};

export type CategoryUpdate = Partial<Omit<CategoryInsert, "user_id">>;

// ---------------------------------------------------
// recurring_transactions
// ---------------------------------------------------
export type RecurringTransaction = {
  id: string;
  user_id: string;
  institution_id: string;
  category_id: string;
  name: string | null;
  amount: number;
  direction: Direction;
  frequency: Frequency;
  start_date: string; // date
  is_estimate: boolean;
  active: boolean;
  created_at: string;
};

export type RecurringTransactionInsert = {
  user_id: string;
  institution_id: string;
  category_id: string;
  name?: string | null;
  amount: number;
  direction: Direction;
  frequency: Frequency;
  start_date: string;
  is_estimate?: boolean;
  active?: boolean;
};

// Recurring transaction joined with its category + institution name.
export type RecurringTransactionWithRelations = RecurringTransaction & {
  categoryName: string;
  institutionName: string;
};

export type RecurringTransactionUpdate = Partial<
  Omit<RecurringTransactionInsert, "user_id">
>;

// ---------------------------------------------------
// transactions
// ---------------------------------------------------
export type Transaction = {
  id: string;
  user_id: string;
  institution_id: string;
  category_id: string;
  recurring_transaction_id: string | null;
  name: string | null;
  amount: number;
  direction: Direction;
  date: string;
  is_salary_adjustment: boolean;
  created_at: string;
};

export type TransactionInsert = {
  user_id: string;
  institution_id: string;
  category_id: string;
  recurring_transaction_id?: string | null;
  name?: string | null;
  amount: number;
  direction: Direction;
  date: string;
  is_salary_adjustment?: boolean;
};

export type TransactionUpdate = Partial<Omit<TransactionInsert, "user_id">>;

// Transaction joined with its category + institution name — the
// shape most UI components actually want to render.
export type TransactionWithRelations = Transaction & {
  categoryName: string;
  institutionName: string;
};

// ---------------------------------------------------
// crypto_holdings (investment holdings — stocks and crypto)
// ---------------------------------------------------
export type InvestmentHolding = {
  id: string;
  user_id: string;
  institution_id: string;
  asset_symbol: string;
  asset_type: AssetType;
  coingecko_id: string | null;
  quantity: number;
  updated_at: string;
};

export type InvestmentHoldingInsert = {
  user_id: string;
  institution_id: string;
  asset_symbol: string;
  asset_type: AssetType;
  coingecko_id?: string | null;
  quantity?: number;
};

export type InvestmentHoldingUpdate = Partial<
  Omit<InvestmentHoldingInsert, "user_id" | "institution_id" | "asset_symbol">
>;

// ---------------------------------------------------
// crypto_conversions (investment purchase/conversion events)
// ---------------------------------------------------
export type InvestmentConversion = {
  id: string;
  user_id: string;
  institution_id: string;
  usd_amount: number;
  asset_symbol: string;
  asset_quantity: number;
  date: string;
  created_at: string;
};

export type InvestmentConversionInsert = {
  user_id: string;
  institution_id: string;
  usd_amount: number;
  asset_symbol: string;
  asset_quantity: number;
  date: string;
};

// ---------------------------------------------------
// daily_snapshots
// ---------------------------------------------------
export type DailySnapshot = {
  id: string;
  user_id: string;
  date: string;
  total_cash: number;
  total_crypto_value: number;
  net_worth: number;
  created_at: string;
};

export type DailySnapshotInsert = {
  user_id: string;
  date: string;
  total_cash: number;
  total_crypto_value: number;
  net_worth: number;
};

// ---------------------------------------------------
// profiles
// ---------------------------------------------------
export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  currency: string;
  created_at: string;
};

export type ProfileUpdate = Partial<
  Omit<Profile, "id" | "created_at">
>;
