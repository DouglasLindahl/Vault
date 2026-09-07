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
import type { BillDraft } from "../types";

type Props = {
  bills: BillDraft[];
  onChange: (value: BillDraft[]) => void;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
};

export function BillsStep({ bills, onChange, onBack, onNext, loading }: Props) {
  function update(id: string, values: Partial<BillDraft>) {
    onChange(
      bills.map((bill) => (bill.id === id ? { ...bill, ...values } : bill)),
    );
  }

  function addBill() {
    onChange([
      ...bills,
      {
        id: crypto.randomUUID(),

        name: "",
        categoryName: "Bills",
        categoryEmoji: "🏠",
        categoryColor: "#8B5CF6",

        amount: "",
        amountType: "fixed",

        frequency: "monthly",

        dueType: "exact",

        dueDay: "",
        dueWindowStart: "",
        dueWindowEnd: "",
      },
    ]);
  }

  function removeBill(id: string) {
    onChange(bills.filter((bill) => bill.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-zinc-100 p-4 text-sm leading-6 dark:bg-white/[0.05]">
        <strong>Bills</strong> are expenses you need or are expected to pay —
        such as rent, electricity, insurance or a car payment. Optional
        recurring services like Netflix and Spotify belong under Subscriptions.
      </div>

      {bills.map((bill) => (
        <div
          key={bill.id}
          className="space-y-6 rounded-[24px] border border-zinc-200 p-5 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <EmojiPicker
              value={bill.categoryEmoji}
              onChange={(categoryEmoji) =>
                update(bill.id, {
                  categoryEmoji,
                })
              }
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeBill(bill.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Bill name</Label>

              <Input
                value={bill.name}
                onChange={(e) =>
                  update(bill.id, {
                    name: e.target.value,
                  })
                }
                placeholder="Car payment"
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>

              <Input
                value={bill.categoryName}
                onChange={(e) =>
                  update(bill.id, {
                    categoryName: e.target.value,
                  })
                }
                placeholder="Car"
                className="h-12 rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>

            <ColorPicker
              value={bill.categoryColor}
              onChange={(categoryColor) =>
                update(bill.id, {
                  categoryColor,
                })
              }
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount</Label>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={bill.amount}
                onChange={(e) =>
                  update(bill.id, {
                    amount: e.target.value,
                  })
                }
                placeholder="420"
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Amount type</Label>

              <Select
                value={bill.amountType}
                onValueChange={(value) =>
                  update(bill.id, {
                    amountType: value as BillDraft["amountType"],
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
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>

            <Select
              value={bill.frequency}
              onValueChange={(value) =>
                update(bill.id, {
                  frequency: value as BillDraft["frequency"],
                })
              }
            >
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>

                <SelectItem value="biweekly">Every 2 weeks</SelectItem>

                <SelectItem value="monthly">Monthly</SelectItem>

                <SelectItem value="quarterly">Every 3 months</SelectItem>

                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>When is it due?</Label>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={bill.dueType === "exact" ? "default" : "outline"}
                onClick={() =>
                  update(bill.id, {
                    dueType: "exact",
                  })
                }
                className="h-11 rounded-2xl"
              >
                Exact day
              </Button>

              <Button
                type="button"
                variant={bill.dueType === "window" ? "default" : "outline"}
                onClick={() =>
                  update(bill.id, {
                    dueType: "window",
                  })
                }
                className="h-11 rounded-2xl"
              >
                Payment window
              </Button>
            </div>
          </div>

          {bill.dueType === "exact" ? (
            <div className="space-y-2">
              <Label>Due on day</Label>

              <Input
                type="number"
                min="1"
                max="31"
                value={bill.dueDay}
                onChange={(e) =>
                  update(bill.id, {
                    dueDay: e.target.value,
                  })
                }
                placeholder="18"
                className="h-12 rounded-2xl"
              />
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Window starts</Label>

                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={bill.dueWindowStart}
                  onChange={(e) =>
                    update(bill.id, {
                      dueWindowStart: e.target.value,
                    })
                  }
                  placeholder="15"
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Window ends</Label>

                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={bill.dueWindowEnd}
                  onChange={(e) =>
                    update(bill.id, {
                      dueWindowEnd: e.target.value,
                    })
                  }
                  placeholder="26"
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addBill}
        className="h-12 rounded-2xl"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add another bill
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
