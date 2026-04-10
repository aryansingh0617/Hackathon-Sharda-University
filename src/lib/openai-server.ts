import "server-only";

type OpenAIResponse = {
  output?: Array<{
    type: string;
    content?: Array<{ type: string; text?: string }>;
  }>;
};

export async function openaiJSON<T>(params: {
  model: string;
  developer: string;
  user: string;
  maxOutputTokens?: number;
}): Promise<T | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: params.model,
      max_output_tokens: params.maxOutputTokens ?? 300,
      input: [
        {
          role: "developer",
          content: [{ type: "input_text", text: params.developer }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: params.user }],
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as OpenAIResponse;

  const texts: string[] = [];
  for (const item of data.output ?? []) {
    if (item.type !== "message") continue;
    for (const c of item.content ?? []) {
      if (c.type === "output_text" && c.text) texts.push(c.text);
    }
  }
  const joined = texts.join("\n").trim();
  if (!joined) return null;

  try {
    return JSON.parse(joined) as T;
  } catch {
    return null;
  }
}

