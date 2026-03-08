import { ScrapbookCanvas } from "@/components/scrapbook/scrapbook-canvas";
import { PlannerContent } from "@/components/planner/planner-content";

export default function PlannerPage() {
  return (
    <ScrapbookCanvas pageId="planner">
      <PlannerContent />
    </ScrapbookCanvas>
  );
}
