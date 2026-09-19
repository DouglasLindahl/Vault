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
// tags
// ---------------------------------------------------
export type Tag = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type TagInsert = {
  user_id: string;
  name: string;
  color?: string;
};

export type TagUpdate = Partial<Omit<TagInsert, "user_id">>;

// ---------------------------------------------------
// recurring_transactions
// ---------------------------------------------------
export type RecurringTransaction = {
  id: string;
  user_id: string;
  institution_id: string;
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
  name?: string | null;
  amount: number;
  direction: Direction;
  frequency: Frequency;
  start_date: string;
  is_estimate?: boolean;
  active?: boolean;
};

// Recurring transaction joined with its tags + institution name.
export type RecurringTransactionWithRelations = RecurringTransaction & {
  tags: Tag[];
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
  recurring_transaction_id?: string | null;
  name?: string | null;
  amount: number;
  direction: Direction;
  date: string;
  is_salary_adjustment?: boolean;
};

export type TransactionUpdate = Partial<Omit<TransactionInsert, "user_id">>;

// Transaction joined with its tags + institution name — the
// shape most UI components actually want to render.
export type TransactionWithRelations = Transaction & {
  tags: Tag[];
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
// recurring_transaction_pending
// ---------------------------------------------------
export type PendingStatus = "pending" | "completed" | "skipped";

export type RecurringTransactionPending = {
  id: string;
  user_id: string;
  recurring_transaction_id: string;
  due_date: string; // date
  status: PendingStatus;
  transaction_id: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type RecurringTransactionPendingInsert = {
  user_id: string;
  recurring_transaction_id: string;
  due_date: string;
  status?: PendingStatus;
};

// Pending entry joined with enough of its parent recurring transaction to
// render a prompt without a second round trip.
export type RecurringTransactionPendingWithRelations = RecurringTransactionPending & {
  name: string | null;
  institutionName: string;
  institutionId: string;
  direction: Direction;
};

// ---------------------------------------------------
// notifications
// ---------------------------------------------------
export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export type NotificationInsert = {
  user_id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read?: boolean;
};

// ---------------------------------------------------
// profiles
// ---------------------------------------------------
export type SubscriptionStatus = "free" | "trial" | "active" | "canceled";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  currency: string;
  phone_number: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  timezone: string | null;
  subscription_status: SubscriptionStatus;
  created_at: string;
};

export type ProfileUpdate = Partial<
  Omit<Profile, "id" | "created_at">
>;
