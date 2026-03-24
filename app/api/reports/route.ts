import { NextRequest, NextResponse } from "next/server";
import { loadReportsPageDataBySource } from "@/lib/dashboardData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source") === "sqlite" ? "sqlite" : "postgres";
  const data = await loadReportsPageDataBySource(source);
  return NextResponse.json(data);
}
