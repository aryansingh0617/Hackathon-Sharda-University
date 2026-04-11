import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/aiEngine";

export const runtime = "nodejs";

type SpeechBody = {
  text?: string;
  locale?: "hi-IN" | "en-IN";
};

function normalizeLocale(locale?: "hi-IN" | "en-IN" | null) {
  return locale === "hi-IN" ? "hi-IN" : "en-IN";
}

function audioResponse(audioBuffer: ArrayBuffer) {
  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "no-store",
    },
  });
}

async function handleSpeech(text?: string | null, locale?: "hi-IN" | "en-IN" | null) {
  const cleanText = text?.trim();
  if (!cleanText) {
    return NextResponse.json({ ok: false, error: "Text is required." }, { status: 400 });
  }

  const audioBuffer = await synthesizeSpeech({
    text: cleanText,
    locale: normalizeLocale(locale),
  });

  if (!audioBuffer) {
    return NextResponse.json({ ok: false, error: "Speech generation failed." }, { status: 502 });
  }

  return audioResponse(audioBuffer);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const locale = searchParams.get("locale") === "hi-IN" ? "hi-IN" : "en-IN";

  return handleSpeech(text, locale);
}

export async function POST(req: Request) {
  let body: SpeechBody | null = null;

  try {
    body = (await req.json()) as SpeechBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  return handleSpeech(body?.text, body?.locale);
}
