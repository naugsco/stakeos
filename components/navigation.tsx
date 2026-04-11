"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reports", label: "Reports" },
  { href: "/members", label: "Members" },
  { href: "/callings", label: "Callings" },
  { href: "/committees", label: "Committees" },
  { href: "/visual-org", label: "Visual Org" },
  { href: "/youth", label: "Youth" },
  { href: "/stake-overview", label: "Stake Overview" },
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

  return (
    <nav className="sticky top-0 z-20 border-b border-amber-900/10 bg-[#fffaf0]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link className="text-xl font-semibold text-slate-900" href="/dashboard">
          StakeOS
        </Link>
        <div className="flex flex-wrap gap-2 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "rounded-full border px-3 py-1 text-slate-700 shadow-sm transition",
                isActiveLink(link.href)
                  ? "border-teal-200 bg-teal-50 text-teal-900"
                  : "border-transparent bg-white/70 hover:border-amber-300 hover:bg-white"
              ].join(" ")}
              aria-current={isActiveLink(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
