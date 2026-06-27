"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Primary destinations sit on the left; utility destinations are grouped to the
// right behind a divider so the bar reads as two clear clusters.
const primaryLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reports", label: "Reports" },
  { href: "/members", label: "Members" },
  { href: "/callings", label: "Callings" },
  { href: "/committees", label: "Committees" },
  { href: "/visual-org", label: "Visual Org" },
  { href: "/youth", label: "Youth" },
  { href: "/stake-overview", label: "Stake Overview" }
];

const utilityLinks = [
  { href: "/settings", label: "Settings" },
  { href: "/sync-center", label: "Sync Center" }
];

export function Navigation() {
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (pathname === href) {
      return true;
    }
    return href !== "/dashboard" && pathname.startsWith(`${href}/`);
  };

  const renderLink = (link: { href: string; label: string }) => {
    const active = isActiveLink(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        className={[
          "rounded-full border px-3 py-1 shadow-sm transition",
          active
            ? "border-teal-700 bg-teal-700 font-semibold text-white"
            : "border-line bg-white/70 text-slate-700 hover:border-amber-300 hover:bg-white"
        ].join(" ")}
        aria-current={active ? "page" : undefined}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-panel-warm/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
        <Link className="text-xl font-semibold text-slate-900" href="/dashboard">
          StakeOS
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {primaryLinks.map(renderLink)}
          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-amber-900/15 sm:inline-block" />
          {utilityLinks.map(renderLink)}
        </div>
      </div>
    </nav>
  );
}
