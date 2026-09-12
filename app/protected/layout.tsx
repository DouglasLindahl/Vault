import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries/categories";
import { DashboardProvider } from "@/app/protected/dashboard/dashboard-provider";
import { DashboardNav } from "@/components/nav/dashboard-nav";
import type { DashboardData, Institution, Transaction } from "@/lib/types";

async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const categories = await getCategories(supabase);

  const { data: institutionRows } = await supabase
    .from("institutions")
    .select("id, name, type, current_balance");

  const institutions: Institution[] = (institutionRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    balance: row.current_balance,
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

  return { institutions, transactions, categories };
}

async function DashboardData({ children }: { children: React.ReactNode }) {
  const data = await getDashboardData();

  return <DashboardProvider data={data}>{children}</DashboardProvider>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardNav />
      <Suspense>
        <DashboardData>{children}</DashboardData>
      </Suspense>
    </>
  );
}
