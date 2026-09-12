"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { currency, useChartColors, ChartTooltip } from "@/components/charts/chart-utils";

export function InvestmentsChart({
  totalInvested,
  totalValue,
  byAsset,
  investedOverTime,
}: {
  totalInvested: number;
  totalValue: number;
  byAsset: { symbol: string; value: number }[];
  investedOverTime: { label: string; invested: number }[];
}) {
  const colors = useChartColors();
  const gain = totalValue - totalInvested;

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader className="pb-2">
            <CardDescription>Total invested</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-[#172033] dark:text-white">
              {currency(totalInvested)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader className="pb-2">
            <CardDescription>Current value</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-[#172033] dark:text-white">
              {currency(totalValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader className="pb-2">
            <CardDescription>Gain / loss</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={
                gain >= 0
                  ? "text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400"
                  : "text-2xl font-bold tabular-nums text-[#172033] dark:text-white"
              }
            >
              {gain >= 0 ? "+" : ""}
              {currency(gain)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <CardHeader>
            <CardTitle className="text-base text-[#172033] dark:text-white">
              Value by asset
            </CardTitle>
          </CardHeader>
          <CardContent>
            {byAsset.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No investments yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(byAsset.length * 36, 120)}>
                <BarChart data={byAsset} layout="vertical" margin={{ left: 8 }}>
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
                    dataKey="symbol"
                    tick={{ fill: colors.text, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip content={<ChartTooltip colors={colors} />} />
                  <Bar
                    dataKey="value"
                    name="Value"
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
              Total invested over time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {investedOverTime.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No investments yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={investedOverTime}>
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
                  <Tooltip content={<ChartTooltip colors={colors} />} />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    name="Invested"
                    stroke={colors.blue}
                    fill={colors.blue}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
