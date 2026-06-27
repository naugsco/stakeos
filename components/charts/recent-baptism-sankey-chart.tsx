"use client";

import { ResponsiveContainer, Sankey, Tooltip } from "recharts";
import { ChartFrame, SrDataTable } from "@/components/charts/chart-frame";

interface RecentBaptismPathRow {
  templeRecommendStatus: string | null;
  hasCurrentCalling: boolean;
  ministeringAssigned: boolean;
  assignedAsMinisterLabel: string;
}

interface RecentBaptismSankeyChartProps {
  rows: RecentBaptismPathRow[];
  href?: string;
  linkLabel?: string;
}

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

const recommendBucket = (status: string | null) =>
  status && /^active/i.test(status) ? "Recommend: Active" : "Recommend: Not Active";

const callingBucket = (hasCurrentCalling: boolean) => (hasCurrentCalling ? "Calling: Current" : "Calling: None");
const ministeringBucket = (ministeringAssigned: boolean) =>
  ministeringAssigned ? "Ministers: Assigned" : "Ministers: Not Assigned";
const serviceBucket = (assignedAsMinisterLabel: string) =>
  assignedAsMinisterLabel === "Assigned" ? "Service: Assigned as Minister" : "Service: Assignment Not Captured";

export function RecentBaptismSankeyChart({
  rows,
  href = "/reports#recent-baptism-path-list",
  linkLabel = "Open recent baptism cohort"
}: RecentBaptismSankeyChartProps) {
  const nodeOrder = [
    "Cohort: Baptized <2y",
    "Recommend: Active",
    "Recommend: Not Active",
    "Calling: Current",
    "Calling: None",
    "Ministers: Assigned",
    "Ministers: Not Assigned",
    "Service: Assigned as Minister",
    "Service: Assignment Not Captured"
  ];

  const nodeIndex = new Map(nodeOrder.map((name, index) => [name, index]));
  const linkCounts = new Map<string, number>();
  const addLink = (source: string, target: string) => {
    const key = `${source}=>${target}`;
    linkCounts.set(key, (linkCounts.get(key) ?? 0) + 1);
  };

  for (const row of rows) {
    const cohort = "Cohort: Baptized <2y";
    const recommend = recommendBucket(row.templeRecommendStatus);
    const calling = callingBucket(row.hasCurrentCalling);
    const ministering = ministeringBucket(row.ministeringAssigned);
    const service = serviceBucket(row.assignedAsMinisterLabel);

    addLink(cohort, recommend);
    addLink(recommend, calling);
    addLink(calling, ministering);
    addLink(ministering, service);
  }

  const links: SankeyLink[] = Array.from(linkCounts.entries()).map(([key, value]) => {
    const [source, target] = key.split("=>");
    return {
      source: nodeIndex.get(source) ?? 0,
      target: nodeIndex.get(target) ?? 0,
      value
    };
  });

  const nodes: SankeyNode[] = nodeOrder.map((name) => ({ name }));

  return (
    <ChartFrame
      title="Recent baptism progression flow"
      href={href}
      linkLabel={linkLabel}
      heightClass="h-[24rem]"
      isEmpty={links.length === 0}
      srTable={
        <SrDataTable
          caption="Recent baptism progression flow"
          columns={["From", "To", "Members"]}
          rows={links.map((link) => [nodeOrder[link.source], nodeOrder[link.target], link.value])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={{ nodes, links }}
          nodePadding={28}
          margin={{ top: 16, right: 24, bottom: 16, left: 24 }}
          node={{ stroke: "#475569", strokeOpacity: 0.15, fill: "#0f766e" }}
          link={{ stroke: "#94a3b8" }}
        >
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) {
                return null;
              }
              const entry = payload[0]?.payload;
              if (entry?.source?.name && entry?.target?.name) {
                return (
                  <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow-lg">
                    <div className="font-semibold text-slate-900">{entry.source.name}</div>
                    <div className="text-slate-600">to {entry.target.name}</div>
                    <div className="text-slate-600">Members: {entry.value}</div>
                  </div>
                );
              }
              if (entry?.name) {
                return (
                  <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow-lg">
                    <div className="font-semibold text-slate-900">{entry.name}</div>
                    <div className="text-slate-600">Value: {entry.value ?? 0}</div>
                  </div>
                );
              }
              return null;
            }}
          />
        </Sankey>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
