import Link from "next/link";

interface MemberNameLinkProps {
  lcrMemberId: string | null;
  fullName: string;
  className?: string;
  source?: "postgres" | "sqlite";
}

export function MemberNameLink({ lcrMemberId, fullName, className, source = "postgres" }: MemberNameLinkProps) {
  if (!lcrMemberId) {
    return <span className={className}>{fullName}</span>;
  }

  const href = source === "sqlite"
    ? `/members/${encodeURIComponent(lcrMemberId)}?source=sqlite`
    : `/members/${encodeURIComponent(lcrMemberId)}`;

  return (
    <Link href={href} className={className ?? "hover:underline"}>
      {fullName}
    </Link>
  );
}
