"use client";

type Lang = "en-IN" | "hi-IN";

let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let chain: Promise<void> = Promise.resolve();
let lastToken = 0;

function scoreVoice(voice: SpeechSynthesisVoice, lang: Lang) {
  const wanted = lang.toLowerCase();
  const voiceLang = voice.lang?.toLowerCase() ?? "";
  const voiceName = voice.name?.toLowerCase() ?? "";
  let score = 0;

  if (voiceLang === wanted) score += 10;
  if (voiceLang.startsWith(wanted.split("-")[0] ?? "")) score += 6;

  if (lang === "hi-IN") {
    if (voiceName.includes("hindi")) score += 7;
    if (voiceLang.includes("hi")) score += 4;
  }

  if (lang === "en-IN") {
    if (voiceName.includes("india")) score += 3;
    if (voiceLang.includes("en-in")) score += 5;
  }

  if (voice.default) score += 1;

  return score;
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: Lang) {
  const ranked = [...voices].sort((a, b) => scoreVoice(b, lang) - scoreVoice(a, lang));
  const winner = ranked[0] ?? null;
  return winner && scoreVoice(winner, lang) > 0 ? winner : null;
}

function waitForVoices(timeoutMs = 1500) {
  if (typeof window === "undefined") return Promise.resolve<SpeechSynthesisVoice[]>([]);
  if (!("speechSynthesis" in window)) return Promise.resolve<SpeechSynthesisVoice[]>([]);

  const synth = window.speechSynthesis;
  const immediate = synth.getVoices();
  if (immediate.length) return Promise.resolve(immediate);

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      synth.removeEventListener("voiceschanged", onVoices);
      resolve(synth.getVoices());
    };
    const onVoices = () => finish();
    synth.addEventListener("voiceschanged", onVoices);
    setTimeout(finish, timeoutMs);
  });
}

async function playRemoteSpeech(text: string, lang: Lang) {
  const response = await fetch("/api/speech", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text,
      locale: lang,
    }),
  });

  if (!response.ok) {
    throw new Error("Remote speech unavailable");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio(objectUrl);
  activeAudio = audio;
  activeObjectUrl = objectUrl;

  await new Promise<void>((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Audio playback failed"));
    audio.play().catch(reject);
  });
}

function clearAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
}

function speakBrowser(text: string, lang: Lang, opts?: { rate?: number; pitch?: number }) {
  return new Promise<void>(async (resolve) => {
    if (typeof window === "undefined") return resolve();
    if (!("speechSynthesis" in window)) return resolve();
    const synth = window.speechSynthesis;
    const voices = await waitForVoices();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = opts?.rate ?? (lang === "hi-IN" ? 0.98 : 1.02);
    utterance.pitch = opts?.pitch ?? 1.0;
    const voice = pickVoice(voices, lang);
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.speak(utterance);
  });
}

async function speakOnce(text: string, lang: Lang, opts?: { rate?: number; pitch?: number }) {
  try {
    await playRemoteSpeech(text, lang);
    clearAudio();
  } catch {
    clearAudio();
    await speakBrowser(text, lang, opts);
  }
}

export function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  lastToken++;
  clearAudio();
  chain = Promise.resolve();
}

export function speakBilingualQueued(params: {
  en: string;
  hi: string;
  preferred: Lang;
}) {
  const token = ++lastToken;
  const first = params.preferred === "hi-IN" ? { t: params.hi, l: "hi-IN" as const } : { t: params.en, l: "en-IN" as const };
  const second = params.preferred === "hi-IN" ? { t: params.en, l: "en-IN" as const } : { t: params.hi, l: "hi-IN" as const };

  chain = chain.then(async () => {
    if (token !== lastToken) return;
    await speakOnce(first.t, first.l);
    if (token !== lastToken) return;
    await speakOnce(second.t, second.l);
  });
}
