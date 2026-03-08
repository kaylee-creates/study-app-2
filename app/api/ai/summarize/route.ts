import { NextResponse } from "next/server";
import type { AiSummaryInput, AiSummaryResult } from "@/lib/domain";

export const maxDuration = 30;

export async function POST(request: Request) {
  let body: AiSummaryInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }
  const { content, lengthPreference } = body;
  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "content (string) required" },
      { status: 400 }
    );
  }

  // TODO: Call OpenAI/Vercel AI SDK when OPENAI_API_KEY or similar is set
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `Summarize the following in ${lengthPreference} form (${lengthPreference === "short" ? "2-3 sentences" : lengthPreference === "medium" ? "one short paragraph" : "several paragraphs"}). Return only the summary, no preamble.\n\n${content.slice(0, 12000)}`,
            },
          ],
          max_tokens: 500,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json(
          { error: "AI provider error", details: err },
          { status: 502 }
        );
      }
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const summary =
        data.choices?.[0]?.message?.content?.trim() ?? "No summary generated.";
      return NextResponse.json({ summary } satisfies AiSummaryResult);
    } catch (e) {
      return NextResponse.json(
        { error: "AI request failed", details: String(e) },
        { status: 502 }
      );
    }
  }

  // Fallback: short mock summary for demo without API key
  const lines = content.split(/\n/).filter(Boolean).slice(0, 3);
  const summary =
    lengthPreference === "short"
      ? lines.join(" ").slice(0, 200) + (lines.join(" ").length > 200 ? "…" : "")
      : lengthPreference === "medium"
        ? lines.join(" ").slice(0, 400) + (lines.join(" ").length > 400 ? "…" : "")
        : content.slice(0, 800) + (content.length > 800 ? "…" : "");
  return NextResponse.json({ summary } satisfies AiSummaryResult);
}
