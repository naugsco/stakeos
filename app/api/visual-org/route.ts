import { NextRequest, NextResponse } from "next/server";
import { getVisualOrgData } from "@/src/services/visualOrgService";
import { loadSqliteSpikeVisualOrgData } from "@/src/sqlite-spike/queries";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const selectedUnit = request.nextUrl.searchParams.get("unit");
  const source = request.nextUrl.searchParams.get("source") === "postgres" ? "postgres" : "sqlite";
  const data = source === "sqlite" ? await loadSqliteSpikeVisualOrgData(selectedUnit) : await getVisualOrgData(selectedUnit);
  return NextResponse.json(data);
}
