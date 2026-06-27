import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Pill-shaped navigation/segment control used across the dashboard and nav.
 * Renders as a link when `href` is provided, otherwise as a button.
 */
const base =
  "rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm transition";
const activeClasses = "border-teal-300 bg-teal-50 text-teal-900";
const inactiveClasses = "border-line bg-white text-slate-700 hover:bg-slate-50";

export function Pill({
  href,
  active = false,
  children,
  ariaCurrent
}: {
  href?: string;
  active?: boolean;
  children: ReactNode;
  ariaCurrent?: "page" | undefined;
}) {
  const className = `${base} ${active ? activeClasses : inactiveClasses}`;

  if (href) {
    return (
      <Link href={href} className={className} aria-current={ariaCurrent}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      {children}
    </button>
  );
}
