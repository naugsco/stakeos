import { NextResponse } from "next/server";
import { TransitApiKeyMissingError } from "@/src/transit/gtfsRealtime";
import { getDepartureBoard } from "@/src/transit/nextBus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const board = await getDepartureBoard();
    return NextResponse.json(board, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const missingKey = error instanceof TransitApiKeyMissingError;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load TransLink data.",
        needsApiKey: missingKey
      },
      { status: missingKey ? 428 : 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
