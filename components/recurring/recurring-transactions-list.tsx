"use client";

import { useMemo, useState } from "react";
import { nextOccurrence } from "@/lib/recurrence";
import { DeleteRowButton } from "@/components/forms/delete-row-button";
import { TagChips } from "@/components/tag-chips";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RecurringTransactionWithRelations } from "@/lib/types/database";

function currency(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const frequencyLabel = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  yearly: "Yearly",
} as const;

function signedAmount(r: RecurringTransactionWithRelations) {
  return r.direction === "in" ? r.amount : -r.amount;
}

type GroupBy = "institution" | "tag" | "none";

type Group = {
  key: string;
  label: string;
  items: RecurringTransactionWithRelations[];
};

function groupRecurring(
  recurring: RecurringTransactionWithRelations[],
  groupBy: GroupBy,
): Group[] {
  if (groupBy === "none") {
    return recurring.length ? [{ key: "all", label: "", items: recurring }] : [];
  }

  const groups = new Map<string, Group>();

  for (const r of recurring) {
    if (groupBy === "institution") {
      const key = r.institution_id;
      const group = groups.get(key) ?? { key, label: r.institutionName, items: [] };
      group.items.push(r);
      groups.set(key, group);
      continue;
    }

    // groupBy === "tag"
    if (r.tags.length === 0) {
      const key = "__untagged__";
      const group = groups.get(key) ?? { key, label: "Untagged", items: [] };
      group.items.push(r);
      groups.set(key, group);
      continue;
    }
    for (const tag of r.tags) {
      const group = groups.get(tag.id) ?? { key: tag.id, label: tag.name, items: [] };
      group.items.push(r);
      groups.set(tag.id, group);
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.key === "__untagged__") return 1;
    if (b.key === "__untagged__") return -1;
    return a.label.localeCompare(b.label);
  });
}

function RecurringRow({ r }: { r: RecurringTransactionWithRelations }) {
  const next = nextOccurrence(r.start_date, r.frequency);
  return (
    <div className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground dark:text-white">
            {r.name ?? (r.direction === "in" ? "Income" : "Expense")}
          </p>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
            {frequencyLabel[r.frequency]}
          </span>
          {!r.active && (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
              Inactive
            </span>
          )}
        </div>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {r.institutionName} · next{" "}
          {next.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <div className="mt-1">
          <TagChips tags={r.tags} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span
          className={
            r.direction === "in"
              ? "text-sm font-semibold tabular-nums text-success"
              : "text-sm font-semibold tabular-nums text-foreground dark:text-white"
          }
        >
          {r.direction === "in" ? currency(r.amount) : currency(-r.amount)}
        </span>
        <DeleteRowButton kind="recurring-transaction" id={r.id} />
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  const subtotal = group.items.reduce((sum, r) => sum + signedAmount(r), 0);
  return (
    <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm text-foreground dark:text-white">{group.label}</CardTitle>
        <p
          className={
            subtotal >= 0
              ? "text-sm font-semibold tabular-nums text-success"
              : "text-sm font-semibold tabular-nums text-zinc-500 dark:text-zinc-400"
          }
        >
          {currency(subtotal)}/mo
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {group.items.map((r) => (
          <RecurringRow key={r.id} r={r} />
        ))}
      </CardContent>
    </Card>
  );
}

export function RecurringTransactionsList({
  recurring,
}: {
  recurring: RecurringTransactionWithRelations[];
}) {
  const [groupBy, setGroupBy] = useState<GroupBy>("institution");

  const groups = useMemo(() => groupRecurring(recurring, groupBy), [recurring, groupBy]);
  const grandTotal = useMemo(
    () => recurring.reduce((sum, r) => sum + signedAmount(r), 0),
    [recurring],
  );

  if (recurring.length === 0) {
    return (
      <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base text-foreground dark:text-white">
            All recurring transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No recurring transactions yet. Toggle &quot;Recurring&quot; when adding a
            transaction to create one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Total recurring
            </p>
            <p
              className={
                grandTotal >= 0
                  ? "text-2xl font-bold tabular-nums text-success"
                  : "text-2xl font-bold tabular-nums text-foreground dark:text-white"
              }
            >
              {currency(grandTotal)}
            </p>
          </div>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="h-9 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="institution">By institution</SelectItem>
              <SelectItem value="tag">By tag</SelectItem>
              <SelectItem value="none">No grouping</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {groupBy === "none" ? (
        <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base text-foreground dark:text-white">
              All recurring transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {groups[0]?.items.map((r) => <RecurringRow key={r.id} r={r} />)}
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => <GroupCard key={group.key} group={group} />)
      )}
    </div>
  );
}
