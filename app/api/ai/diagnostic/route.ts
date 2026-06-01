import { NextResponse } from "next/server";
import { callGemini, getGeminiKey } from "@/lib/gemini";
import type { DiagnosticQuestion } from "@/lib/domain";

export const maxDuration = 60;

interface DiagnosticRequest {
  content: string;
}

const SYSTEM_INSTRUCTION =
  "You are a quiz generator that writes diagnostic assessments. Return valid JSON only, with no markdown and no extra text.";

function sanitizeContent(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/https?:\/\/[^\s)]+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/data:[a-zA-Z/]+;base64,[A-Za-z0-9+/=]+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildPrompt(content: string): string {
  return `Create 8 multiple-choice diagnostic questions from the source text below. The goal is to measure which concepts the student understands and which they struggle with.

Return ONLY a JSON array. Each item must have this exact shape:
{"question":"string","options":["opt1","opt2","opt3","opt4"],"correctIndex":0,"explanation":"string","topic":"string"}

Rules:
- options must have exactly 4 short answer choices
- correctIndex must be 0, 1, 2, or 3
- topic is a short (1-4 word) label naming the concept the question tests
- group the 8 questions into roughly 3-5 distinct topics so weak areas can be identified
- questions should test key facts from the source text
- avoid trick questions
- keep explanations to one sentence

Source text:
${sanitizeContent(content).slice(0, 12000)}`;
}

function clampQuestion(item: unknown): DiagnosticQuestion | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;

  const question = typeof record.question === "string" ? record.question.trim() : "";
  const options = Array.isArray(record.options)
    ? record.options
        .filter((opt): opt is string => typeof opt === "string")
        .map((opt) => opt.trim())
    : [];
  const correctIndex =
    typeof record.correctIndex === "number" ? record.correctIndex : Number.NaN;
  const explanation =
    typeof record.explanation === "string" ? record.explanation.trim() : undefined;
  const topic =
    typeof record.topic === "string" && record.topic.trim()
      ? record.topic.trim()
      : "General";

  if (!question || options.length < 2 || !Number.isFinite(correctIndex)) {
    return null;
  }

  const boundedCorrect = Math.max(0, Math.min(options.length - 1, correctIndex));
  return { question, options, correctIndex: boundedCorrect, explanation, topic };
}

function parseQuestions(raw: string): DiagnosticQuestion[] {
  const withoutFence = raw.trim().startsWith("```")
    ? raw.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "")
    : raw;
  const candidate = withoutFence.match(/\[[\s\S]*\]/)?.[0] ?? withoutFence;

  try {
    const parsed = JSON.parse(candidate);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(clampQuestion)
      .filter((q): q is DiagnosticQuestion => q !== null);
  } catch {
    return [];
  }
}

function generateFallback(content: string): DiagnosticQuestion[] {
  const sentences = sanitizeContent(content)
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24)
    .slice(0, 12);

  const questions = sentences.slice(0, 8).map((sentence, index) => {
    const lead = sentence.split(/\s+/).slice(0, 6).join(" ");
    const distractors = sentences
      .filter((_, otherIndex) => otherIndex !== index)
      .slice(0, 3);
    const options = [sentence, ...distractors];
    while (options.length < 4) {
      options.push("This detail is not stated in the source text.");
    }

    for (let position = options.length - 1; position > 0; position--) {
      const swapIndex = Math.floor(Math.random() * (position + 1));
      [options[position], options[swapIndex]] = [options[swapIndex], options[position]];
    }

    return {
      question: `Which statement best matches: "${lead}"?`,
      options,
      correctIndex: options.findIndex((option) => option === sentence),
      explanation: "The correct choice is directly supported by the original notes.",
      topic: `Topic ${Math.floor(index / 2) + 1}`,
    };
  });

  return questions;
}

export async function POST(request: Request) {
  let body: DiagnosticRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content } = body;
  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "content (string) required" },
      { status: 400 }
    );
  }

  if (getGeminiKey()) {
    try {
      const raw = await callGemini(buildPrompt(content), 4096, SYSTEM_INSTRUCTION);
      const questions = parseQuestions(raw);
      if (questions.length > 0) {
        return NextResponse.json({ questions });
      }
    } catch (e) {
      return NextResponse.json(
        { error: "AI request failed", details: String(e) },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ questions: generateFallback(content) });
}
