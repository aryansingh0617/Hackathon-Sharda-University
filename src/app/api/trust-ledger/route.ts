import { NextResponse } from "next/server";
import {
  isAgriScoreAnchorStorageConfigured,
  listAgriScoreAnchors,
} from "@/lib/agri-score-anchor-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const anchors = await listAgriScoreAnchors(10);

    return NextResponse.json({
      ok: true,
      anchors,
      storageEnabled: isAgriScoreAnchorStorageConfigured(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        anchors: [],
        storageEnabled: isAgriScoreAnchorStorageConfigured(),
      },
      { status: 500 },
    );
  }
}
