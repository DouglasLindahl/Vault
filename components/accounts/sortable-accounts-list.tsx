"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical, Pencil } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { createClient } from "@/lib/supabase/client";
import { reorderInstitutions } from "@/lib/queries/institutions";
import type { Institution } from "@/lib/types";

function currency(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function SortableAccountRow({ account }: { account: Institution }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
    >
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-xl text-zinc-300 hover:bg-zinc-50 hover:text-zinc-500 active:cursor-grabbing dark:text-zinc-600 dark:hover:bg-white/[0.04]"
          aria-label={`Drag to reorder ${account.name}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Link
          href={`/protected/dashboard/institutions/${account.id}`}
          className="flex min-w-0 items-center gap-2.5"
        >
          <span className="truncate text-sm font-medium text-[#172033] dark:text-white">
            {account.name}
          </span>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
            {account.type}
          </span>
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-sm font-semibold tabular-nums text-[#172033] dark:text-white">
          {currency(account.balance)}
        </span>
        <Link
          href={`/protected/dashboard/institutions/${account.id}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-[#315cff] dark:hover:bg-white/[0.04] dark:hover:text-pink-400"
          aria-label={`View ${account.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function SortableAccountsList({
  institutions,
}: {
  institutions: Institution[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(institutions);

  useEffect(() => {
    setItems(institutions);
  }, [institutions]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((a) => a.id === active.id);
    const newIndex = items.findIndex((a) => a.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const supabase = createClient();
    await reorderInstitutions(
      supabase,
      reordered.map((a) => a.id),
    );
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No accounts yet.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1">
          {items.map((account) => (
            <SortableAccountRow key={account.id} account={account} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
