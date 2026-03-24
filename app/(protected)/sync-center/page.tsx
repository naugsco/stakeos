import { SyncCenter } from "@/components/sync-center";

export const dynamic = "force-dynamic";

export default function SyncCenterPage({
  searchParams
}: {
  searchParams?: { source?: string };
}) {
  const source = searchParams?.source === "postgres" ? "postgres" : "sqlite";
  return <SyncCenter source={source} />;
}
