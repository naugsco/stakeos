import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reports", label: "Reports" },
  { href: "/members", label: "Members" },
  { href: "/callings", label: "Callings" },
  { href: "/committees", label: "Committees" },
  { href: "/visual-org", label: "Visual Org" },
  { href: "/youth", label: "Youth" },
  { href: "/stake-overview", label: "Stake Overview" },
  { href: "/settings", label: "Settings" }
];

export function Navigation() {
  return (
    <nav className="sticky top-0 z-20 border-b border-amber-900/10 bg-[#fffaf0]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link className="text-xl font-semibold text-slate-900" href="/dashboard">
          StakeOS Leadership
        </Link>
        <div className="flex flex-wrap gap-2 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-transparent bg-white/70 px-3 py-1 text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
