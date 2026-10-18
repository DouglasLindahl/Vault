"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  GRID_COLS,
  ROW_HEIGHT,
  WIDGET_CATALOG,
  clampSize,
  compactLayout,
  layoutRows,
  moveBox,
  type Widget,
} from "@/lib/dashboard-layout";
import { WidgetContent } from "@/components/dashboard/widgets";

// Edit-mode grid. Cards are absolutely positioned from their (x, y, w, h)
// cells using the same maths as the dashboard's CSS grid, so what you
// arrange here is exactly what the dashboard shows.
//
//  • Drag a card (mouse: after 4px; touch: long-press) to move it. It
//    snaps to cells; the dashed box is where it will land, and the other
//    cards make room / float up live.
//  • Drag the bottom-right corner to resize, snapping to whole cells.
//  • Keyboard: arrows move, Shift+arrows resize, Enter edits, Delete removes.

type Interaction = {
  kind: "move" | "resize";
  id: string;
  origin: Widget; // the card as it was when the gesture started
  base: Widget[]; // the whole layout when the gesture started
  dx: number;
  dy: number;
  preview: Widget[];
};

const MOUSE_DRAG_THRESHOLD = 4;
const TOUCH_HOLD_MS = 250;
const TOUCH_SLOP = 8;

export function GridCanvas({
  widgets,
  gap,
  selectedId,
  onSelect,
  onChange,
  onRemove,
}: {
  widgets: Widget[];
  gap: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (widgets: Widget[]) => void;
  onRemove: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<Interaction | null>(null);

  // Latest values for the window-level pointer handlers.
  const widgetsRef = useRef(widgets);
  widgetsRef.current = widgets;
  const activeRef = useRef<Interaction | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cellWidth = width > 0 ? (width - gap * (GRID_COLS - 1)) / GRID_COLS : 0;
  const pitchX = cellWidth + gap;
  const pitchY = ROW_HEIGHT + gap;

  function boxPx(b: { x: number; y: number; w: number; h: number }) {
    return {
      left: b.x * pitchX,
      top: b.y * pitchY,
      width: b.w * cellWidth + (b.w - 1) * gap,
      height: b.h * ROW_HEIGHT + (b.h - 1) * gap,
    };
  }

  function computePreview(i: Omit<Interaction, "preview">): Widget[] {
    const { origin } = i;
    const start = boxPx(origin);
    let next: Widget;
    if (i.kind === "move") {
      const x = Math.round((start.left + i.dx) / pitchX);
      const y = Math.round((start.top + i.dy) / pitchY);
      next = {
        ...origin,
        x: Math.min(GRID_COLS - origin.w, Math.max(0, x)),
        y: Math.max(0, y),
      };
      return moveBox(i.base, next);
    } else {
      const size = clampSize(
        origin.type,
        (start.width + i.dx + gap) / pitchX,
        (start.height + i.dy + gap) / pitchY,
      );
      next = { ...origin, ...size, w: Math.min(size.w, GRID_COLS - origin.x) };
    }
    return compactLayout(i.base, next);
  }

  function update(i: Omit<Interaction, "preview">) {
    const next = { ...i, preview: computePreview(i) };
    activeRef.current = next;
    setActive(next);
  }

  // One gesture = pointerdown → (maybe) drag → pointerup. A gesture that
  // never starts dragging is a click, which selects the card.
  function beginGesture(e: React.PointerEvent, widget: Widget, kind: Interaction["kind"]) {
    if (e.button !== 0 || cellWidth <= 0) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const isTouch = e.pointerType === "touch";
    // The resize corner is an explicit handle, so it starts immediately.
    let armed = kind === "resize" || !isTouch;
    let dragging = false;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    const start = () => {
      dragging = true;
      document.body.style.userSelect = "none";
      document.body.style.cursor = kind === "resize" ? "nwse-resize" : "grabbing";
      update({ kind, id: widget.id, origin: widget, base: widgetsRef.current, dx: 0, dy: 0 });
    };

    if (isTouch && kind === "move") {
      holdTimer = setTimeout(() => {
        armed = true;
        navigator.vibrate?.(10);
        start();
      }, TOUCH_HOLD_MS);
    }

    // Once a touch drag is armed, stop the page from scrolling under it.
    const blockScroll = (ev: TouchEvent) => {
      if (armed) ev.preventDefault();
    };

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging) {
        const dist = Math.hypot(dx, dy);
        if (isTouch && !armed) {
          if (dist > TOUCH_SLOP) cleanup(); // it's a scroll, not a drag
          return;
        }
        if (kind === "move" && dist < MOUSE_DRAG_THRESHOLD) return;
        start();
      }
      const current = activeRef.current;
      if (current) update({ ...current, dx, dy });
    };

    const onUp = () => {
      const current = activeRef.current;
      cleanup();
      if (dragging && current) onChange(current.preview);
      else if (kind === "move") onSelect(widget.id);
    };

    function cleanup() {
      clearTimeout(holdTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", cleanup);
      window.removeEventListener("touchmove", blockScroll);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      activeRef.current = null;
      setActive(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", cleanup);
    window.addEventListener("touchmove", blockScroll, { passive: false });
  }

  function handleKeyDown(e: React.KeyboardEvent, widget: Widget) {
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (e.key === "Enter") {
      e.preventDefault();
      onSelect(widget.id);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onRemove(widget.id);
    } else if (e.key in arrows) {
      e.preventDefault();
      const [dx, dy] = arrows[e.key];
      let next: Widget;
      if (e.shiftKey) {
        const size = clampSize(widget.type, widget.w + dx, widget.h + dy);
        next = { ...widget, ...size, w: Math.min(size.w, GRID_COLS - widget.x) };
        onChange(compactLayout(widgets, next));
      } else {
        // Up/down hop past the nearest card above/below in the same
        // columns (cards float up, so a one-row nudge would snap back).
        const sharesColumns = (w: Widget) =>
          w.id !== widget.id && w.x < widget.x + widget.w && widget.x < w.x + w.w;
        let y = widget.y;
        if (dy < 0) {
          const above = widgets
            .filter((w) => sharesColumns(w) && w.y < widget.y)
            .sort((a, b) => b.y - a.y)[0];
          y = above ? Math.max(0, above.y - 1) : widget.y;
        } else if (dy > 0) {
          const below = widgets
            .filter((w) => sharesColumns(w) && w.y > widget.y)
            .sort((a, b) => a.y - b.y)[0];
          if (!below) return;
          y = below.y + 1;
        }
        next = {
          ...widget,
          x: Math.min(GRID_COLS - widget.w, Math.max(0, widget.x + dx)),
          y,
        };
        onChange(moveBox(widgets, next));
      }
    }
  }

  // Keep a keyboard-moved card in view.
  const focusedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!focusedRef.current) return;
    document
      .getElementById(`widget-${focusedRef.current}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [widgets]);

  const shown = active?.preview ?? widgets;
  const rows = layoutRows(shown);
  // A few spare rows so cards can be dragged below the last one.
  const height = Math.max(rows + 4, 12) * pitchY;
  const landing = active ? shown.find((w) => w.id === active.id) : undefined;

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      style={{
        height,
        // Faint cell guides so the grid is visible while editing.
        backgroundImage:
          cellWidth > 0
            ? `linear-gradient(to right, hsl(var(--accent) / 0.06) ${cellWidth}px, transparent ${cellWidth}px)`
            : undefined,
        backgroundSize: `${pitchX}px ${pitchY}px`,
      }}
    >
      {width > 0 && landing && active?.kind === "move" && (
        <div
          className="pointer-events-none absolute rounded-[var(--dash-radius,28px)] border-2 border-dashed border-accent bg-accent/[0.08] transition-all duration-150"
          style={boxPx(landing)}
        />
      )}

      {width > 0 &&
        shown.map((widget) => {
          const isActive = active?.id === widget.id;
          const moving = isActive && active?.kind === "move";
          const resizing = isActive && active?.kind === "resize";
          // A card being moved follows the pointer freely; everything else
          // (including a card being resized) sits on its snapped cells.
          const box =
            moving && active
              ? (() => {
                  const o = boxPx(active.origin);
                  return { ...o, left: o.left + active.dx, top: o.top + active.dy };
                })()
              : boxPx(widget);
          const label = WIDGET_CATALOG[widget.type].label;

          return (
            <div
              key={widget.id}
              id={`widget-${widget.id}`}
              role="button"
              tabIndex={0}
              aria-label={`${widget.title ?? label}, ${widget.w} by ${widget.h} cells. Arrows to move, Shift+arrows to resize, Enter to edit, Delete to remove`}
              onPointerDown={(e) => beginGesture(e, widget, "move")}
              onFocus={() => (focusedRef.current = widget.id)}
              onBlur={() => (focusedRef.current = null)}
              onKeyDown={(e) => handleKeyDown(e, widget)}
              className={cn(
                "group absolute left-0 top-0 rounded-[var(--dash-radius,28px)] outline-none",
                moving
                  ? "z-40 cursor-grabbing opacity-90 shadow-2xl"
                  : "cursor-grab transition-[transform,width,height] duration-150 ease-out",
                widget.id === selectedId || isActive
                  ? "ring-2 ring-accent ring-offset-4 ring-offset-background"
                  : "hover:ring-2 hover:ring-accent/40 hover:ring-offset-4 hover:ring-offset-background focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background",
              )}
              style={{
                width: box.width,
                height: box.height,
                transform: `translate(${box.left}px, ${box.top}px)${moving ? " scale(1.02)" : ""}`,
              }}
            >
              {/* Live preview with real data, but not clickable while editing. */}
              <div inert className="pointer-events-none h-full">
                <WidgetContent widget={widget} />
              </div>

              <button
                type="button"
                tabIndex={-1}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRemove(widget.id)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/90 text-zinc-500 opacity-0 shadow-sm backdrop-blur transition hover:bg-red-500 hover:text-white group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                aria-label="Remove card"
                title="Remove card"
              >
                <X className="h-4 w-4" />
              </button>

              <div
                onPointerDown={(e) => beginGesture(e, widget, "resize")}
                className="absolute -bottom-1 -right-1 z-10 flex h-7 w-7 cursor-nwse-resize touch-none items-end justify-end p-1.5"
                title="Drag to resize"
                aria-hidden
              >
                <span
                  className={cn(
                    "h-3.5 w-3.5 rounded-br-[6px] border-b-[3px] border-r-[3px] border-accent transition-opacity",
                    resizing ? "opacity-100" : "opacity-40 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
                  )}
                />
              </div>

              {isActive && (
                <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground px-3 py-1 text-xs font-semibold tabular-nums text-background shadow-lg">
                  {(landing ?? widget).w} × {(landing ?? widget).h}
                </span>
              )}
            </div>
          );
        })}
    </div>
  );
}
