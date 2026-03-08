import { ScrapbookCanvas } from "@/components/scrapbook/scrapbook-canvas";
import { FlashcardsContent } from "@/components/flashcards/flashcards-content";

export default function FlashcardsPage() {
  return (
    <ScrapbookCanvas pageId="flashcards">
      <FlashcardsContent />
    </ScrapbookCanvas>
  );
}
