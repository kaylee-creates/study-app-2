"use client";

import { useCallback, useState } from "react";
import type { ScrapbookItem } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScrapbookItemLayerProps {
  item: ScrapbookItem;
  onMove: (id: string, x: number, y: number) => void;
  onMoveEnd: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onBringForward: (id: string) => void;
}

export function ScrapbookItemLayer({
  item,
  onMove,
  onMoveEnd,
  onRemove,
  onBringForward,
}: ScrapbookItemLayerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, itemX: 0, itemY: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        itemX: item.x,
        itemY: item.y,
      });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [item.x, item.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      onMove(item.id, dragStart.itemX + dx, dragStart.itemY + dy);
    },
    [isDragging, dragStart, item.id, onMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      setIsDragging(false);
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      onMoveEnd(item.id, dragStart.itemX + dx, dragStart.itemY + dy);
    },
    [isDragging, dragStart, item.id, onMoveEnd]
  );

  if (item.type !== "image" || !item.imageUrl) return null;

  return (
    <div
      className="absolute cursor-grab active:cursor-grabbing group"
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        zIndex: item.zIndex,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => isDragging && setIsDragging(false)}
    >
      <div
        className={cn(
          "w-full h-full rounded-lg overflow-hidden border-2 border-cozy-grid bg-cozy-paper shadow-md transition shadow-cozy-sage/20",
          isDragging && "ring-2 ring-cozy-clover ring-offset-2"
        )}
      >
        <img
          src={item.imageUrl}
          alt={item.imageName ?? "Scrapbook image"}
          className="w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
        />
      </div>
      <div className="absolute -top-8 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-cozy-muted hover:text-cozy-ink"
          onClick={(e) => {
            e.stopPropagation();
            onBringForward(item.id);
          }}
          title="Bring forward"
        >
          <span className="text-xs">↑</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-cozy-muted hover:text-cozy-gingham"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          title="Remove"
        >
          <span className="text-xs">×</span>
        </Button>
      </div>
    </div>
  );
}
