"use client";

import { useCallback, useRef, useState } from "react";
import type { ScrapbookItem } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InteractionMode = "idle" | "drag" | "resize" | "rotate";

interface ScrapbookItemLayerProps {
  item: ScrapbookItem;
  onMove: (id: string, x: number, y: number) => void;
  onMoveEnd: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onBringForward: (id: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  onRotate: (id: string, rotation: number) => void;
}

export function ScrapbookItemLayer({
  item,
  onMove,
  onMoveEnd,
  onRemove,
  onBringForward,
  onResize,
  onRotate,
}: ScrapbookItemLayerProps) {
  const [mode, setMode] = useState<InteractionMode>("idle");
  const dragStart = useRef({ x: 0, y: 0, itemX: 0, itemY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const rotateStart = useRef({ angle: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleDragDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, [data-handle]")) return;
      e.preventDefault();
      setMode("drag");
      dragStart.current = { x: e.clientX, y: e.clientY, itemX: item.x, itemY: item.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [item.x, item.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (mode === "drag") {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        onMove(item.id, dragStart.current.itemX + dx, dragStart.current.itemY + dy);
      }
    },
    [mode, item.id, onMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (mode === "drag") {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        onMoveEnd(item.id, dragStart.current.itemX + dx, dragStart.current.itemY + dy);
      }
      setMode("idle");
    },
    [mode, item.id, onMoveEnd]
  );

  const handleResizeDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setMode("resize");
      resizeStart.current = { x: e.clientX, y: e.clientY, w: item.width, h: item.height };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [item.width, item.height]
  );

  const handleResizeMove = useCallback(
    (e: React.PointerEvent) => {
      if (mode !== "resize") return;
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      const newW = Math.max(40, resizeStart.current.w + dx);
      const newH = Math.max(40, resizeStart.current.h + dy);
      onResize(item.id, newW, newH);
    },
    [mode, item.id, onResize]
  );

  const handleResizeUp = useCallback(
    (e: React.PointerEvent) => {
      if (mode !== "resize") return;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      setMode("idle");
    },
    [mode]
  );

  const handleRotateDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!wrapperRef.current) return;
      setMode("rotate");
      const rect = wrapperRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
      rotateStart.current = { angle: startAngle - (item.rotation ?? 0) };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [item.rotation]
  );

  const handleRotateMove = useCallback(
    (e: React.PointerEvent) => {
      if (mode !== "rotate" || !wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
      onRotate(item.id, Math.round(angle - rotateStart.current.angle));
    },
    [mode, item.id, onRotate]
  );

  const handleRotateUp = useCallback(
    (e: React.PointerEvent) => {
      if (mode !== "rotate") return;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      setMode("idle");
    },
    [mode]
  );

  if (item.type !== "image" || !item.imageUrl) return null;

  const rotation = item.rotation ?? 0;

  return (
    <div
      ref={wrapperRef}
      className="absolute cursor-grab active:cursor-grabbing group"
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        zIndex: item.zIndex,
        transform: `rotate(${rotation}deg)`,
      }}
      onPointerDown={handleDragDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className={cn(
          "w-full h-full rounded-lg overflow-hidden border-2 border-theme-accent/20 bg-theme-surface shadow-md transition",
          mode === "drag" && "ring-2 ring-theme-accent ring-offset-2"
        )}
      >
        <img
          src={item.imageUrl}
          alt={item.imageName ?? "Scrapbook image"}
          className="w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
        />
      </div>

      {/* Top toolbar: bring forward / remove */}
      <div className="absolute -top-8 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-theme-text-muted hover:text-theme-text"
          onClick={(e) => { e.stopPropagation(); onBringForward(item.id); }}
          title="Bring forward"
        >
          <span className="text-xs">&#8593;</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-theme-text-muted hover:text-theme-accent"
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          title="Remove"
        >
          <span className="text-xs">&times;</span>
        </Button>
      </div>

      {/* Rotation handle -- circle above center, connected by a thin line */}
      <div
        data-handle="rotate"
        className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: "50%", top: "-36px", transform: "translateX(-50%)" }}
      >
        <div className="flex flex-col items-center">
          <div
            className="w-5 h-5 rounded-full border-2 border-theme-accent bg-white cursor-grab hover:bg-theme-accent/20 transition-colors"
            onPointerDown={handleRotateDown}
            onPointerMove={handleRotateMove}
            onPointerUp={handleRotateUp}
          />
          <div className="w-px h-3 bg-theme-accent/50" />
        </div>
      </div>

      {/* Resize handle -- bottom-right corner */}
      <div
        data-handle="resize"
        className="absolute bottom-0 right-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-se-resize"
        style={{ transform: "translate(25%, 25%)" }}
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
      >
        <div className="w-full h-full rounded-sm border-2 border-theme-accent bg-white" />
      </div>

      {/* Resize handle -- bottom-left corner */}
      <div
        data-handle="resize"
        className="absolute bottom-0 left-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-sw-resize"
        style={{ transform: "translate(-25%, 25%)" }}
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
      >
        <div className="w-full h-full rounded-sm border-2 border-theme-accent bg-white" />
      </div>

      {/* Resize handle -- top-right corner */}
      <div
        data-handle="resize"
        className="absolute top-0 right-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-ne-resize"
        style={{ transform: "translate(25%, -25%)" }}
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
      >
        <div className="w-full h-full rounded-sm border-2 border-theme-accent bg-white" />
      </div>

      {/* Resize handle -- top-left corner */}
      <div
        data-handle="resize"
        className="absolute top-0 left-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-nw-resize"
        style={{ transform: "translate(-25%, -25%)" }}
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
      >
        <div className="w-full h-full rounded-sm border-2 border-theme-accent bg-white" />
      </div>
    </div>
  );
}
