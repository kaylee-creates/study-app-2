import { NextResponse } from "next/server";
import { callGemini, getGeminiKey } from "@/lib/gemini";
import type { MemoryTechnique, MemoryTip } from "@/lib/domain";

export const maxDuration = 60;

interface MemoryTipsRequest {
  content: string;
  focusTopics?: string[];
}

const VALID_TECHNIQUES: MemoryTechnique[] = [
  "acronym",
  "rhyme",
  "mnemonic",
  "chunking",
];

const SYSTEM_INSTRUCTION =
  "You are a memory coach. You create memorization aids grounded in the student's actual study material. Return valid JSON only, with no markdown and no extra text.";

function sanitizeContent(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/https?:\/\/[^\s)]+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildPrompt(content: string, focusTopics: string[]): string {
  const focusLine =
    focusTopics.length > 0
      ? `Focus on these topics the student struggled with: ${focusTopics.join(", ")}.`
      : "Cover the most important concepts evenly across the material.";

  return `Create memorization aids that help a student remember the key concepts from the source text below.

${focusLine}

Return ONLY a JSON array. Each item must have this exact shape:
{"topic":"string","technique":"acronym|rhyme|mnemonic|chunking","tip":"string"}

Rules:
- produce 4-6 tips
- technique must be exactly one of: acronym, rhyme, mnemonic, chunking
- the tip must be grounded in the real content, not generic study advice
- keep each tip to 1-2 sentences and make it genuinely memorable
- topic is a short label naming the concept the tip helps remember

Source text:
${sanitizeContent(content).slice(0, 10000)}`;
}

function clampTip(item: unknown): MemoryTip | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;

  const topic = typeof record.topic === "string" ? record.topic.trim() : "";
  const tip = typeof record.tip === "string" ? record.tip.trim() : "";
  const rawTechnique =
    typeof record.technique === "string" ? record.technique.trim().toLowerCase() : "";
  const technique = VALID_TECHNIQUES.includes(rawTechnique as MemoryTechnique)
    ? (rawTechnique as MemoryTechnique)
    : "mnemonic";

  if (!topic || !tip) return null;
  return { topic, technique, tip };
}

function parseTips(raw: string): MemoryTip[] {
  const withoutFence = raw.trim().startsWith("```")
    ? raw.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "")
    : raw;
  const candidate = withoutFence.match(/\[[\s\S]*\]/)?.[0] ?? withoutFence;

  try {
    const parsed = JSON.parse(candidate);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(clampTip).filter((tip): tip is MemoryTip => tip !== null);
  } catch {
    return [];
  }
}

function generateFallback(content: string, focusTopics: string[]): MemoryTip[] {
  const topics =
    focusTopics.length > 0
      ? focusTopics
      : sanitizeContent(content)
          .split(/[.!?]+/)
          .map((sentence) => sentence.trim().split(/\s+/).slice(0, 3).join(" "))
          .filter(Boolean)
          .slice(0, 4);

  return topics.slice(0, 5).map((topic) => ({
    topic,
    technique: "chunking" as MemoryTechnique,
    tip: `Break "${topic}" into smaller pieces and review one piece at a time, then connect them back together.`,
  }));
}

export async function POST(request: Request) {
  let body: MemoryTipsRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, focusTopics = [] } = body;
  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "content (string) required" },
      { status: 400 }
    );
  }

  const safeFocusTopics = Array.isArray(focusTopics)
    ? focusTopics.filter((topic): topic is string => typeof topic === "string")
    : [];

  if (getGeminiKey()) {
    try {
      const raw = await callGemini(
        buildPrompt(content, safeFocusTopics),
        2048,
        SYSTEM_INSTRUCTION
      );
      const tips = parseTips(raw);
      if (tips.length > 0) {
        return NextResponse.json({ tips });
      }
    } catch (e) {
      return NextResponse.json(
        { error: "AI request failed", details: String(e) },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ tips: generateFallback(content, safeFocusTopics) });
}
