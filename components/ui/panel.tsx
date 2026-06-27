import type { ReactNode } from "react";

/**
 * Standard warm content panel (rounded, hairline border, soft shadow).
 * Replaces the copy-pasted `rounded-panel border border-line bg-panel-warm…`
 * chrome that was duplicated across the dashboard and several browsers.
 */
export function Panel({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-panel border border-line bg-panel-warm shadow-sm ${className}`}>
      {children}
    </div>
  );
}
