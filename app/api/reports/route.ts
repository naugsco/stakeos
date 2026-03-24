import { NextResponse } from "next/server";
import { loadReportsPageData } from "@/lib/dashboardData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await loadReportsPageData();
  return NextResponse.json(data);
}
