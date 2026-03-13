import { NextResponse } from "next/server";
import { callGemini, getGeminiKey } from "@/lib/gemini";
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

  if (getGeminiKey()) {
    try {
      const prompt = `Summarize the following in ${lengthPreference} form (${lengthPreference === "short" ? "2-3 sentences" : lengthPreference === "medium" ? "one short paragraph" : "several paragraphs"}). Return only the summary, no preamble.\n\n${content.slice(0, 12000)}`;
      const summary = await callGemini(prompt, 500);
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
