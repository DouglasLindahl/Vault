"use client";

import { useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { nextTagColor } from "@/lib/tag-colors";
import type { TagOption } from "@/lib/types";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function TagPicker({
  tags,
  selectedIds,
  onChange,
  onCreateTag,
}: {
  tags: TagOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateTag?: (input: { name: string; color: string }) => Promise<TagOption>;
}) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selected = tags.filter((t) => selectedIds.includes(t.id));

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function remove(id: string) {
    onChange(selectedIds.filter((i) => i !== id));
  }

  async function handleCreate() {
    const name = newTagName.trim();
    if (!name || !onCreateTag) return;
    setIsCreating(true);
    try {
      const tag = await onCreateTag({ name, color: nextTagColor(tags.length) });
      onChange([...selectedIds, tag.id]);
      setNewTagName("");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-border px-3.5 text-sm"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {selected.length === 0 && (
              <span className="text-zinc-400">Add tags (optional)</span>
            )}
            {selected.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-0.5 pl-2 pr-1 text-xs font-medium text-foreground dark:bg-white/[0.06] dark:text-white"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(tag.id);
                  }}
                  className="rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-white/[0.1]"
                >
                  <X className="h-2.5 w-2.5" />
                </span>
              </span>
            ))}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl border-border p-2" align="start">
        <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
          {tags.length === 0 && (
            <p className="px-2 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              No tags yet — create one below.
            </p>
          )}
          {tags.map((tag) => (
            <label
              key={tag.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-white/[0.04]",
              )}
            >
              <Checkbox
                checked={selectedIds.includes(tag.id)}
                onCheckedChange={() => toggle(tag.id)}
              />
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span className="truncate text-sm text-foreground dark:text-white">
                {tag.name}
              </span>
            </label>
          ))}
        </div>

        {onCreateTag && (
          <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="New tag"
              className="h-9 rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newTagName.trim() || isCreating}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-surface text-white disabled:opacity-50"
              aria-label="Create tag"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
