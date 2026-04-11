import { NextResponse } from "next/server";
import { isStorageConfigured, listDiagnosisRecords } from "@/lib/diagnosis-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const records = await listDiagnosisRecords(6);

    return NextResponse.json({
      ok: true,
      records,
      storageEnabled: isStorageConfigured(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        records: [],
        storageEnabled: isStorageConfigured(),
      },
      { status: 500 },
    );
  }
}
