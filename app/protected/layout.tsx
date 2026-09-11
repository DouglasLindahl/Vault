import { createClient } from "@/lib/supabase/server";
import { DashboardProvider } from "@/app/protected/dashboard/dashboard-provider";
import type { DashboardData, Institution, Transaction } from "@/lib/types";

async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const { data: institutionRows } = await supabase
    .from("institutions")
    .select("id, name, type, starting_balance");

  // TODO: replace starting_balance with starting_balance + net of
  // transactions since starting_balance_date once that calculation
  // is wired up.
  const institutions: Institution[] = (institutionRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    balance: row.starting_balance,
  }));

  const { data: transactionRows } = await supabase
    .from("transactions")
    .select(
      "id, name, amount, direction, date, categories(name), institutions(name)",
    )
    .order("date", { ascending: false })
    .limit(200);

  const transactions: Transaction[] = (transactionRows ?? []).map(
    (row: any) => ({
      id: row.id,
      name: row.name,
      category: row.categories?.name ?? "Uncategorized",
      institutionName: row.institutions?.name ?? "Unknown",
      amount: row.amount,
      direction: row.direction,
      date: row.date,
    }),
  );

  return { institutions, transactions };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getDashboardData();

  return <DashboardProvider data={data}>{children}</DashboardProvider>;
}
