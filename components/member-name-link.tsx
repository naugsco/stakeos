import Link from "next/link";

interface MemberNameLinkProps {
  lcrMemberId: string | null;
  fullName: string;
  className?: string;
}

export function MemberNameLink({ lcrMemberId, fullName, className }: MemberNameLinkProps) {
  if (!lcrMemberId) {
    return <span className={className}>{fullName}</span>;
  }

  return (
    <Link href={`/members/${encodeURIComponent(lcrMemberId)}`} className={className ?? "hover:underline"}>
      {fullName}
    </Link>
  );
}
