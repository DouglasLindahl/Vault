"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJIS = [
  "💼",
  "💵",
  "💰",
  "💸",
  "🏠",
  "🏡",
  "🚗",
  "🏎️",
  "⚡",
  "💡",
  "📱",
  "🛡️",
  "🎬",
  "🎵",
  "🎧",
  "🎮",
  "💻",
  "☁️",
  "💪",
  "🏋️",
  "🛒",
  "🥩",
  "🍔",
  "🍕",
  "🍺",
  "☕",
  "👕",
  "👟",
  "⛽",
  "✈️",
  "🐕",
  "🐈",
  "👶",
  "📚",
  "🎁",
  "❤️",
  "✨",
];

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-14 rounded-2xl text-xl"
        >
          {value || "✨"}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[280px] rounded-2xl p-3">
        <div className="grid grid-cols-7 gap-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
