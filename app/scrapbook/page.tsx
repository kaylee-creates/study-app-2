import { ScrapbookCanvas } from "@/components/scrapbook/scrapbook-canvas";

export default function ScrapbookPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl text-theme-text">Scrapbook</h1>
      <ScrapbookCanvas pageId="scrapbook">
        <div className="min-h-[60vh]" />
      </ScrapbookCanvas>
    </div>
  );
}
