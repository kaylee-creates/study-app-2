const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  error?: { message?: string };
}

export function getGeminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

export async function callGemini(
  prompt: string,
  maxTokens: number,
  systemInstruction?: string
): Promise<string> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const payload: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  };
  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const data = (await res.json()) as GeminiResponse;

  if (data.error) {
    throw new Error(`Gemini error: ${data.error.message}`);
  }

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Gemini returned empty response");

  text = text.replace(/^```(?:markdown|json|text)?\s*\n?/i, "").replace(/\n?```\s*$/, "");

  return text.trim();
}
