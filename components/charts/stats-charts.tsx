"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currency, useChartColors, ChartTooltip } from "@/components/charts/chart-utils";

type SortMode = "amount-desc" | "amount-asc" | "alpha";

type Datum = { name: string; value: number };

function sortData(data: Datum[], sortMode: SortMode): Datum[] {
  const sorted = [...data];
  if (sortMode === "alpha") {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  const dir = sortMode === "amount-desc" ? -1 : 1;
  return sorted.sort((a, b) => dir * (a.value - b.value));
}

function SortableBarCard({
  title,
  data,
  emptyMessage,
  barName,
}: {
  title: string;
  data: Datum[];
  emptyMessage: string;
  barName: string;
}) {
  const [sortMode, setSortMode] = useState<SortMode>("amount-desc");
  const colors = useChartColors();
  const sorted = useMemo(() => sortData(data, sortMode), [data, sortMode]);

  return (
    <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base text-foreground dark:text-white">{title}</CardTitle>
        {data.length > 1 && (
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="h-8 rounded-xl text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amount-desc">Amount (high to low)</SelectItem>
              <SelectItem value="amount-asc">Amount (low to high)</SelectItem>
              <SelectItem value="alpha">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(sorted.length * 36, 120)}>
            <BarChart data={sorted} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke={colors.grid} horizontal={false} strokeDasharray="0" />
              <XAxis
                type="number"
                tick={{ fill: colors.axis, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => currency(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: colors.text, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip content={<ChartTooltip colors={colors} />} />
              <Bar
                dataKey="value"
                name={barName}
                fill={colors.blue}
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCharts({
  spendingByTag,
  balanceByAccount,
  recurringByInstitution,
  recurringByTag,
}: {
  spendingByTag: { name: string; amount: number }[];
  balanceByAccount: { name: string; balance: number }[];
  recurringByInstitution: { name: string; amount: number }[];
  recurringByTag: { name: string; amount: number }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SortableBarCard
        title="Top tags"
        barName="Spent"
        emptyMessage="No spending logged yet."
        data={spendingByTag.map((d) => ({ name: d.name, value: d.amount }))}
      />
      <SortableBarCard
        title="Balance by account"
        barName="Balance"
        emptyMessage="No accounts yet."
        data={balanceByAccount.map((d) => ({ name: d.name, value: d.balance }))}
      />
      <SortableBarCard
        title="Recurring by institution (monthly equiv.)"
        barName="Net / mo"
        emptyMessage="No active recurring transactions yet."
        data={recurringByInstitution.map((d) => ({ name: d.name, value: d.amount }))}
      />
      <SortableBarCard
        title="Recurring by tag (monthly equiv.)"
        barName="Net / mo"
        emptyMessage="No tagged recurring transactions yet."
        data={recurringByTag.map((d) => ({ name: d.name, value: d.amount }))}
      />
    </div>
  );
}
