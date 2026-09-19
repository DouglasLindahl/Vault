export const TAG_COLORS = [
  "#315cff",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#06b6d4",
  "#eab308",
  "#ef4444",
];

export function nextTagColor(existingCount: number): string {
  return TAG_COLORS[existingCount % TAG_COLORS.length];
}
