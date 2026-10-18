"use client";

import { useMemo, useState } from "react";
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
import { parseDateOnly } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/types/database";
import { useMoney } from "@/app/protected/dashboard/dashboard-provider";

const ALL = "__all__";

type SortBy = "newest" | "oldest" | "institution";

function byDateDesc(a: TransactionWithRelations, b: TransactionWithRelations) {
  return parseDateOnly(b.date).getTime() - parseDateOnly(a.date).getTime();
}

export function TransactionsList({
  transactions,
  institutions,
}: {
  transactions: TransactionWithRelations[];
  institutions: { id: string; name: string }[];
}) {
  const { format } = useMoney();
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [institutionFilter, setInstitutionFilter] = useState<string>(ALL);

  const visible = useMemo(() => {
    const filtered =
      institutionFilter === ALL
        ? [...transactions]
        : transactions.filter((t) => t.institution_id === institutionFilter);
    if (sortBy === "oldest") return filtered.sort((a, b) => byDateDesc(b, a));
    if (sortBy === "institution") {
      return filtered.sort(
        (a, b) => a.institutionName.localeCompare(b.institutionName) || byDateDesc(a, b),
      );
    }
    return filtered.sort(byDateDesc);
  }, [transactions, sortBy, institutionFilter]);

  return (
    <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base text-foreground dark:text-white">
          All transactions
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
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
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="h-9 w-auto min-w-40 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="institution">By institution</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {visible.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {transactions.length === 0
              ? "No transactions yet."
              : "No transactions for this institution."}
          </p>
        )}
        {visible.map((t, i) => {
          const showInstitutionHeader =
            sortBy === "institution" &&
            (i === 0 || visible[i - 1].institutionName !== t.institutionName);
          return (
            <div key={t.id}>
              {showInstitutionHeader && (
                <p
                  className={`px-2 pb-1 text-xs font-medium uppercase tracking-wide text-zinc-400 ${
                    i === 0 ? "" : "pt-4"
                  }`}
                >
                  {t.institutionName}
                </p>
              )}
              <div className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground dark:text-white">
                    {t.name ?? (t.direction === "in" ? "Income" : "Expense")}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {t.institutionName} ·{" "}
                    {parseDateOnly(t.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-1">
                    <TagChips tags={t.tags} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span
                    className={
                      t.direction === "in"
                        ? "text-sm font-semibold tabular-nums text-success"
                        : "text-sm font-semibold tabular-nums text-foreground dark:text-white"
                    }
                  >
                    {format(t.direction === "in" ? t.amount : -t.amount, t.currency)}
                  </span>
                  <DeleteRowButton kind="transaction" id={t.id} />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
