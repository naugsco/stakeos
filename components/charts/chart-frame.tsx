"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared chrome + accessibility wrapper for every chart.
 *
 * - Exposes the chart as a labeled `role="img"` region so screen readers get a
 *   meaningful summary instead of an opaque SVG.
 * - Renders an optional visually-hidden data table (`srTable`) so the
 *   underlying numbers are reachable by assistive tech and keyboard users.
 * - Renders a friendly empty state instead of a blank axis frame.
 */
export function ChartFrame({
  title,
  href,
  linkLabel,
  isEmpty = false,
  emptyMessage = "No data yet — run a sync to populate this chart.",
  heightClass = "h-80",
  bare = false,
  srTable,
  children
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  heightClass?: string;
  bare?: boolean;
  srTable?: ReactNode;
  children: ReactNode;
}) {
  const frameClass = bare
    ? `relative w-full ${heightClass}`
    : `relative w-full ${heightClass} rounded-panel border border-line bg-panel p-4 shadow-sm`;

  return (
    <figure role="img" aria-label={title} className={frameClass}>
      {href ? (
        <Link
          href={href}
          className="absolute right-3 top-3 z-10 rounded-md border border-amber-300 bg-white/95 px-2 py-1 text-xs font-medium text-amber-900 shadow-sm transition hover:bg-white"
        >
          {linkLabel}
        </Link>
      ) : null}
      {isEmpty ? (
        <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-slate-600">
          {emptyMessage}
        </div>
      ) : (
        <>
          {children}
          {srTable ? <div className="sr-only">{srTable}</div> : null}
        </>
      )}
    </figure>
  );
}

/**
 * Visually-hidden data table for screen-reader access to chart data.
 * Place inside `ChartFrame`'s `srTable` prop.
 */
export function SrDataTable({
  caption,
  columns,
  rows
}: {
  caption: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
