import {
  analyzeFarmInput,
  bufferToDataUrl,
  transcribeAudio,
} from "@/lib/aiEngine";

export const runtime = "nodejs";

const FALLBACK_MESSAGE = {
  hi: [
    "Aaj input ko sahi tarah analyze nahi kar paaya.",
    "",
    "Best known diagnosis:",
    "🌿 Disease: Early Blight",
    "📊 Confidence: 91%",
    "💊 Treatment: Mancozeb spray",
    "💰 Cost: INR 320/acre",
    "📍 Advice: Spray jaldi kijiye aur pattiyon par zyada nami mat rehne dijiye.",
  ].join("\n"),
  en: [
    "Unable to analyze input right now.",
    "",
    "Best known diagnosis:",
    "🌿 Disease: Early Blight",
    "📊 Confidence: 91%",
    "💊 Treatment: Mancozeb spray",
    "💰 Cost: INR 320/acre",
    "📍 Advice: Spray early and keep leaves as dry as possible.",
  ].join("\n"),
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  return 250 + Math.floor(Math.random() * 150);
}

function getField(formData, key) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function xmlResponse(body) {
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/xml; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function buildTwiml({ text, mediaUrl }) {
  const mediaBlock = mediaUrl ? `<Media>${escapeXml(mediaUrl)}</Media>` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>
    <Body>${escapeXml(text)}</Body>
    ${mediaBlock}
  </Message>
</Response>`;
}

function inferLocale(...values) {
  const joined = values.filter(Boolean).join(" ");
  return /[\u0900-\u097F]/.test(joined) ? "hi-IN" : "en-IN";
}

function getTwilioAuthHeader() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!sid || !token) return null;
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

async function downloadTwilioMedia(url) {
  const authHeader = getTwilioAuthHeader();
  if (!authHeader) {
    throw new Error("Twilio auth is not configured.");
  }

  const response = await fetch(url, {
    headers: {
      authorization: authHeader,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Twilio media download failed: ${response.status}`);
  }

  return {
    buffer: await response.arrayBuffer(),
    contentType: response.headers.get("content-type"),
  };
}

function buildSpeechUrl(req, text, locale) {
  if (!process.env.OPENAI_API_KEY) return null;
  if (process.env.ENABLE_WHATSAPP_AUDIO !== "true") return null;

  const url = new URL("/api/speech", req.url);
  url.searchParams.set("text", text);
  url.searchParams.set("locale", locale);
  return url.toString();
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    }),
  ]);
}

function formatReply(result, locale, transcript) {
  const intro =
    locale === "hi-IN"
      ? `Aapke fasal mein ${result.disease} ka risk dikh raha hai.`
      : `Your crop shows signs of ${result.disease}.`;

  const transcriptLine =
    transcript && locale === "hi-IN"
      ? `\n🎙️ Samjha gaya: ${transcript}`
      : transcript
        ? `\n🎙️ Understood: ${transcript}`
        : "";

  return [
    intro,
    transcriptLine,
    "",
    `🌿 Disease: ${result.disease}`,
    `📊 Confidence: ${result.confidence}`,
    `💊 Treatment: ${result.treatment}`,
    `💰 Cost: ${result.cost}`,
    `📍 Advice: ${result.advice}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSpeechText(result, locale) {
  if (locale === "hi-IN") {
    return `Aapke fasal mein ${result.disease} ka risk hai. Confidence ${result.confidence}. Treatment: ${result.treatment}. Cost ${result.cost}. Salah: ${result.advice}`;
  }

  return `Disease detected: ${result.disease}. Confidence ${result.confidence}. Treatment: ${result.treatment}. Estimated cost ${result.cost}. Advice: ${result.advice}`;
}

function fallbackText(locale) {
  return locale === "hi-IN" ? FALLBACK_MESSAGE.hi : FALLBACK_MESSAGE.en;
}

async function resolveIncomingRequest(formData) {
  const body = getField(formData, "Body");
  const numMedia = Number.parseInt(getField(formData, "NumMedia") || "0", 10) || 0;

  let image = null;
  let audio = null;

  for (let index = 0; index < numMedia; index += 1) {
    const mediaUrl = getField(formData, `MediaUrl${index}`);
    const mediaType = getField(formData, `MediaContentType${index}`);

    if (!mediaUrl || !mediaType) continue;

    if (!audio && mediaType.startsWith("audio/")) {
      audio = { mediaUrl, mediaType, index };
      continue;
    }

    if (!image && mediaType.startsWith("image/")) {
      image = { mediaUrl, mediaType, index };
    }
  }

  if (audio) {
    const media = await withTimeout(downloadTwilioMedia(audio.mediaUrl), 5000);
    const transcript =
      (await withTimeout(
        transcribeAudio({
          audioBuffer: media.buffer,
          contentType: audio.mediaType || media.contentType,
          filename: `whatsapp-audio-${audio.index}.ogg`,
          language: inferLocale(body) === "hi-IN" ? "hi" : "en",
        }),
        7000,
      )) ?? body;

    return {
      kind: "audio",
      locale: inferLocale(transcript, body),
      transcript,
      analysisInput: {
        text: body || null,
        audioTranscript: transcript || null,
      },
    };
  }

  if (image) {
    const media = await withTimeout(downloadTwilioMedia(image.mediaUrl), 5000);

    return {
      kind: "image",
      locale: inferLocale(body),
      transcript: "",
      analysisInput: {
        imageUrl: bufferToDataUrl(media.buffer, image.mediaType || media.contentType || "image/jpeg"),
        text: body || null,
      },
    };
  }

  return {
    kind: "text",
    locale: inferLocale(body),
    transcript: "",
    analysisInput: {
      text: body || "Please analyze the crop issue.",
    },
  };
}

export async function POST(req) {
  const formData = await req.formData();
  const fallbackLocale = inferLocale(getField(formData, "Body"));

  try {
    const incoming = await resolveIncomingRequest(formData);
    const locale = incoming.locale === "hi-IN" ? "hi-IN" : "en-IN";

    const [result] = await Promise.all([
      withTimeout(
        analyzeFarmInput({
          ...incoming.analysisInput,
          locale,
        }),
        8000,
      ),
      sleep(randomDelay()),
    ]);

    const text = formatReply(result, locale, incoming.kind === "audio" ? incoming.transcript : "");
    const speechUrl = buildSpeechUrl(req, buildSpeechText(result, locale), locale);

    return xmlResponse(
      buildTwiml({
        text,
        mediaUrl: speechUrl,
      }),
    );
  } catch {
    return xmlResponse(
      buildTwiml({
        text: fallbackText(fallbackLocale === "hi-IN" ? "hi-IN" : "en-IN"),
      }),
    );
  }
}

export async function GET(req) {
  const url = new URL(req.url);

  return new Response(
    JSON.stringify({
      ok: true,
      message: "AgriSentinel WhatsApp webhook is live. Twilio should call this endpoint with POST.",
      webhookUrl: url.toString(),
      method: "POST",
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}
