import { NextResponse } from "next/server";
import { callGemini, getGeminiKey } from "@/lib/gemini";

export const maxDuration = 30;

interface RequestBody {
  question: string;
  answer: string;
  context: string;
}

const DEFAULT_INCORRECT_FEEDBACK =
  "That answer does not match the notes. Review the key concept and try again.";

function normalizeFeedback(raw: string): string {
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  if (!cleaned) return DEFAULT_INCORRECT_FEEDBACK;

  try {
    const parsed = JSON.parse(cleaned) as { feedback?: string };
    if (typeof parsed.feedback === "string" && parsed.feedback.trim()) {
      return parsed.feedback.trim();
    }
  } catch {
    // Fall through to best-effort text extraction.
  }

  const feedbackMatch = cleaned.match(/"feedback"\s*:\s*"([^"]+)"/i);
  if (feedbackMatch?.[1]) {
    return feedbackMatch[1].trim();
  }

  if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
    return DEFAULT_INCORRECT_FEEDBACK;
  }

  return cleaned.slice(0, 220);
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { question, answer, context } = body;
  if (!question || !answer || !context) {
    return NextResponse.json(
      { error: "question, answer, and context are all required" },
      { status: 400 }
    );
  }

  if (getGeminiKey()) {
    try {
      const prompt = `You are a study assistant. Given the following source material, evaluate whether the student's answer to the question is correct.\n\nSource material:\n${context.slice(0, 6000)}\n\nQuestion: ${question}\nStudent's answer: ${answer}\n\nRespond with ONLY a JSON object (no markdown, no code fences): {"correct": true or false, "feedback": "brief 1-2 sentence explanation of why the answer is correct or what the correct answer should be"}`;
      const raw = await callGemini(prompt, 200);
      const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
      try {
        const parsed = JSON.parse(cleaned) as {
          correct: boolean;
          feedback: string;
        };
        return NextResponse.json({
          correct: !!parsed.correct,
          feedback:
            (typeof parsed.feedback === "string" && parsed.feedback.trim()) ||
            (parsed.correct ? "Nice work. Your answer matches the notes." : DEFAULT_INCORRECT_FEEDBACK),
        });
      } catch {
        return NextResponse.json({
          correct: false,
          feedback: normalizeFeedback(raw),
        });
      }
    } catch (e) {
      return NextResponse.json(
        { error: "AI request failed", details: String(e) },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({
    correct: true,
    feedback: "Answer recorded. (No AI key configured for verification.)",
  });
}
