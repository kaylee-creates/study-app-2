import { NextResponse } from "next/server";
import { callGemini, getGeminiKey } from "@/lib/gemini";

export const maxDuration = 60;

interface StudyGuideRequest {
  content: string;
  format: "tree" | "cornell" | "questions";
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
  if (!["tree", "cornell", "questions"].includes(format)) {
    return NextResponse.json(
      { error: "format must be tree, cornell, or questions" },
      { status: 400 }
    );
  }

  if (getGeminiKey()) {
    try {
      const { prompt, system } = buildPrompt(content, format);
      const result = await callGemini(prompt, 8192, system);
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

function sanitizeContent(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/https?:\/\/[^\s)]+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/data:[a-zA-Z/]+;base64,[A-Za-z0-9+/=]+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildPrompt(content: string, format: string): { prompt: string; system?: string } {
  const truncated = sanitizeContent(content).slice(0, 12000);
  switch (format) {
    case "tree":
      return {
        prompt: `Convert the following text into a structured tree model study guide. Use hierarchical headings (# for main topics, ## for subtopics, ### for details). Group related concepts together. Return only the formatted content in Markdown.\n\n${truncated}`,
      };
    case "cornell":
      return {
        system: `You are a study notes formatter. You MUST output EXACTLY four markdown sections with these EXACT headings: ## Keywords, ## Questions, ## Notes, ## Summary. Do NOT use any other ## headings. Do NOT add a title. Start your response with ## Keywords on the very first line.`,
        prompt: `Here is the source text to convert into Cornell notes:\n\n${truncated}\n\n---\n\nNow format the above text as Cornell method study notes using EXACTLY these four sections. Start with ## Keywords on the first line.\n\n## Keywords\nExtract domain-specific vocabulary — technical terms, concepts, names, jargon. Group by theme using ### subheadings. Each term bold with a short definition:\n### Theme Name\n- **Term** -- definition\n\n## Questions\n5-8 specific factual comprehension questions as bullet points.\n\n## Notes\nOrganize the most important information by conceptual theme. Distill and synthesize — do NOT list every sentence. Use ### subheadings, numbered main points, and indented bullet sub-details. Limit each theme to 1-2 main points with 2-3 details.\n\n## Summary\n2-3 sentence summary of key takeaways.`,
      };
    case "questions":
      return {
        system:
          "You are a quiz generator. Return valid JSON only, with no markdown and no extra text.",
        prompt: `Create 8 multiple-choice questions from the source text below.

Return ONLY a JSON array. Each item must have this exact shape:
{"question":"string","options":["opt1","opt2","opt3","opt4"],"correctIndex":0,"explanation":"string"}

Rules:
- options must have exactly 4 short answer choices
- correctIndex must be 0, 1, 2, or 3
- questions should test key facts from the source text
- avoid trick questions
- keep explanations to one sentence

Source text:
${truncated}`,
      };
    default:
      return { prompt: `Summarize and structure the following text:\n\n${truncated}` };
  }
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "each",
  "every", "both", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "own", "same", "so", "than", "too", "very",
  "just", "because", "but", "and", "or", "if", "while", "that", "this",
  "these", "those", "it", "its", "he", "she", "they", "them", "his",
  "her", "their", "we", "our", "you", "your", "which", "what", "who",
  "also", "about", "up", "one", "two", "many", "much", "well", "back",
]);

function extractVocabulary(
  content: string,
  sentences: string[]
): { term: string; context: string }[] {
  const words = content.split(/\s+/);
  const freq = new Map<string, number>();

  for (const w of words) {
    const clean = w.replace(/[^a-zA-Z'-]/g, "").toLowerCase();
    if (clean.length > 3 && !STOPWORDS.has(clean)) {
      freq.set(clean, (freq.get(clean) || 0) + 1);
    }
  }

  const capitalizedPhrases = new Set<string>();
  const capRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let match: RegExpExecArray | null;
  while ((match = capRegex.exec(content)) !== null) {
    const phrase = match[1];
    if (phrase.length > 3 && !STOPWORDS.has(phrase.toLowerCase())) {
      capitalizedPhrases.add(phrase);
    }
  }

  const candidates: { term: string; score: number }[] = [];

  const phrasesArr = Array.from(capitalizedPhrases);
  phrasesArr.forEach((phrase) => {
    candidates.push({ term: phrase, score: 10 });
  });

  Array.from(freq.entries()).forEach(([word, count]) => {
    if (count >= 2 && word.length > 4) {
      const alreadyCovered = phrasesArr.some(
        (p) => p.toLowerCase().includes(word)
      );
      if (!alreadyCovered) {
        candidates.push({
          term: word.charAt(0).toUpperCase() + word.slice(1),
          score: count,
        });
      }
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const results: { term: string; context: string }[] = [];

  for (const c of candidates) {
    const lower = c.term.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);

    const contextSentence = sentences.find((s) =>
      s.toLowerCase().includes(lower)
    );
    let context = "Key concept from the text";
    if (contextSentence) {
      if (contextSentence.length <= 150) {
        context = contextSentence;
      } else {
        const cutoff = contextSentence.lastIndexOf(" ", 140);
        context = contextSentence.slice(0, cutoff > 80 ? cutoff : 140) + "...";
      }
    }
    results.push({ term: c.term, context });
    if (results.length >= 8) break;
  }

  return results;
}

function generateFallback(rawContent: string, format: string): string {
  const content = sanitizeContent(rawContent);
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
      const vocab = extractVocabulary(content, sentences);
      let keywords = "## Keywords\n\n### Key Vocabulary\n\n";
      vocab.forEach(({ term, context }) => {
        keywords += `- **${term}** -- ${context}\n`;
      });

      let questions = "## Questions\n\n";
      const questionSentences = sentences.filter((s) => s.length > 20).slice(0, 6);
      questionSentences.forEach((s) => {
        const subject = s.split(/\s+/).slice(0, 5).join(" ");
        questions += `- What is meant by "${subject}"?\n`;
      });

      const vocabTerms = vocab.map((v) => v.term.toLowerCase());

      const importantSentences = sentences.filter((s) => {
        if (s.length < 40) return false;
        const lower = s.toLowerCase();
        if (/^(let's|let us|we will|now |in this|as we)/.test(lower)) return false;
        return true;
      });

      const scoredSentences = importantSentences.map((s) => {
        const lower = s.toLowerCase();
        let score = 0;
        vocabTerms.forEach((term) => {
          if (lower.includes(term)) score += 3;
        });
        const meaningfulWords = s.split(/\s+/).filter(
          (w) => !STOPWORDS.has(w.toLowerCase().replace(/[^a-z]/g, "")) && w.length > 3
        );
        score += Math.min(meaningfulWords.length, 5);
        return { text: s, score };
      });

      scoredSentences.sort((a, b) => b.score - a.score);

      const usedTexts: string[] = [];
      const selected = scoredSentences.filter((s) => {
        const isDuplicate = usedTexts.some(
          (used) => used.includes(s.text.slice(0, 30)) || s.text.includes(used.slice(0, 30))
        );
        if (isDuplicate) return false;
        usedTexts.push(s.text);
        return true;
      }).slice(0, 12);

      const groups: { heading: string; points: string[] }[] = [];
      const maxPerGroup = 4;
      let currentGroup: { heading: string; points: string[] } | null = null;

      selected.forEach((s) => {
        const lower = s.text.toLowerCase();
        const matchedTerm = vocabTerms.find((t) => lower.includes(t));
        const heading = matchedTerm
          ? matchedTerm.charAt(0).toUpperCase() + matchedTerm.slice(1)
          : null;

        if (
          heading &&
          (!currentGroup || currentGroup.heading !== heading) &&
          !groups.some((g) => g.heading === heading)
        ) {
          currentGroup = { heading, points: [s.text] };
          groups.push(currentGroup);
        } else if (currentGroup && currentGroup.points.length < maxPerGroup) {
          currentGroup.points.push(s.text);
        } else if (!currentGroup) {
          currentGroup = { heading: "Key Concepts", points: [s.text] };
          groups.push(currentGroup);
        }
      });

      let notes = "## Notes\n\n";
      groups.forEach((g) => {
        notes += `### ${g.heading}\n\n`;
        g.points.forEach((p, j) => {
          if (j === 0) {
            notes += `1. ${p}\n`;
          } else {
            notes += `   - ${p}\n`;
          }
        });
        notes += "\n";
      });

      const summary = `## Summary\n\n${sentences.slice(0, 2).join(". ")}.`;
      return `${keywords}\n${questions}\n${notes}\n${summary}`;
    }
    case "questions": {
      const pool = sentences.filter((s) => s.length > 24).slice(0, 12);
      const cards = pool.slice(0, 8).map((sentence, i) => {
        const lead = sentence.split(/\s+/).slice(0, 6).join(" ");
        const question = `Which statement best matches: "${lead}"?`;

        const distractorPool = pool.filter((s, idx) => idx !== i).slice(0, 6);
        const options = [sentence];

        for (const candidate of distractorPool) {
          if (options.length >= 4) break;
          if (!options.includes(candidate)) options.push(candidate);
        }

        while (options.length < 4) {
          options.push(`This detail is not stated in the source text.`);
        }

        for (let j = options.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [options[j], options[k]] = [options[k], options[j]];
        }

        const correctIndex = options.findIndex((o) => o === sentence);

        return {
          question,
          options,
          correctIndex: correctIndex >= 0 ? correctIndex : 0,
          explanation: "The correct choice is directly supported by the original notes.",
        };
      });

      if (cards.length === 0) {
        const fallback = [
          {
            question: "Which statement best summarizes the provided notes?",
            options: [
              sentences[0] || "The notes describe a key topic in detail.",
              "The notes are unrelated to the topic.",
              "No information is provided in the notes.",
              "The notes only include opinions without facts.",
            ],
            correctIndex: 0,
            explanation: "The first option reflects the source material.",
          },
        ];
        return JSON.stringify(fallback, null, 2);
      }

      return JSON.stringify(cards, null, 2);
    }
    default:
      return content.slice(0, 1000);
  }
}
