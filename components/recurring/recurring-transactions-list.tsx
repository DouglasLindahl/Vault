"use client";

import { useMemo, useState } from "react";
import { monthlyAmount, nextOccurrence } from "@/lib/recurrence";
import { DeleteRowButton } from "@/components/forms/delete-row-button";
import { EditRecurringAmountButton } from "@/components/forms/edit-recurring-amount-button";
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
import type { TagOption } from "@/lib/types";
import { useMoney } from "@/app/protected/dashboard/dashboard-provider";

const frequencyLabel = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  yearly: "Yearly",
} as const;

// Monthly equivalent in the display currency, so weekly/yearly/etc. items
// from accounts in different currencies add up sensibly.
function signedMonthlyAmount(
  r: RecurringTransactionWithRelations,
  toBase: (amount: number, from: string) => number,
) {
  const monthly = toBase(monthlyAmount(r.amount, r.frequency), r.currency);
  return r.direction === "in" ? monthly : -monthly;
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
  const { format } = useMoney();
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
          {format(r.direction === "in" ? r.amount : -r.amount, r.currency)}
        </span>
        <EditRecurringAmountButton
          id={r.id}
          name={r.name ?? (r.direction === "in" ? "Income" : "Expense")}
          amount={r.amount}
          currency={r.currency}
        />
        <DeleteRowButton kind="recurring-transaction" id={r.id} />
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  const { toBase, format } = useMoney();
  const subtotal = group.items.reduce((sum, r) => sum + signedMonthlyAmount(r, toBase), 0);
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
          {format(subtotal)}/mo
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

const ALL = "__all__";
const UNTAGGED = "__untagged__";

function Total({ label, value, className }: { label: string; value: number; className: string }) {
  const { format } = useMoney();
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${className}`}>{format(value)}</p>
    </div>
  );
}

export function RecurringTransactionsList({
  recurring,
  tags,
  institutions,
}: {
  recurring: RecurringTransactionWithRelations[];
  tags: TagOption[];
  institutions: { id: string; name: string }[];
}) {
  const [groupBy, setGroupBy] = useState<GroupBy>("institution");
  const [tagFilter, setTagFilter] = useState<string>(ALL);
  const [institutionFilter, setInstitutionFilter] = useState<string>(ALL);

  const filtered = useMemo(
    () =>
      recurring.filter((r) => {
        if (institutionFilter !== ALL && r.institution_id !== institutionFilter) return false;
        if (tagFilter === UNTAGGED) return r.tags.length === 0;
        if (tagFilter !== ALL) return r.tags.some((t) => t.id === tagFilter);
        return true;
      }),
    [recurring, tagFilter, institutionFilter],
  );

  const { toBase } = useMoney();
  const groups = useMemo(() => groupRecurring(filtered, groupBy), [filtered, groupBy]);
  const totals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const r of filtered) {
      const monthly = toBase(monthlyAmount(r.amount, r.frequency), r.currency);
      if (r.direction === "in") totalIn += monthly;
      else totalOut += monthly;
    }
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [filtered, toBase]);

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
        <CardContent className="flex flex-col gap-5 pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Total label="Total in / mo" value={totals.totalIn} className="text-success" />
            <Total
              label="Total out / mo"
              value={-totals.totalOut}
              className="text-foreground dark:text-white"
            />
            <Total
              label="In minus out / mo"
              value={totals.net}
              className={totals.net >= 0 ? "text-success" : "text-foreground dark:text-white"}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="h-9 w-auto min-w-40 rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value={UNTAGGED}>Untagged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
              <SelectTrigger className="h-9 w-auto min-w-40 rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All institutions</SelectItem>
                {institutions.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="h-9 w-auto min-w-40 rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="institution">By institution</SelectItem>
                <SelectItem value="tag">By tag</SelectItem>
                <SelectItem value="none">No grouping</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <p className="px-2 text-sm text-zinc-500 dark:text-zinc-400">
          No recurring transactions match these filters.
        </p>
      ) : groupBy === "none" ? (
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
