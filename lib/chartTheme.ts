/**
 * Single source of truth for chart colors and shared Recharts styling.
 * Recharts renders to SVG (often server-side), so it needs literal color
 * values rather than CSS variables — keeping them here prevents the hex
 * sprawl that was previously copy-pasted across every chart component.
 */
export const CHART_COLORS = {
  teal: "#0f766e",
  blue: "#1d4ed8",
  sky: "#0369a1",
  amber: "#b45309",
  rose: "#be123c",
  pink: "#d94674",
  indigo: "#4f46e5",
  green: "#15803d",
  neutral: "#cbd5e1"
} as const;

export const AXIS_TICK = { fill: "#475569", fontSize: 12 } as const;
export const GRID_STROKE = "#cbd5e1";

export const TOOLTIP_CONTENT_STYLE = {
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#fffef8",
  boxShadow: "0 4px 18px rgba(15,23,42,0.08)"
} as const;

/** Scatter palette derived deterministically from a label. */
export const SCATTER_PALETTE = [
  "#0f766e",
  "#0369a1",
  "#b45309",
  "#be123c",
  "#4f46e5",
  "#15803d",
  "#7c2d12",
  "#1d4ed8",
  "#a21caf",
  "#0f766e",
  "#4338ca",
  "#c2410c"
] as const;
