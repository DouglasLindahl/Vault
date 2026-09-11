export type Institution = {
  id: string;
  name: string;
  type: "bank" | "crypto";
  balance: number;
};

export type Transaction = {
  id: string;
  name: string | null;
  category: string;
  institutionName: string;
  amount: number;
  direction: "in" | "out";
  date: string; // ISO date string
};

export type DashboardData = {
  institutions: Institution[];
  transactions: Transaction[];
};
