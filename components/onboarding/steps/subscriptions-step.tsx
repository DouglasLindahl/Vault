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

import type { SubscriptionDraft } from "../types";

type Props = {
  subscriptions: SubscriptionDraft[];
  onChange: (value: SubscriptionDraft[]) => void;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
};

export function SubscriptionsStep({
  subscriptions,
  onChange,
  onBack,
  onNext,
  loading,
}: Props) {
  function update(id: string, values: Partial<SubscriptionDraft>) {
    onChange(
      subscriptions.map((subscription) =>
        subscription.id === id
          ? {
              ...subscription,
              ...values,
            }
          : subscription,
      ),
    );
  }

  function addSubscription() {
    onChange([
      ...subscriptions,
      {
        id: crypto.randomUUID(),

        name: "",

        categoryName: "Entertainment",
        categoryEmoji: "🎬",
        categoryColor: "#EC4899",

        amount: "",
        frequency: "monthly",

        nextPaymentDate: "",
      },
    ]);
  }

  function removeSubscription(id: string) {
    onChange(subscriptions.filter((subscription) => subscription.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-zinc-100 p-4 text-sm leading-6 dark:bg-white/[0.05]">
        <strong>Subscriptions</strong> are recurring services you choose to keep
        — such as Netflix, Spotify, cloud storage, a gym membership or software.
      </div>

      {subscriptions.map((subscription) => (
        <div
          key={subscription.id}
          className="space-y-6 rounded-[24px] border border-zinc-200 p-5 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <EmojiPicker
              value={subscription.categoryEmoji}
              onChange={(categoryEmoji) =>
                update(subscription.id, {
                  categoryEmoji,
                })
              }
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSubscription(subscription.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Subscription</Label>

              <Input
                value={subscription.name}
                onChange={(e) =>
                  update(subscription.id, {
                    name: e.target.value,
                  })
                }
                placeholder="Netflix"
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>

              <Input
                value={subscription.categoryName}
                onChange={(e) =>
                  update(subscription.id, {
                    categoryName: e.target.value,
                  })
                }
                placeholder="Entertainment"
                className="h-12 rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>

            <ColorPicker
              value={subscription.categoryColor}
              onChange={(categoryColor) =>
                update(subscription.id, {
                  categoryColor,
                })
              }
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Price</Label>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={subscription.amount}
                onChange={(e) =>
                  update(subscription.id, {
                    amount: e.target.value,
                  })
                }
                placeholder="15.49"
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>

              <Select
                value={subscription.frequency}
                onValueChange={(value) =>
                  update(subscription.id, {
                    frequency: value as SubscriptionDraft["frequency"],
                  })
                }
              >
                <SelectTrigger className="h-12 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>

                  <SelectItem value="monthly">Monthly</SelectItem>

                  <SelectItem value="quarterly">Every 3 months</SelectItem>

                  <SelectItem value="semiannual">Every 6 months</SelectItem>

                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Next payment</Label>

            <Input
              type="date"
              value={subscription.nextPaymentDate}
              onChange={(e) =>
                update(subscription.id, {
                  nextPaymentDate: e.target.value,
                })
              }
              className="h-12 rounded-2xl"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addSubscription}
        className="h-12 rounded-2xl"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add another subscription
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
