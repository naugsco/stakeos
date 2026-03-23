import { NextRequest, NextResponse } from "next/server";
import { getVisualOrgData } from "@/src/services/visualOrgService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const selectedUnit = request.nextUrl.searchParams.get("unit");
  const data = await getVisualOrgData(selectedUnit);
  return NextResponse.json(data);
}
