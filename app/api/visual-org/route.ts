import { NextRequest, NextResponse } from "next/server";
import { loadSqliteSpikeVisualOrgData } from "@/src/sqlite-spike/queries";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const selectedUnit = request.nextUrl.searchParams.get("unit");
  const data = await loadSqliteSpikeVisualOrgData(selectedUnit);
  return NextResponse.json(data);
}
