import { NextResponse } from "next/server";
import { callGemini, getGeminiKey } from "@/lib/gemini";
import type { AiFlashcardSuggestion } from "@/lib/domain";

interface RequestBody {
  content: string;
  count?: number;
  focusTopics?: string[];
}

export const maxDuration = 60;

const MAX_FLASHCARDS = 10;
const DEFAULT_FLASHCARDS = 6;
const SOURCE_TEXT_LIMIT = 6000;

function sanitizeContent(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/https?:\/\/[^\s)]+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/data:[a-zA-Z/]+;base64,[A-Za-z0-9+/=]+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildPrompt(
  content: string,
  requestedCount: number,
  focusTopics: string[]
): string {
  const focusInstruction =
    focusTopics.length > 0
      ? `Prioritize these weaker topics: ${focusTopics.join(", ")}.`
      : "Cover the most important concepts evenly.";

  return `Generate exactly ${requestedCount} flashcards from the source text.

Return ONLY valid JSON array:
[{"question":"...","answer":"..."}]

Rules:
- Each question and answer must be concise and factual.
- No markdown, no commentary, no code fences.
- Keep each answer to 1-2 short sentences.
- Avoid duplicate cards.
- ${focusInstruction}

Source text:
${content}`;
}

function normalizeCard(item: unknown): AiFlashcardSuggestion | null {
  if (!item || typeof item !== "object") return null;
  const card = item as Record<string, unknown>;
  const question =
    typeof card.question === "string" ? card.question.trim() : "";
  const answer = typeof card.answer === "string" ? card.answer.trim() : "";
  if (!question || !answer) return null;
  return { question, answer };
}

function parseCards(rawResponse: string, targetCount: number): AiFlashcardSuggestion[] {
  const cleaned = rawResponse
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const candidate =
    cleaned.match(/\[[\s\S]*\]/)?.[0] ??
    cleaned.match(/\{[\s\S]*\}/)?.[0] ??
    cleaned;

  try {
    const parsed = JSON.parse(candidate);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeCard)
      .filter((card): card is AiFlashcardSuggestion => card !== null)
      .slice(0, targetCount);
  } catch {
    return [];
  }
}

async function generateCardsWithRetries(
  sourceContent: string,
  requestedCount: number,
  focusTopics: string[]
): Promise<AiFlashcardSuggestion[]> {
  const attemptCounts = Array.from(
    new Set([requestedCount, Math.max(4, requestedCount - 2), 4])
  );

  for (const attemptCount of attemptCounts) {
    const prompt = buildPrompt(sourceContent, attemptCount, focusTopics);
    const raw = await callGemini(prompt, 900);
    const cards = parseCards(raw, attemptCount);
    if (cards.length > 0) {
      return cards.slice(0, requestedCount);
    }
  }

  return [];
}

function generateFallbackCards(
  content: string,
  count: number
): AiFlashcardSuggestion[] {
  const normalizedSentences = sanitizeContent(content)
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);

  const limitedSentences = normalizedSentences.slice(0, Math.max(6, count + 2));
  if (limitedSentences.length === 0) {
    return [
      {
        question: "What is the main idea of these notes?",
        answer:
          "These notes summarize important concepts from the uploaded study material.",
      },
    ];
  }

  const cards: AiFlashcardSuggestion[] = [];
  for (let index = 0; index < Math.min(count, limitedSentences.length); index += 1) {
    const sentence = limitedSentences[index];
    const subject = sentence
      .split(/\s+/)
      .slice(0, 8)
      .join(" ")
      .replace(/[,:;]+$/, "");

    cards.push({
      question: `Explain: "${subject}"`,
      answer: sentence.slice(0, 180) + (sentence.length > 180 ? "..." : ""),
    });
  }

  return cards;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, count = DEFAULT_FLASHCARDS, focusTopics = [] } = body;
  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "content (string) required" },
      { status: 400 }
    );
  }

  const safeFocusTopics = Array.isArray(focusTopics)
    ? focusTopics.filter((topic): topic is string => typeof topic === "string")
    : [];
  const safeCount = Math.max(1, Math.min(MAX_FLASHCARDS, count));
  const safeContent = sanitizeContent(content).slice(0, SOURCE_TEXT_LIMIT);

  if (getGeminiKey()) {
    try {
      const cards = await generateCardsWithRetries(
        safeContent,
        safeCount,
        safeFocusTopics
      );
      if (cards.length > 0) {
        return NextResponse.json({ cards });
      }
    } catch (e) {
      return NextResponse.json(
        { error: "AI request failed", details: String(e) },
        { status: 502 }
      );
    }
  }

  const cards = generateFallbackCards(safeContent, safeCount);
  return NextResponse.json({ cards });
}
