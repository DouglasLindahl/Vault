"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { bucketIncomeExpense, type Granularity } from "@/lib/stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { currency, useChartColors, ChartTooltip } from "@/components/charts/chart-utils";

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

function GranularityToggle({
  value,
  onChange,
}: {
  value: Granularity;
  onChange: (g: Granularity) => void;
}) {
  return (
    <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-white/[0.04]">
      {GRANULARITIES.map((g) => (
        <button
          key={g.value}
          type="button"
          onClick={() => onChange(g.value)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
            value === g.value
              ? "bg-white text-[#172033] shadow-sm dark:bg-white/[0.1] dark:text-white"
              : "text-zinc-500",
          )}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}

export function CashFlowChart({
  transactions,
}: {
  transactions: { date: string; direction: "in" | "out"; amount: number }[];
}) {
  const colors = useChartColors();
  const [incomeGranularity, setIncomeGranularity] = useState<Granularity>("month");
  const [spendGranularity, setSpendGranularity] = useState<Granularity>("month");

  const incomeBuckets = useMemo(
    () => bucketIncomeExpense(transactions, incomeGranularity),
    [transactions, incomeGranularity],
  );
  const spendBuckets = useMemo(
    () => bucketIncomeExpense(transactions, spendGranularity),
    [transactions, spendGranularity],
  );

  const avgDailyIncome =
    incomeBuckets.length > 0
      ? incomeBuckets.reduce((s, b) => s + b.incomePerDay, 0) / incomeBuckets.length
      : 0;
  const avgDailySpend =
    spendBuckets.length > 0
      ? spendBuckets.reduce((s, b) => s + b.expensePerDay, 0) / spendBuckets.length
      : 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base text-[#172033] dark:text-white">
              Income
            </CardTitle>
            <CardDescription>
              Averaging {currency(avgDailyIncome)}/day over this period
            </CardDescription>
          </div>
          <GranularityToggle value={incomeGranularity} onChange={setIncomeGranularity} />
        </CardHeader>
        <CardContent>
          {incomeBuckets.every((b) => b.income === 0) ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No income logged yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={incomeBuckets}>
                <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="0" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: colors.axis, fontSize: 12 }}
                  axisLine={{ stroke: colors.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: colors.axis, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => currency(v)}
                  width={64}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      colors={colors}
                      formatValue={(v) => currency(v)}
                    />
                  }
                />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill={colors.green}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base text-[#172033] dark:text-white">
              Spending
            </CardTitle>
            <CardDescription>
              Averaging {currency(avgDailySpend)}/day, spread evenly over each{" "}
              {spendGranularity}
            </CardDescription>
          </div>
          <GranularityToggle value={spendGranularity} onChange={setSpendGranularity} />
        </CardHeader>
        <CardContent>
          {spendBuckets.every((b) => b.expense === 0) ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No spending logged yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={spendBuckets}>
                <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="0" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: colors.axis, fontSize: 12 }}
                  axisLine={{ stroke: colors.grid }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="total"
                  tick={{ fill: colors.axis, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => currency(v)}
                  width={64}
                />
                <YAxis
                  yAxisId="perDay"
                  orientation="right"
                  tick={{ fill: colors.axis, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${currency(v)}/d`}
                  width={64}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      colors={colors}
                      formatValue={(v) => currency(v)}
                    />
                  }
                />
                <Bar
                  yAxisId="total"
                  dataKey="expense"
                  name="Total spent"
                  fill={colors.orange}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Line
                  yAxisId="perDay"
                  type="monotone"
                  dataKey="expensePerDay"
                  name="Per day"
                  stroke={colors.blue}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
