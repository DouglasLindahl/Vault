// Client-safe date bucketing for the stats page's day/week/month
// granularity toggle. No date library in this project — plain Date
// math, mirroring the calendar-month bucketing already used for the
// dashboard's monthly income/expense chart.
//
// Everything here stays in local time end-to-end (never round-tripping
// through toISOString(), which is UTC) — mixing the two would shift
// transaction dates by a day for anyone west of UTC.

import { parseDateOnly } from "@/lib/utils";

export type Granularity = "day" | "week" | "month";

const PERIOD_COUNT: Record<Granularity, number> = {
  day: 14,
  week: 12,
  month: 12,
};

function formatDateOnly(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // back up to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

function addPeriod(date: Date, granularity: Granularity, n: number): Date {
  const d = new Date(date);
  if (granularity === "day") d.setDate(d.getDate() + n);
  else if (granularity === "week") d.setDate(d.getDate() + n * 7);
  else d.setMonth(d.getMonth() + n);
  return d;
}

function bucketKey(date: Date, granularity: Granularity): string {
  if (granularity === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  if (granularity === "week") return formatDateOnly(startOfWeek(date));
  return formatDateOnly(date);
}

function bucketLabel(key: string, granularity: Granularity): string {
  if (granularity === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
  }
  return parseDateOnly(key).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function daysInBucket(key: string, granularity: Granularity): number {
  if (granularity === "day") return 1;
  if (granularity === "week") return 7;
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export type BucketedTotals = {
  key: string;
  label: string;
  income: number;
  expense: number;
  incomePerDay: number;
  expensePerDay: number;
};

export function bucketIncomeExpense(
  transactions: { date: string; direction: "in" | "out"; amount: number }[],
  granularity: Granularity,
): BucketedTotals[] {
  const count = PERIOD_COUNT[granularity];
  const now = new Date();

  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const key = bucketKey(addPeriod(now, granularity, -i), granularity);
    if (keys[keys.length - 1] !== key) keys.push(key);
  }

  const totals = new Map<string, { income: number; expense: number }>();
  for (const key of keys) totals.set(key, { income: 0, expense: 0 });

  for (const t of transactions) {
    const key = bucketKey(parseDateOnly(t.date), granularity);
    const entry = totals.get(key);
    if (!entry) continue; // outside the visible window
    if (t.direction === "in") entry.income += t.amount;
    else entry.expense += t.amount;
  }

  return keys.map((key) => {
    const entry = totals.get(key)!;
    const days = daysInBucket(key, granularity);
    return {
      key,
      label: bucketLabel(key, granularity),
      income: entry.income,
      expense: entry.expense,
      incomePerDay: entry.income / days,
      expensePerDay: entry.expense / days,
    };
  });
}
