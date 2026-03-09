import { NextResponse } from "next/server";

export const maxDuration = 60;

interface StudyGuideRequest {
  content: string;
  format: "tree" | "cornell" | "mapping";
}

export async function POST(request: Request) {
  let body: StudyGuideRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, format } = body;
  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "content (string) required" },
      { status: 400 }
    );
  }
  if (!["tree", "cornell", "mapping"].includes(format)) {
    return NextResponse.json(
      { error: "format must be tree, cornell, or mapping" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const prompt = buildPrompt(content, format);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json(
          { error: "AI provider error", details: err },
          { status: 502 }
        );
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const result =
        data.choices?.[0]?.message?.content?.trim() ?? "No result generated.";
      return NextResponse.json({ result });
    } catch (e) {
      return NextResponse.json(
        { error: "AI request failed", details: String(e) },
        { status: 502 }
      );
    }
  }

  // Fallback: generate a mock structured guide
  const result = generateFallback(content, format);
  return NextResponse.json({ result });
}

function buildPrompt(content: string, format: string): string {
  const truncated = content.slice(0, 12000);
  switch (format) {
    case "tree":
      return `Convert the following text into a structured tree model study guide. Use hierarchical headings (# for main topics, ## for subtopics, ### for details). Group related concepts together. Return only the formatted content in Markdown.\n\n${truncated}`;
    case "cornell":
      return `Convert the following text into Cornell method notes. Format as Markdown with three sections:\n## Cues\n(Key questions and terms in bullet points)\n\n## Notes\n(Detailed notes organized by topic)\n\n## Summary\n(2-3 sentence summary)\n\nReturn only the formatted content.\n\n${truncated}`;
    case "mapping":
      return `Convert the following text into a concept mapping study guide. Identify the central concept, then list related concepts as branches. Format as Markdown with:\n## Central Concept\n(The main idea)\n\n## Branches\n(Each branch as a heading with sub-points)\n\nReturn only the formatted content.\n\n${truncated}`;
    default:
      return `Summarize and structure the following text:\n\n${truncated}`;
  }
}

function generateFallback(content: string, format: string): string {
  const paragraphs = content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const sentences = content
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  switch (format) {
    case "tree": {
      let result = "# Study Guide\n\n";
      paragraphs.slice(0, 8).forEach((p, i) => {
        result += `## Topic ${i + 1}\n\n`;
        const sents = p
          .split(/[.!?]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        sents.forEach((s) => {
          result += `- ${s}\n`;
        });
        result += "\n";
      });
      return result;
    }
    case "cornell": {
      let cues = "## Cues\n\n";
      let notes = "## Notes\n\n";
      sentences.slice(0, 5).forEach((s) => {
        cues += `- What about: ${s.slice(0, 50)}...?\n`;
      });
      paragraphs.slice(0, 5).forEach((p) => {
        notes += `${p}\n\n`;
      });
      const summary = `## Summary\n\n${sentences.slice(0, 2).join(". ")}.`;
      return `${cues}\n${notes}\n${summary}`;
    }
    case "mapping": {
      let result = `## Central Concept\n\n${sentences[0] || "Main Topic"}\n\n## Branches\n\n`;
      paragraphs.slice(0, 6).forEach((p, i) => {
        const firstSentence = p.split(/[.!?]/)[0]?.trim() || `Branch ${i + 1}`;
        result += `### ${firstSentence}\n\n`;
        const rest = p
          .split(/[.!?]+/)
          .slice(1)
          .map((s) => s.trim())
          .filter(Boolean);
        rest.forEach((s) => {
          result += `- ${s}\n`;
        });
        result += "\n";
      });
      return result;
    }
    default:
      return content.slice(0, 1000);
  }
}
