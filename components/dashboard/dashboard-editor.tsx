"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  LayoutGrid,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ACCENTS,
  BACKGROUNDS,
  DENSITIES,
  GRID_COLS,
  MAX_ROWS_PER_CARD,
  RADII,
  WIDGET_CATALOG,
  WIDGET_TYPES,
  clampSize,
  compactLayout,
  createWidget,
  defaultLayout,
  findFreeSpot,
  newWidgetId,
  type AccentKey,
  type DashboardLayout,
  type DashboardTheme,
  type GoalSource,
  type Timeframe,
  type Widget,
  type WidgetOptions,
} from "@/lib/dashboard-layout";
import { saveDashboardLayoutAction } from "@/lib/actions/dashboard-layout";
import { useDashboardData } from "@/app/protected/dashboard/dashboard-provider";
import { DashboardHeader, DashboardSurface, gridGap } from "@/components/dashboard/widgets";
import { GridCanvas } from "@/components/dashboard/grid-canvas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// ---------------------------------------------------------------------
// Small form controls
// ---------------------------------------------------------------------

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-white/[0.04]">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
            value === o.value
              ? "bg-white text-foreground shadow-sm dark:bg-white/[0.1] dark:text-white"
              : "text-zinc-500 hover:text-foreground dark:hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Swatches({
  value,
  onChange,
  defaultLabel,
}: {
  value: AccentKey;
  onChange: (v: AccentKey) => void;
  defaultLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(ACCENTS) as AccentKey[]).map((key) => {
        const accent = ACCENTS[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={key === "default" ? defaultLabel : accent.label}
            aria-label={key === "default" ? defaultLabel : accent.label}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-all",
              value === key ? "ring-2 ring-foreground" : "hover:scale-110",
            )}
            style={{
              background: accent.hsl
                ? `hsl(${accent.hsl})`
                : "conic-gradient(hsl(227 100% 60%), hsl(330 81% 64%), hsl(160 72% 40%), hsl(38 92% 50%), hsl(227 100% 60%))",
            }}
          >
            {value === key && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 dark:hover:bg-white/[0.04]"
        aria-label={`Decrease ${label}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums text-foreground dark:text-white">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 dark:hover:bg-white/[0.04]"
        aria-label={`Increase ${label}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-foreground dark:text-white">{label}</span>
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

// ---------------------------------------------------------------------
// Sidebar panels
// ---------------------------------------------------------------------

function AddCardsPanel({
  widgets,
  onAdd,
}: {
  widgets: Widget[];
  onAdd: (type: Widget["type"]) => void;
}) {
  const present = new Set(widgets.map((w) => w.type));
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Click a card to drop it into the first free space, then drag it where you want it.
      </p>
      {WIDGET_TYPES.map((type) => {
        const entry = WIDGET_CATALOG[type];
        const added = !entry.multiple && present.has(type);
        return (
          <button
            key={type}
            type="button"
            disabled={added}
            onClick={() => onAdd(type)}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border px-3 py-2.5 text-left transition hover:border-accent/50 hover:bg-accent/[0.04] disabled:cursor-default disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-transparent"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground dark:text-white">
                {entry.label}
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {entry.description}
              </span>
            </span>
            {added ? (
              <span className="shrink-0 text-xs text-zinc-400">Added</span>
            ) : (
              <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-400">
                {entry.w}×{entry.h}
                <Plus className="h-4 w-4 text-accent" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StylePanel({
  theme,
  onChange,
}: {
  theme: DashboardTheme;
  onChange: (patch: Partial<DashboardTheme>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Accent color">
        <Swatches value={theme.accent} onChange={(accent) => onChange({ accent })} defaultLabel="App default" />
      </Field>
      <Field label="Corners">
        <Segmented
          value={theme.radius}
          options={Object.entries(RADII).map(([value, r]) => ({ value: value as DashboardTheme["radius"], label: r.label }))}
          onChange={(radius) => onChange({ radius })}
        />
      </Field>
      <Field label="Spacing">
        <Segmented
          value={theme.density}
          options={Object.entries(DENSITIES).map(([value, d]) => ({ value: value as DashboardTheme["density"], label: d.label }))}
          onChange={(density) => onChange({ density })}
        />
      </Field>
      <Field label="Background">
        <Segmented
          value={theme.background}
          options={Object.entries(BACKGROUNDS).map(([value, b]) => ({ value: value as DashboardTheme["background"], label: b.label }))}
          onChange={(background) => onChange({ background })}
        />
      </Field>
      <Field label="Page title">
        <Input
          value={theme.title}
          maxLength={40}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-10 rounded-xl"
        />
      </Field>
      <Field label="Subtitle">
        <Input
          value={theme.subtitle}
          maxLength={80}
          disabled={theme.greeting}
          placeholder="(none)"
          onChange={(e) => onChange({ subtitle: e.target.value })}
          className="h-10 rounded-xl"
        />
      </Field>
      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <ToggleRow
          label="Greeting"
          description="“Good morning, …” instead of the subtitle."
          checked={theme.greeting}
          onChange={(greeting) => onChange({ greeting })}
        />
        <ToggleRow
          label="Hide amounts"
          description="Blur every number. Hover to peek."
          checked={theme.hideAmounts}
          onChange={(hideAmounts) => onChange({ hideAmounts })}
        />
        <ToggleRow
          label="Header buttons"
          description="Add transaction / institution / tag at the top."
          checked={theme.showHeaderActions}
          onChange={(showHeaderActions) => onChange({ showHeaderActions })}
        />
      </div>
    </div>
  );
}

function CardPanel({
  widget,
  onChange,
  onResize,
  onDuplicate,
  onRemove,
  onClose,
}: {
  widget: Widget;
  onChange: (patch: Partial<Widget>) => void;
  onResize: (w: number, h: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const entry = WIDGET_CATALOG[widget.type];
  const opts = widget.options ?? {};
  const setOption = (patch: WidgetOptions) => onChange({ options: { ...opts, ...patch } });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground dark:text-white">{entry.label}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{entry.description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.08]"
          aria-label="Done editing card"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {widget.type !== "cash-flow-chart" && (
        <Field label="Title">
          <Input
            value={widget.title ?? ""}
            placeholder={entry.label}
            maxLength={40}
            onChange={(e) => onChange({ title: e.target.value || undefined })}
            className="h-10 rounded-xl"
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Width (cells)">
          <Stepper
            label="width"
            value={widget.w}
            min={entry.minW}
            max={GRID_COLS - widget.x}
            onChange={(w) => onResize(w, widget.h)}
          />
        </Field>
        <Field label="Height (cells)">
          <Stepper
            label="height"
            value={widget.h}
            min={entry.minH}
            max={MAX_ROWS_PER_CARD}
            onChange={(h) => onResize(widget.w, h)}
          />
        </Field>
      </div>

      {widget.type !== "cash-flow-chart" && (
        <Field label="Card color">
          <Swatches
            value={widget.color ?? "default"}
            onChange={(color) => onChange({ color: color === "default" ? undefined : color })}
            defaultLabel="Same as page"
          />
        </Field>
      )}

      {opts.timeframe !== undefined && (
        <Field label="Default period">
          <Segmented<Timeframe>
            value={opts.timeframe}
            options={["Week", "Month", "Year"].map((t) => ({ value: t as Timeframe, label: t }))}
            onChange={(timeframe) => setOption({ timeframe })}
          />
        </Field>
      )}

      {opts.count !== undefined && (
        <Field label="Rows to show">
          <Segmented
            value={opts.count}
            options={[3, 5, 8, 10].map((n) => ({ value: n, label: String(n) }))}
            onChange={(count) => setOption({ count })}
          />
        </Field>
      )}

      {opts.emoji !== undefined && (
        <Field label="Emoji">
          <Input
            value={opts.emoji}
            maxLength={8}
            onChange={(e) => setOption({ emoji: e.target.value })}
            className="h-10 w-24 rounded-xl text-center text-lg"
          />
        </Field>
      )}

      {opts.text !== undefined && (
        <Field label="Text">
          <textarea
            value={opts.text}
            maxLength={500}
            rows={4}
            onChange={(e) => setOption({ text: e.target.value })}
            className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </Field>
      )}

      {opts.target !== undefined && (
        <Field label="Target amount">
          <Input
            type="number"
            min={1}
            step="1"
            value={opts.target}
            onChange={(e) => setOption({ target: Math.max(1, Number(e.target.value) || 1) })}
            className="h-10 rounded-xl"
          />
        </Field>
      )}

      {opts.source !== undefined && (
        <Field label="Track">
          <Segmented<GoalSource>
            value={opts.source}
            options={[
              { value: "cash", label: "Cash" },
              { value: "investments", label: "Investments" },
              { value: "net-worth", label: "Net worth" },
            ]}
            onChange={(source) => setOption({ source })}
          />
        </Field>
      )}

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        {entry.multiple && (
          <Button type="button" variant="outline" size="sm" onClick={onDuplicate} className="rounded-xl">
            <Copy className="mr-1 h-4 w-4" /> Duplicate
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="rounded-xl text-red-600 hover:text-red-600 dark:text-red-400"
        >
          <Trash2 className="mr-1 h-4 w-4" /> Remove
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------

type Tab = "cards" | "style" | "card";

export function DashboardEditor() {
  const router = useRouter();
  const { dashboardLayout: saved } = useDashboardData();

  const [draft, setDraft] = useState<DashboardLayout>(saved);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("cards");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  // Closing/reloading the tab with unsaved changes asks first.
  useEffect(() => {
    if (!dirty || isSaving) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, isSaving]);

  const selected = draft.widgets.find((w) => w.id === selectedId) ?? null;

  function setWidgets(update: (widgets: Widget[]) => Widget[]) {
    setDraft((d) => ({ ...d, widgets: update(d.widgets) }));
  }

  function updateWidget(id: string, patch: Partial<Widget>) {
    setWidgets((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }

  // Size changes go through the layout engine so neighbours make room.
  function resizeWidget(id: string, w: number, h: number) {
    setWidgets((ws) => {
      const widget = ws.find((x) => x.id === id);
      if (!widget) return ws;
      const size = clampSize(widget.type, w, h);
      return compactLayout(ws, { ...widget, ...size, w: Math.min(size.w, GRID_COLS - widget.x) });
    });
  }

  function select(id: string) {
    setSelectedId(id);
    setTab("card");
  }

  function scrollToWidget(id: string) {
    setTimeout(() => {
      document.getElementById(`widget-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function removeWidget(id: string) {
    setWidgets((ws) => compactLayout(ws.filter((w) => w.id !== id)));
    if (selectedId === id) {
      setSelectedId(null);
      setTab("cards");
    }
  }

  function addWidget(type: Widget["type"]) {
    const widget = createWidget(type, draft.widgets);
    setWidgets((ws) => compactLayout([...ws, widget]));
    select(widget.id);
    scrollToWidget(widget.id);
  }

  function duplicateWidget(widget: Widget) {
    const spot = findFreeSpot(draft.widgets, widget.w, widget.h);
    const copy: Widget = {
      ...widget,
      ...spot,
      id: newWidgetId(),
      options: widget.options && { ...widget.options },
    };
    setWidgets((ws) => compactLayout([...ws, copy]));
    select(copy.id);
    scrollToWidget(copy.id);
  }

  function resetToDefault() {
    if (!window.confirm("Reset your dashboard to the default cards and style? You can still cancel before saving.")) return;
    setDraft(defaultLayout());
    setSelectedId(null);
    setTab("cards");
  }

  function cancel() {
    if (dirty && !window.confirm("Discard your changes?")) return;
    router.push("/protected/dashboard");
  }

  async function save() {
    setIsSaving(true);
    setError(null);
    try {
      await saveDashboardLayoutAction(draft);
      router.push("/protected/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't save your dashboard.");
      setIsSaving(false);
    }
  }

  const tabs: { value: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "cards", label: "Add cards", icon: LayoutGrid },
    { value: "style", label: "Style", icon: Palette },
    ...(selected ? [{ value: "card" as Tab, label: "Card", icon: SlidersHorizontal }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/90 px-6 py-3 backdrop-blur md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground dark:text-white">Editing dashboard</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Drag a card to move it, drag its corner to resize, click it to customize.
              {dirty && <span className="ml-1 font-medium text-accent">Unsaved changes</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" onClick={resetToDefault} className="rounded-xl">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to default
            </Button>
            <Button type="button" variant="outline" onClick={cancel} disabled={isSaving} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={isSaving || !dirty}
              className="rounded-xl bg-primary-surface text-white"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        {error && (
          <p className="mt-2 rounded-xl bg-red-500/[0.07] px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 md:px-10 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Sidebar */}
        <aside className="order-1 xl:order-2">
          <div className="rounded-[24px] border border-border bg-card p-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
            <div className="mb-4 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-white/[0.04]">
              {tabs.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                    tab === t.value
                      ? "bg-white text-foreground shadow-sm dark:bg-white/[0.1] dark:text-white"
                      : "text-zinc-500",
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "cards" && <AddCardsPanel widgets={draft.widgets} onAdd={addWidget} />}
            {tab === "style" && (
              <StylePanel
                theme={draft.theme}
                onChange={(patch) => setDraft((d) => ({ ...d, theme: { ...d.theme, ...patch } }))}
              />
            )}
            {tab === "card" && selected && (
              <CardPanel
                widget={selected}
                onChange={(patch) => updateWidget(selected.id, patch)}
                onResize={(w, h) => resizeWidget(selected.id, w, h)}
                onDuplicate={() => duplicateWidget(selected)}
                onRemove={() => removeWidget(selected.id)}
                onClose={() => {
                  setSelectedId(null);
                  setTab("cards");
                }}
              />
            )}
          </div>
        </aside>

        {/* Canvas — the dashboard as it will look, on its editing grid */}
        <div className="order-2 min-w-0 overflow-x-auto xl:order-1">
          <DashboardSurface
            theme={draft.theme}
            className="min-w-[720px] rounded-[32px] border-2 border-dashed border-accent/30 p-4 md:p-6"
          >
            <DashboardHeader theme={draft.theme} interactive={false} />
            {draft.widgets.length === 0 && (
              <p className="mb-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No cards yet — pick some from “Add cards”.
              </p>
            )}
            <GridCanvas
              widgets={draft.widgets}
              gap={gridGap(draft.theme)}
              selectedId={selectedId}
              onSelect={select}
              onChange={(widgets) => setWidgets(() => widgets)}
              onRemove={removeWidget}
            />
          </DashboardSurface>
        </div>
      </div>
    </div>
  );
}
