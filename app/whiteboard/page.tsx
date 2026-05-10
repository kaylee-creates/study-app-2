import { ScrapbookCanvas } from "@/components/scrapbook/scrapbook-canvas";

const styles = {
  root: "-mx-4 -my-4 md:-mx-6 md:-my-6",
};

export default function WhiteboardPage() {
  return (
    <div className={styles.root}>
      <ScrapbookCanvas pageId="whiteboard" />
    </div>
  );
}
