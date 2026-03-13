import { NextResponse } from "next/server";
import { callGemini, getGeminiKey } from "@/lib/gemini";
import type { AiFlashcardSuggestion } from "@/lib/domain";

interface RequestBody {
  content: string;
  count?: number;
}

export const maxDuration = 30;

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { content, count = 5 } = body;
  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "content (string) required" },
      { status: 400 }
    );
  }

  if (getGeminiKey()) {
    try {
      const prompt = `From the following text, generate exactly ${Math.min(10, count)} flashcards. For each card provide a short question and a short answer. Format as JSON array: [{"question":"...","answer":"..."}, ...]. Return only the JSON array, no other text.\n\n${content.slice(0, 8000)}`;
      const raw = await callGemini(prompt, 1000);
      const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
      let cards: AiFlashcardSuggestion[];
      try {
        cards = JSON.parse(cleaned) as AiFlashcardSuggestion[];
        if (!Array.isArray(cards))
          cards = [];
        else
          cards = cards
            .filter(
              (c): c is AiFlashcardSuggestion =>
                typeof c?.question === "string" && typeof c?.answer === "string"
            )
            .slice(0, count);
      } catch {
        cards = [];
      }
      return NextResponse.json({ cards });
    } catch (e) {
      return NextResponse.json(
        { error: "AI request failed", details: String(e) },
        { status: 502 }
      );
    }
  }

  // Fallback: mock 1–2 cards from first sentences
  const sentences = content
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const cards: AiFlashcardSuggestion[] = sentences.map((s, i) => ({
    question: `Summary question ${i + 1}?`,
    answer: s.slice(0, 120) + (s.length > 120 ? "…" : ""),
  }));
  return NextResponse.json({ cards });
}
