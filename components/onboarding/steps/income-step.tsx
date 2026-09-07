"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ColorPicker } from "../color-picker";
import { EmojiPicker } from "../emoji-picker";

import type { IncomeDraft } from "../types";

type Props = {
  incomes: IncomeDraft[];
  onChange: (value: IncomeDraft[]) => void;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
};

const WEEKDAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

export function IncomeStep({
  incomes,
  onChange,
  onBack,
  onNext,
  loading,
}: Props) {
  function update(id: string, values: Partial<IncomeDraft>) {
    onChange(
      incomes.map((income) =>
        income.id === id ? { ...income, ...values } : income,
      ),
    );
  }

  function addIncome() {
    onChange([
      ...incomes,
      {
        id: crypto.randomUUID(),
        name: "",
        categoryName: "Income",
        categoryEmoji: "💵",
        categoryColor: "#22C55E",

        amountType: "fixed",
        amount: "",

        frequency: "monthly",
        paydayWeekday: "",
        paydayDay: "",
      },
    ]);
  }

  function removeIncome(id: string) {
    onChange(incomes.filter((income) => income.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#315cff]/[0.06] p-4 text-sm leading-6 dark:bg-pink-500/[0.08]">
        Have more than one type of income? Add them separately. For example, a
        server might add a regular paycheck as 💼 Salary and tips as 💵 Tips.
      </div>

      {incomes.map((income) => (
        <div
          key={income.id}
          className="space-y-6 rounded-[24px] border border-zinc-200 p-5 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EmojiPicker
                value={income.categoryEmoji}
                onChange={(categoryEmoji) =>
                  update(income.id, {
                    categoryEmoji,
                  })
                }
              />

              <div>
                <p className="font-semibold text-[#172033] dark:text-white">
                  {income.name || "New income"}
                </p>
                <p className="text-xs text-zinc-500">Income source</p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeIncome(income.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Income name</Label>
              <Input
                value={income.name}
                onChange={(e) =>
                  update(income.id, {
                    name: e.target.value,
                  })
                }
                placeholder="Salary"
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Category name</Label>
              <Input
                value={income.categoryName}
                onChange={(e) =>
                  update(income.id, {
                    categoryName: e.target.value,
                  })
                }
                placeholder="Work"
                className="h-12 rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>

            <ColorPicker
              value={income.categoryColor}
              onChange={(categoryColor) =>
                update(income.id, {
                  categoryColor,
                })
              }
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Income type</Label>

              <Select
                value={income.amountType}
                onValueChange={(value) =>
                  update(income.id, {
                    amountType: value as IncomeDraft["amountType"],
                  })
                }
              >
                <SelectTrigger className="h-12 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="estimated">Estimated</SelectItem>
                  <SelectItem value="variable">Variable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {income.amountType === "variable"
                  ? "Estimated amount"
                  : "Amount"}
              </Label>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={income.amount}
                onChange={(e) =>
                  update(income.id, {
                    amount: e.target.value,
                  })
                }
                placeholder="1100"
                className="h-12 rounded-2xl"
              />

              {income.amountType === "variable" && (
                <p className="text-xs text-zinc-500">
                  Optional. Give Vault a rough estimate if you know it.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>How often?</Label>

            <Select
              value={income.frequency}
              onValueChange={(value) =>
                update(income.id, {
                  frequency: value as IncomeDraft["frequency"],
                })
              }
            >
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>

                <SelectItem value="biweekly">Every 2 weeks</SelectItem>

                <SelectItem value="semimonthly">Twice a month</SelectItem>

                <SelectItem value="monthly">Monthly</SelectItem>

                <SelectItem value="quarterly">Every 3 months</SelectItem>

                <SelectItem value="yearly">Yearly</SelectItem>

                <SelectItem value="irregular">Irregular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(income.frequency === "weekly" ||
            income.frequency === "biweekly") && (
            <div className="space-y-2">
              <Label>Usually paid on</Label>

              <Select
                value={income.paydayWeekday}
                onValueChange={(paydayWeekday) =>
                  update(income.id, {
                    paydayWeekday,
                  })
                }
              >
                <SelectTrigger className="h-12 rounded-2xl">
                  <SelectValue placeholder="Choose day" />
                </SelectTrigger>

                <SelectContent>
                  {WEEKDAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {income.frequency === "monthly" && (
            <div className="space-y-2">
              <Label>Usually paid on day</Label>

              <Input
                type="number"
                min="1"
                max="31"
                value={income.paydayDay}
                onChange={(e) =>
                  update(income.id, {
                    paydayDay: e.target.value,
                  })
                }
                placeholder="15"
                className="h-12 rounded-2xl"
              />
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addIncome}
        className="h-12 rounded-2xl"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add another income
      </Button>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>

        <Button
          type="button"
          disabled={loading}
          onClick={onNext}
          className="h-12 rounded-2xl px-7"
        >
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
