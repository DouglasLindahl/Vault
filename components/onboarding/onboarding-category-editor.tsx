"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type EditableCategory = {
  id: string;
  emoji: string;
  name: string;
  color: string;
};

type Props = {
  categories: EditableCategory[];
  onChange: (categories: EditableCategory[]) => void;
  addLabel?: string;
};

const COLORS = [
  "#EC4899",
  "#8B5CF6",
  "#3B82F6",
  "#06B6D4",
  "#22C55E",
  "#EAB308",
  "#F97316",
];

export function CategoryEditor({
  categories,
  onChange,
  addLabel = "Add category",
}: Props) {
  function updateCategory(id: string, updates: Partial<EditableCategory>) {
    onChange(
      categories.map((category) =>
        category.id === id ? { ...category, ...updates } : category,
      ),
    );
  }

  function removeCategory(id: string) {
    onChange(categories.filter((category) => category.id !== id));
  }

  function addCategory() {
    onChange([
      ...categories,
      {
        id: crypto.randomUUID(),
        emoji: "✨",
        name: "",
        color: "#EC4899",
      },
    ]);
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"
        >
          <div className="flex gap-3">
            <Input
              value={category.emoji}
              onChange={(e) =>
                updateCategory(category.id, {
                  emoji: e.target.value,
                })
              }
              className="h-11 w-16 rounded-xl text-center text-xl"
              maxLength={4}
            />

            <Input
              value={category.name}
              onChange={(e) =>
                updateCategory(category.id, {
                  name: e.target.value,
                })
              }
              placeholder="Category name"
              className="h-11 flex-1 rounded-xl"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeCategory(category.id)}
              className="h-11 w-11 shrink-0 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => updateCategory(category.id, { color })}
                className="flex h-8 w-8 items-center justify-center rounded-full border"
                style={{
                  borderColor: category.color === color ? color : "transparent",
                }}
              >
                <span
                  className="h-5 w-5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </button>
            ))}
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addCategory}
        className="h-11 rounded-xl"
      >
        <Plus className="mr-2 h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
