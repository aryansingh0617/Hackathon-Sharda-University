import { NextResponse } from "next/server";
import {
  getFarmIntelStorageHealth,
  isFarmIntelStorageConfigured,
  listFarmIntelEvents,
  listLedgerRecords,
  persistFarmIntelEvent,
} from "@/lib/farm-intel-store";

export const runtime = "nodejs";

type EventType = "diagnosis" | "yield" | "irrigation" | "agri_score";

type Body = {
  eventType?: EventType;
  entityKey?: string;
  payload?: unknown;
  anchorToLedger?: boolean;
};

function isEventType(value: unknown): value is EventType {
  return value === "diagnosis" || value === "yield" || value === "irrigation" || value === "agri_score";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const requestedType = url.searchParams.get("eventType");
  const limit = Number(url.searchParams.get("limit") ?? "12");
  const eventType = isEventType(requestedType) ? requestedType : undefined;

  try {
    const [events, ledger] = await Promise.all([listFarmIntelEvents(limit, eventType), listLedgerRecords(10)]);

    const counts = events.reduce<Record<string, number>>((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      storageEnabled: isFarmIntelStorageConfigured(),
      storageHealth: getFarmIntelStorageHealth(),
      eventType: eventType ?? "all",
      totalEvents: events.length,
      counts,
      events,
      ledger,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        storageEnabled: isFarmIntelStorageConfigured(),
        storageHealth: getFarmIntelStorageHealth(),
        eventType: eventType ?? "all",
        totalEvents: 0,
        counts: {},
        events: [],
        ledger: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let body: Body = {};

  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (!isEventType(body.eventType) || !body.entityKey || typeof body.entityKey !== "string") {
    return NextResponse.json({ ok: false, error: "eventType and entityKey are required." }, { status: 400 });
  }

  const result = await persistFarmIntelEvent({
    eventType: body.eventType,
    entityKey: body.entityKey,
    payload: body.payload ?? {},
    anchorToLedger: Boolean(body.anchorToLedger),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to persist FarmIntel event.",
        result,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    result,
  });
}
