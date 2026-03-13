import { NextResponse } from "next/server";
import { callGemini, getGeminiKey } from "@/lib/gemini";

export const maxDuration = 30;

interface RequestBody {
  question: string;
  answer: string;
  context: string;
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
          feedback: parsed.feedback || "",
        });
      } catch {
        return NextResponse.json({
          correct: false,
          feedback: raw || "Could not evaluate answer.",
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
