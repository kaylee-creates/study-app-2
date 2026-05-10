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

const styles = {
  wrapper: "group absolute cursor-grab active:cursor-grabbing",
  imageFrame:
    "absolute overflow-hidden rounded-lg border-2 border-theme-accent/20 bg-theme-surface shadow-md transition",
  imageFrameDragging: "ring-2 ring-theme-accent ring-offset-2",
  image: "pointer-events-none h-full w-full select-none object-cover",
  toolbar:
    "absolute flex gap-1 opacity-0 transition-opacity group-hover:opacity-100",
  toolbarButtonForward:
    "h-7 w-7 text-theme-text-muted hover:text-theme-text",
  toolbarButtonRemove:
    "h-7 w-7 text-theme-text-muted hover:text-theme-accent",
  toolbarGlyph: "text-xs",
  rotateHandleWrap:
    "absolute opacity-0 transition-opacity group-hover:opacity-100",
  rotateHandleColumn: "flex flex-col items-center",
  rotateKnob:
    "h-5 w-5 cursor-grab rounded-full border-2 border-theme-accent bg-white transition-colors hover:bg-theme-accent/20",
  rotateStem: "h-3 w-px bg-theme-accent/50",
  resizeHandleWrap:
    "absolute h-5 w-5 cursor-se-resize opacity-0 transition-opacity group-hover:opacity-100",
  resizeHandleWrapSw:
    "absolute h-5 w-5 cursor-sw-resize opacity-0 transition-opacity group-hover:opacity-100",
  resizeHandleFace: "h-full w-full rounded-sm border-2 border-theme-accent bg-white",
};

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
      className={styles.wrapper}
      style={{
        left: item.x - 12,
        top: item.y - 44,
        width: item.width + 24,
        height: item.height + 56,
        zIndex: item.zIndex,
        transform: `rotate(${rotation}deg)`,
        overflow: "visible",
      }}
      onPointerDown={handleDragDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className={cn(
          styles.imageFrame,
          mode === "drag" && styles.imageFrameDragging
        )}
        style={{
          left: 12,
          top: 44,
          width: item.width,
          height: item.height,
        }}
      >
        <img
          src={item.imageUrl}
          alt={item.imageName ?? "Scrapbook image"}
          className={styles.image}
          draggable={false}
        />
      </div>

      {/* Top toolbar: bring forward / remove */}
      <div className={styles.toolbar} style={{ top: 8, right: 12 }}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={styles.toolbarButtonForward}
          onClick={(e) => { e.stopPropagation(); onBringForward(item.id); }}
          title="Bring forward"
        >
          <span className={styles.toolbarGlyph}>&#8593;</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={styles.toolbarButtonRemove}
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          title="Remove"
        >
          <span className={styles.toolbarGlyph}>&times;</span>
        </Button>
      </div>

      {/* Rotation handle -- circle above center, connected by a thin line */}
      <div
        data-handle="rotate"
        className={styles.rotateHandleWrap}
        style={{ left: "50%", top: "2px", transform: "translateX(-50%)" }}
      >
        <div className={styles.rotateHandleColumn}>
          <div
            className={styles.rotateKnob}
            onPointerDown={handleRotateDown}
            onPointerMove={handleRotateMove}
            onPointerUp={handleRotateUp}
          />
          <div className={styles.rotateStem} />
        </div>
      </div>

      {/* Resize handle -- bottom-right corner */}
      <div
        data-handle="resize"
        className={styles.resizeHandleWrap}
        style={{ bottom: 0, right: 4 }}
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
      >
        <div className={styles.resizeHandleFace} />
      </div>

      {/* Resize handle -- bottom-left corner */}
      <div
        data-handle="resize"
        className={styles.resizeHandleWrapSw}
        style={{ bottom: 0, left: 4 }}
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
      >
        <div className={styles.resizeHandleFace} />
      </div>
    </div>
  );
}
