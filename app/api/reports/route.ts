import { NextResponse } from "next/server";
import { loadReportsPageData } from "@/lib/dashboardData";

export const runtime = "nodejs";

export async function GET() {
  const data = await loadReportsPageData();
  return NextResponse.json(data);
}
