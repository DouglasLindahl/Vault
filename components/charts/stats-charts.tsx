"use client";

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
import { currency, useChartColors, ChartTooltip } from "@/components/charts/chart-utils";

export function StatsCharts({
  spendingByCategory,
  balanceByAccount,
}: {
  spendingByCategory: { name: string; amount: number }[];
  balanceByAccount: { name: string; balance: number }[];
}) {
  const colors = useChartColors();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
        <CardHeader>
          <CardTitle className="text-base text-[#172033] dark:text-white">
            Top spending categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {spendingByCategory.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No spending logged yet.
            </p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(spendingByCategory.length * 36, 120)}
            >
              <BarChart
                data={spendingByCategory}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <CartesianGrid
                  stroke={colors.grid}
                  horizontal={false}
                  strokeDasharray="0"
                />
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
                  dataKey="amount"
                  name="Spent"
                  fill={colors.blue}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
        <CardHeader>
          <CardTitle className="text-base text-[#172033] dark:text-white">
            Balance by account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balanceByAccount.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No accounts yet.
            </p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(balanceByAccount.length * 36, 120)}
            >
              <BarChart
                data={balanceByAccount}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <CartesianGrid
                  stroke={colors.grid}
                  horizontal={false}
                  strokeDasharray="0"
                />
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
                  dataKey="balance"
                  name="Balance"
                  fill={colors.blue}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
