import { NextResponse } from "next/server";
import { loadReportsPageDataBySource } from "@/lib/dashboardData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await loadReportsPageDataBySource();
  return NextResponse.json(data);
}
