// Per-user dashboard customization: which cards ("widgets") are shown and
// where they sit on a 12-column grid, plus page-level styling. Stored as
// JSON in profiles.dashboard_layout (supabase/sql/phase11_dashboard_layout.sql)
// and always passed through sanitizeLayout() — on read and before save — so
// a stale or hand-edited value can never break the dashboard.
//
// Client-safe: imported by both the dashboard and the editor.

export const WIDGET_TYPES = [
  "net-worth",
  "cash",
  "investments",
  "accounts",
  "tag-spend",
  "upcoming-recurring",
  "recent-activity",
  "month-flow",
  "recurring-summary",
  "savings-rate",
  "biggest-expenses",
  "cash-flow-chart",
  "quick-actions",
  "savings-goal",
  "note",
] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

// ---------------------------------------------------------------------
// Grid
//
// Every card occupies a w×h block of cells at (x, y). Cell width is
// 1/12 of the dashboard; cell height is fixed. With gap g between cells, a
// card is `w·cellWidth + (w-1)·g` wide and `h·ROW_HEIGHT + (h-1)·g` tall —
// the same maths CSS grid uses, so the editor (absolute positioning, see
// dashboard-editor.tsx) and the dashboard (CSS grid) line up exactly.
// ---------------------------------------------------------------------

export const GRID_COLS = 12;
export const ROW_HEIGHT = 24; // px
export const MAX_ROWS_PER_CARD = 40;

export type GridBox = { id: string; x: number; y: number; w: number; h: number };

function overlaps(a: GridBox, b: GridBox) {
  return (
    a.id !== b.id && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}

// Places each box (top-to-bottom, left-to-right) as high as it fits without
// overlapping the ones already placed — no gaps, no overlaps. `pinned` (the
// box being dragged/resized) is placed first at exactly its position so
// everything else flows around it, then may float up into free space.
export function compactLayout<T extends GridBox>(items: T[], pinned?: T): T[] {
  const placed: T[] = [];
  const fit = (box: T) => {
    const b = { ...box };
    while (b.y > 0 && !placed.some((p) => overlaps({ ...b, y: b.y - 1 }, p))) b.y--;
    while (placed.some((p) => overlaps(b, p))) b.y++;
    placed.push(b);
  };

  if (pinned) placed.push({ ...pinned });
  const rest = items
    .filter((i) => i.id !== pinned?.id)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const item of rest) fit(item);

  if (!pinned) return placed;
  // Second pass so the pinned box itself also settles upward.
  const settled: T[] = [];
  for (const item of [...placed].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const b = { ...item };
    while (b.y > 0 && !settled.some((p) => overlaps({ ...b, y: b.y - 1 }, p))) b.y--;
    while (settled.some((p) => overlaps(b, p))) b.y++;
    settled.push(b);
  }
  return settled;
}

// Moving a card works like a sortable list laid out on the grid: the
// card's dropped position decides where it falls in reading order
// (top-to-bottom, then left-to-right; it wins ties), and the board is then
// compacted in that order. So dragging a card's top past another card's
// top makes them trade places, in either direction. Dropping squarely onto
// one other card that fits where the moved one came from swaps the two.
// `items` is the layout before the move.
export function moveBox<T extends GridBox>(items: T[], moved: T): T[] {
  const original = items.find((i) => i.id === moved.id);
  let others = items.filter((i) => i.id !== moved.id);
  const hits = others.filter((o) => overlaps(moved, o));
  if (original && hits.length === 1) {
    const hit = hits[0];
    const swapped = { ...hit, x: Math.min(original.x, GRID_COLS - hit.w), y: original.y };
    const rest = others.filter((o) => o.id !== hit.id);
    if (!overlaps(swapped, moved) && !rest.some((o) => overlaps(swapped, o))) {
      others = [...rest, swapped];
    }
  }

  const ordered = [...others, moved].sort(
    (a, b) =>
      a.y - b.y || (a.id === moved.id ? -1 : b.id === moved.id ? 1 : a.x - b.x),
  );
  const placed: T[] = [];
  for (const item of ordered) {
    const b = { ...item };
    while (b.y > 0 && !placed.some((p) => overlaps({ ...b, y: b.y - 1 }, p))) b.y--;
    while (placed.some((p) => overlaps(b, p))) b.y++;
    placed.push(b);
  }
  return placed;
}

