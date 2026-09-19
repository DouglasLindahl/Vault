import type { TagOption } from "@/lib/types";

export function TagChips({ tags }: { tags: TagOption[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300"
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          {tag.name}
        </span>
      ))}
    </div>
  );
}
