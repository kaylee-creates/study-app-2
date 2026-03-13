import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .filter((item) => "str" in item)
      .map((item) => (item as { str: string }).str);
    pages.push(strings.join(" "));
  }
  return pages.join("\n\n");
}

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

export async function extractText(file: File): Promise<string> {
  const ext = getExtension(file.name);

  switch (ext) {
    case "pdf": {
      const buffer = await file.arrayBuffer();
      return extractPdfText(buffer);
    }
    case "docx": {
      const buffer = await file.arrayBuffer();
      return extractDocxText(buffer);
    }
    case "txt":
    case "md":
      return file.text();
    default:
      throw new Error(
        `Unsupported file type: .${ext}. Please upload a .txt, .md, .pdf, or .docx file.`
      );
  }
}
