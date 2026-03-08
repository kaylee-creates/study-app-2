import { Suspense } from "react";
import { ScrapbookCanvas } from "@/components/scrapbook/scrapbook-canvas";
import { NotesContent } from "@/components/notes/notes-content";

export default function NotesPage() {
  return (
    <ScrapbookCanvas pageId="notes">
      <Suspense fallback={<div className="animate-pulse rounded-lg h-64 bg-cozy-grid" />}>
        <NotesContent />
      </Suspense>
    </ScrapbookCanvas>
  );
}
