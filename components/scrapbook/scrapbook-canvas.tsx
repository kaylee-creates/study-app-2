"use client";

import { useCallback, useEffect, useState } from "react";
import type { ScrapbookItem } from "@/lib/domain";
import { localStudyRepository, generateId } from "@/lib/storage-local";
import { Button } from "@/components/ui/button";
import { ScrapbookItemLayer } from "./scrapbook-item-layer";

const DEFAULT_ITEM_SIZE = 120;

interface ScrapbookCanvasProps {
  pageId: string;
  children: React.ReactNode;
}

export function ScrapbookCanvas({ pageId, children }: ScrapbookCanvasProps) {
  const [items, setItems] = useState<ScrapbookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = useCallback(async () => {
    const list = await localStudyRepository.getScrapbookItems(pageId);
    setItems(list);
    setIsLoading(false);
  }, [pageId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const persistItems = useCallback(
    async (next: ScrapbookItem[]) => {
      setItems(next);
      await localStudyRepository.saveScrapbookItems(pageId, next);
    },
    [pageId]
  );

  const handleAddImage = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      const newItem: ScrapbookItem = {
        id: generateId(),
        pageId,
        type: "image",
        imageUrl: url,
        imageName: file.name,
        x: 40 + items.length * 20,
        y: 40 + items.length * 20,
        width: DEFAULT_ITEM_SIZE,
        height: DEFAULT_ITEM_SIZE,
        zIndex: items.length,
        createdAt: new Date().toISOString(),
      };
      persistItems([...items, newItem]);
      e.target.value = "";
    },
    [pageId, items, persistItems]
  );

  const handleMove = useCallback(
    (id: string, x: number, y: number) => {
      const next = items.map((i) =>
        i.id === id ? { ...i, x, y } : i
      );
      setItems(next);
    },
    [items]
  );

  const handleMoveEnd = useCallback(
    (id: string, x: number, y: number) => {
      const next = items.map((i) =>
        i.id === id ? { ...i, x, y } : i
      );
      persistItems(next);
    },
    [items, persistItems]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const removed = items.find((i) => i.id === id);
      if (removed?.imageUrl) URL.revokeObjectURL(removed.imageUrl);
      persistItems(items.filter((i) => i.id !== id));
    },
    [items, persistItems]
  );

  const handleBringForward = useCallback(
    (id: string) => {
      const maxZ = Math.max(0, ...items.map((i) => i.zIndex));
      const current = items.find((i) => i.id === id);
      if (!current) return;
      const next = items.map((i) =>
        i.id === id ? { ...i, zIndex: maxZ + 1 } : i
      );
      persistItems(next);
    },
    [items, persistItems]
  );

  const handleResize = useCallback(
    (id: string, width: number, height: number) => {
      const next = items.map((i) =>
        i.id === id ? { ...i, width, height } : i
      );
      persistItems(next);
    },
    [items, persistItems]
  );

  const handleRotate = useCallback(
    (id: string, rotation: number) => {
      const next = items.map((i) =>
        i.id === id ? { ...i, rotation } : i
      );
      persistItems(next);
    },
    [items, persistItems]
  );

  return (
    <div className="relative min-h-[70vh]">
      <div className="scrapbook-page rounded-xl min-h-[60vh] p-6 relative">
        {children}
      </div>
      <div className="absolute inset-0 pointer-events-none [&>*]:pointer-events-auto">
        {!isLoading &&
          items.map((item) => (
            <ScrapbookItemLayer
              key={item.id}
              item={item}
              onMove={handleMove}
              onMoveEnd={handleMoveEnd}
              onRemove={handleRemove}
              onBringForward={handleBringForward}
              onResize={handleResize}
              onRotate={handleRotate}
            />
          ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={handleAddImage}
          />
          <Button type="button" variant="secondary" size="sm" asChild>
            <span>Add PNG / image</span>
          </Button>
        </label>
        <span className="text-sm text-theme-text-muted">
          Drag, resize, or rotate items on the page
        </span>
      </div>
    </div>
  );
}