// First free spot (scanning rows top-down, then left-right) for a w×h box.
export function findFreeSpot(items: GridBox[], w: number, h: number): { x: number; y: number } {
  for (let y = 0; ; y++) {
    for (let x = 0; x <= GRID_COLS - w; x++) {
      const candidate = { id: "__new__", x, y, w, h };
      if (!items.some((i) => overlaps(candidate, i))) return { x, y };
    }
  }
}

export function layoutRows(items: GridBox[]) {
  return items.reduce((max, i) => Math.max(max, i.y + i.h), 0);
}

// Reading order — used for the stacked phone layout and keyboard focus.
export function sortByPosition<T extends GridBox>(items: T[]): T[] {
  return [...items].sort((a, b) => a.y - b.y || a.x - b.x);
}

// ---------------------------------------------------------------------
// Styling options
// ---------------------------------------------------------------------

export const ACCENTS = {
  default: { label: "Default", hsl: null },
  blue: { label: "Blue", hsl: "227 100% 60%" },
  pink: { label: "Pink", hsl: "330 81% 64%" },
  violet: { label: "Violet", hsl: "262 83% 62%" },
  emerald: { label: "Emerald", hsl: "160 72% 40%" },
  teal: { label: "Teal", hsl: "184 78% 40%" },
  amber: { label: "Amber", hsl: "38 92% 50%" },
  orange: { label: "Orange", hsl: "24 94% 53%" },
  rose: { label: "Rose", hsl: "350 89% 60%" },
} as const;
export type AccentKey = keyof typeof ACCENTS;

export const RADII = {
  sharp: { label: "Sharp", px: 10 },
  soft: { label: "Soft", px: 18 },
  round: { label: "Round", px: 28 },
} as const;
export type RadiusKey = keyof typeof RADII;

export const DENSITIES = {
  compact: { label: "Compact", gap: 12 },
  cozy: { label: "Cozy", gap: 24 }, // the original dashboard spacing
  airy: { label: "Airy", gap: 36 },
} as const;
export type DensityKey = keyof typeof DENSITIES;

export const BACKGROUNDS = {
  glow: { label: "Glow" },
  dots: { label: "Dots" },
  plain: { label: "Plain" },
} as const;
export type BackgroundKey = keyof typeof BACKGROUNDS;

export type Timeframe = "Week" | "Month" | "Year";
export type GoalSource = "net-worth" | "cash" | "investments";

export type WidgetOptions = {
  timeframe?: Timeframe; // tag-spend
  count?: number; // upcoming-recurring, recent-activity, biggest-expenses
  text?: string; // note
  emoji?: string; // note, savings-goal
  target?: number; // savings-goal
  source?: GoalSource; // savings-goal
};

export type Widget = GridBox & {
  type: WidgetType;
  title?: string;
  color?: AccentKey;
  options?: WidgetOptions;
};

export type DashboardTheme = {
  accent: AccentKey;
  radius: RadiusKey;
  density: DensityKey;
  background: BackgroundKey;
  title: string;
  subtitle: string;
  greeting: boolean;
  hideAmounts: boolean;
  showHeaderActions: boolean;
};

export type DashboardLayout = {
  version: 2;
  widgets: Widget[];
  theme: DashboardTheme;
};

type CatalogEntry = {
  label: string;
  description: string;
  // Default and minimum size in grid cells. Minimums are what the card's
  // content needs to stay readable; anything taller scrolls inside.
  w: number;
  h: number;
  minW: number;
  minH: number;
  multiple?: boolean;
  defaultOptions?: WidgetOptions;
};

