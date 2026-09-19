export type Institution = {
  id: string;
  name: string;
  type: "bank" | "investment";
  balance: number;
};

export type TagOption = {
  id: string;
  name: string;
  color: string;
};

export type Transaction = {
  id: string;
  name: string | null;
  tags: TagOption[];
  institutionName: string;
  amount: number;
  direction: "in" | "out";
  date: string; // ISO date string
};

export type RecurringTransaction = {
  id: string;
  name: string | null;
  tags: TagOption[];
  institutionName: string;
  amount: number;
  direction: "in" | "out";
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
  startDate: string; // ISO date string
};

export type DashboardData = {
  institutions: Institution[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  tags: TagOption[];
  isAdmin: boolean;
};
