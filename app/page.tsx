import { Suspense } from "react";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { ScrapbookCanvas } from "@/components/scrapbook/scrapbook-canvas";

export default function HomePage() {
  return (
    <ScrapbookCanvas pageId="dashboard">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </ScrapbookCanvas>
  );
}

function DashboardSkeleton() {
  return (
    <div className="scrapbook-page min-h-[60vh] rounded-lg p-6 animate-pulse">
      <div className="h-8 w-48 bg-cozy-grid rounded mb-6" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-24 bg-cozy-grid rounded-lg" />
        <div className="h-24 bg-cozy-grid rounded-lg" />
      </div>
    </div>
  );
}