export const WIDGET_CATALOG: Record<WidgetType, CatalogEntry> = {
  "net-worth": {
    label: "Net worth",
    description: "Cash and investments combined.",
    w: 4, h: 3, minW: 2, minH: 3,
  },
  cash: {
    label: "Cash across banks",
    description: "Total of every bank account.",
    w: 4, h: 3, minW: 2, minH: 3,
  },
  investments: {
    label: "Investments value",
    description: "Live value of your holdings.",
    w: 4, h: 3, minW: 2, minH: 3,
  },
  accounts: {
    label: "Accounts",
    description: "Every institution and its balance.",
    w: 6, h: 8, minW: 3, minH: 4,
  },
  "tag-spend": {
    label: "Spending by tag",
    description: "Where your money went, by tag.",
    w: 6, h: 8, minW: 4, minH: 4,
    defaultOptions: { timeframe: "Month" },
  },
  "upcoming-recurring": {
    label: "Upcoming recurring",
    description: "What's about to come in or go out.",
    w: 12, h: 10, minW: 4, minH: 4,
    defaultOptions: { count: 6 },
  },
  "recent-activity": {
    label: "Recent activity",
    description: "Your latest transactions.",
    w: 12, h: 9, minW: 4, minH: 4,
    defaultOptions: { count: 5 },
  },
  "month-flow": {
    label: "This month",
    description: "Money in, out and what's left this month.",
    w: 6, h: 5, minW: 3, minH: 5,
  },
  "recurring-summary": {
    label: "Recurring per month",
    description: "Monthly total of your recurring in and out.",
    w: 6, h: 5, minW: 3, minH: 5,
  },
  "savings-rate": {
    label: "Savings rate",
    description: "Share of income kept over the last 30 days.",
    w: 4, h: 4, minW: 2, minH: 4,
  },
  "biggest-expenses": {
    label: "Biggest expenses",
    description: "Largest purchases in the last 30 days.",
    w: 6, h: 8, minW: 4, minH: 4,
    defaultOptions: { count: 5 },
  },
  "cash-flow-chart": {
    label: "Cash flow charts",
    description: "Income and spending over time.",
    w: 12, h: 8, minW: 6, minH: 8,
  },
  "quick-actions": {
    label: "Quick actions",
    description: "Shortcuts to add transactions, accounts and tags.",
    w: 6, h: 4, minW: 3, minH: 4,
  },
  "savings-goal": {
    label: "Savings goal",
    description: "Track progress toward a target.",
    w: 4, h: 5, minW: 3, minH: 4,
    multiple: true,
    defaultOptions: { target: 10000, source: "cash", emoji: "🎯" },
  },
  note: {
    label: "Note",
    description: "A personal reminder, motto or plan.",
    w: 4, h: 4, minW: 2, minH: 3,
    multiple: true,
    defaultOptions: { text: "Pay yourself first.", emoji: "📝" },
  },
};

export function clampSize(type: WidgetType, w: number, h: number) {
  const entry = WIDGET_CATALOG[type];
  return {
    w: Math.min(GRID_COLS, Math.max(entry.minW, Math.round(w))),
    h: Math.min(MAX_ROWS_PER_CARD, Math.max(entry.minH, Math.round(h))),
  };
}

export const DEFAULT_THEME: DashboardTheme = {
  accent: "default",
  radius: "round",
  density: "cozy",
  background: "glow",
  title: "Dashboard",
  subtitle: "Vault overview",
  greeting: false,
  hideAmounts: false,
  showHeaderActions: true,
};

// The original fixed dashboard, expressed as grid cells.
export function defaultLayout(): DashboardLayout {
  const widgets: [WidgetType, number, number, number, number][] = [
    ["net-worth", 0, 0, 4, 3],
    ["cash", 4, 0, 4, 3],
    ["investments", 8, 0, 4, 3],
    ["accounts", 0, 3, 6, 8],
    ["tag-spend", 6, 3, 6, 8],
    ["upcoming-recurring", 0, 11, 12, 10],
    ["recent-activity", 0, 21, 12, 9],
  ];
  return {
    version: 2,
    widgets: widgets.map(([type, x, y, w, h]) => ({
      id: `default-${type}`,
      type,
      x,
      y,
      w,
      h,
      ...(WIDGET_CATALOG[type].defaultOptions
        ? { options: { ...WIDGET_CATALOG[type].defaultOptions } }
        : {}),
    })),
    theme: { ...DEFAULT_THEME },
  };
}

export function newWidgetId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// A new card of `type`, placed in the first free spot of `existing`.
export function createWidget(type: WidgetType, existing: GridBox[]): Widget {
  const entry = WIDGET_CATALOG[type];
  const { x, y } = findFreeSpot(existing, entry.w, entry.h);
  return {
    id: newWidgetId(),
    type,
    x,
    y,
    w: entry.w,
    h: entry.h,
    ...(entry.defaultOptions ? { options: { ...entry.defaultOptions } } : {}),
  };
}

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

const MAX_WIDGETS = 40;

// Version-1 layouts (from before the grid) only had a width preset.
const LEGACY_SIZE_WIDTHS: Record<string, number> = { sm: 4, md: 6, lg: 8, full: 12 };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function cleanString(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.slice(0, max);
  return trimmed.trim() ? trimmed : undefined;
}

function finiteInt(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : undefined;
}

function sanitizeOptions(type: WidgetType, raw: unknown): WidgetOptions | undefined {
  const defaults = WIDGET_CATALOG[type].defaultOptions;
  if (!defaults) return undefined;
  const o = isRecord(raw) ? raw : {};
  const out: WidgetOptions = {};

  if ("timeframe" in defaults) {
    out.timeframe = oneOf(o.timeframe, ["Week", "Month", "Year"] as const, defaults.timeframe!);
  }
  if ("count" in defaults) {
    const n = typeof o.count === "number" ? Math.round(o.count) : defaults.count!;
    out.count = Math.min(20, Math.max(1, n));
  }
  if ("text" in defaults) out.text = cleanString(o.text, 500) ?? "";
  if ("emoji" in defaults) out.emoji = cleanString(o.emoji, 8) ?? defaults.emoji;
  if ("target" in defaults) {
    const t = typeof o.target === "number" && Number.isFinite(o.target) ? o.target : defaults.target!;
    out.target = Math.max(1, Math.min(1e12, t));
  }
  if ("source" in defaults) {
    out.source = oneOf(o.source, ["net-worth", "cash", "investments"] as const, defaults.source!);
  }
  return out;
}

export function sanitizeLayout(input: unknown): DashboardLayout {
  if (!isRecord(input) || !Array.isArray(input.widgets)) return defaultLayout();

  const seenIds = new Set<string>();
  const seenSingles = new Set<WidgetType>();
  const positioned: Widget[] = [];
  const unpositioned: Widget[] = [];

  for (const raw of input.widgets.slice(0, MAX_WIDGETS)) {
    if (!isRecord(raw) || !WIDGET_TYPES.includes(raw.type as WidgetType)) continue;
    const type = raw.type as WidgetType;
    const entry = WIDGET_CATALOG[type];
    if (!entry.multiple) {
      if (seenSingles.has(type)) continue;
      seenSingles.add(type);
    }

    let id = typeof raw.id === "string" && raw.id.length <= 64 ? raw.id : newWidgetId();
    if (seenIds.has(id)) id = newWidgetId();
    seenIds.add(id);

    const legacyW = typeof raw.size === "string" ? LEGACY_SIZE_WIDTHS[raw.size] : undefined;
    const { w, h } = clampSize(type, finiteInt(raw.w) ?? legacyW ?? entry.w, finiteInt(raw.h) ?? entry.h);
    const rawX = finiteInt(raw.x);
    const rawY = finiteInt(raw.y);

    // Same key order as defaultLayout(), so an untouched default compares
    // equal after a save/load round trip (the editor's "unsaved" check).
    const widget: Widget = {
      id,
      type,
      x: Math.min(GRID_COLS - w, Math.max(0, rawX ?? 0)),
      y: Math.min(10_000, Math.max(0, rawY ?? 0)),
      w,
      h,
    };
    const title = cleanString(raw.title, 40);
    if (title) widget.title = title;
    if (typeof raw.color === "string" && raw.color in ACCENTS && raw.color !== "default") {
      widget.color = raw.color as AccentKey;
    }
    const options = sanitizeOptions(type, raw.options);
    if (options) widget.options = options;

    if (rawX === undefined || rawY === undefined) unpositioned.push(widget);
    else positioned.push(widget);
  }

  // Resolve any overlaps, then drop cards that had no position (e.g. a v1
  // layout) into free spots in their original order.
  let widgets = compactLayout(positioned);
  for (const widget of unpositioned) {
    widgets = [...widgets, { ...widget, ...findFreeSpot(widgets, widget.w, widget.h) }];
  }
  widgets = compactLayout(widgets);

  const t = isRecord(input.theme) ? input.theme : {};
  const theme: DashboardTheme = {
    accent: oneOf(t.accent, Object.keys(ACCENTS) as AccentKey[], DEFAULT_THEME.accent),
    radius: oneOf(t.radius, Object.keys(RADII) as RadiusKey[], DEFAULT_THEME.radius),
    density: oneOf(t.density, Object.keys(DENSITIES) as DensityKey[], DEFAULT_THEME.density),
    background: oneOf(t.background, Object.keys(BACKGROUNDS) as BackgroundKey[], DEFAULT_THEME.background),
    title: cleanString(t.title, 40) ?? DEFAULT_THEME.title,
    subtitle: typeof t.subtitle === "string" ? t.subtitle.slice(0, 80) : DEFAULT_THEME.subtitle,
    greeting: typeof t.greeting === "boolean" ? t.greeting : DEFAULT_THEME.greeting,
    hideAmounts: typeof t.hideAmounts === "boolean" ? t.hideAmounts : DEFAULT_THEME.hideAmounts,
    showHeaderActions:
      typeof t.showHeaderActions === "boolean" ? t.showHeaderActions : DEFAULT_THEME.showHeaderActions,
  };

  return { version: 2, widgets, theme };
}
