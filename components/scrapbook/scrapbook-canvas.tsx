"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ScrapbookItem } from "@/lib/domain";
import { generateId, localStudyRepository } from "@/lib/storage-local";

type WhiteboardTool =
  | "select"
  | "pen"
  | "eraser"
  | "text"
  | "rectangle"
  | "ellipse"
  | "line"
  | "arrow";

interface Point {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScrapbookCanvasProps {
  pageId: string;
}

interface InteractionState {
  mode: "idle" | "draw" | "erase" | "shape" | "drag" | "resize" | "rotate";
  pointerId?: number;
  targetId?: string;
  startPoint?: Point;
  startBounds?: Rect;
  startRotation?: number;
}

const BOARD_MIN_HEIGHT = 560;
const DEFAULT_SHAPE_SIZE = 120;
const DEFAULT_STROKE_WIDTH = 3;
const DEFAULT_TEXT_WIDTH = 220;
const DEFAULT_TEXT_HEIGHT = 60;

const styles = {
  root: "relative min-h-[calc(100vh-5rem)] pb-28",
  boardWrap: "relative w-full bg-theme-bg/15",
  board: "relative w-full touch-none overflow-visible",
  surface: "absolute inset-0",
  boardInner: "relative w-full",
  overlay: "absolute inset-0 pointer-events-none",
  toolbar:
    "sticky bottom-24 z-30 mx-3 mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-theme-accent/25 bg-theme-surface/95 p-2 shadow-glass backdrop-blur md:mx-6",
  toolGroup: "flex flex-wrap items-center gap-1 rounded-xl border border-theme-accent/20 bg-theme-bg/70 px-2 py-1",
  swatch: "h-6 w-6 rounded-full border border-theme-accent/30 transition-transform hover:scale-105",
  selectedSwatch: "ring-2 ring-theme-accent ring-offset-1",
  fileInput: "sr-only",
  hint: "text-small text-theme-text-muted",
  itemFrame:
    "absolute cursor-pointer rounded-sm border border-transparent hover:border-theme-accent/25",
  selectedFrame: "border-theme-accent/50 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
  textItem:
    "h-full w-full resize-none rounded-md border border-theme-accent/25 bg-theme-bg/85 p-2 text-body text-theme-text focus:border-theme-accent focus:outline-none",
  textDisplay:
    "h-full w-full rounded-md border border-theme-accent/20 bg-theme-bg/70 p-2 text-body text-theme-text whitespace-pre-wrap",
  imageItem: "h-full w-full select-none rounded-md border border-theme-accent/15 object-cover",
  handle:
    "absolute h-4 w-4 rounded-sm border border-theme-accent bg-theme-surface shadow cursor-se-resize",
  rotateHandle:
    "absolute -top-7 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border border-theme-accent bg-theme-surface shadow cursor-grab",
};

const colorOptions = ["#f472b6", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#a78bfa", "#f8fafc"];

function cloneItems(items: ScrapbookItem[]): ScrapbookItem[] {
  return items.map((item) => ({
    ...item,
    points: item.points?.map((point) => ({ ...point })),
  }));
}

function ensureItemDefaults(item: ScrapbookItem): ScrapbookItem {
  if (item.type === "widget") {
    return {
      ...item,
      type: "text",
      textContent: item.textContent || "Text",
      color: item.color || "#f8fafc",
      fontSize: item.fontSize || 18,
      width: item.width || DEFAULT_TEXT_WIDTH,
      height: item.height || DEFAULT_TEXT_HEIGHT,
    };
  }
  if (item.type === "stroke") {
    return {
      ...item,
      points: item.points ?? [],
      color: item.color || "#f8fafc",
      strokeWidth: item.strokeWidth || DEFAULT_STROKE_WIDTH,
    };
  }
  if (item.type === "shape") {
    return {
      ...item,
      shapeKind: item.shapeKind || "rectangle",
      color: item.color || "#f8fafc",
      fillColor: item.fillColor || "transparent",
      strokeWidth: item.strokeWidth || DEFAULT_STROKE_WIDTH,
      width: Math.max(24, item.width || DEFAULT_SHAPE_SIZE),
      height: Math.max(24, item.height || DEFAULT_SHAPE_SIZE),
    };
  }
  if (item.type === "text") {
    return {
      ...item,
      textContent: item.textContent || "Text",
      color: item.color || "#f8fafc",
      fontSize: item.fontSize || 18,
      width: item.width || DEFAULT_TEXT_WIDTH,
      height: item.height || DEFAULT_TEXT_HEIGHT,
    };
  }
  if (item.type === "image") {
    return {
      ...item,
      width: item.width || DEFAULT_SHAPE_SIZE,
      height: item.height || DEFAULT_SHAPE_SIZE,
    };
  }
  return item;
}

function getBounds(item: ScrapbookItem): Rect {
  if (item.type === "stroke" && item.points && item.points.length > 0) {
    const xs = item.points.map((p) => p.x);
    const ys = item.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: Math.max(2, maxX - minX), height: Math.max(2, maxY - minY) };
  }
  return {
    x: item.x,
    y: item.y,
    width: Math.max(2, item.width),
    height: Math.max(2, item.height),
  };
}

function containsPoint(item: ScrapbookItem, point: Point): boolean {
  const bounds = getBounds(item);
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

function hitTest(items: ScrapbookItem[], point: Point): ScrapbookItem | null {
  const sorted = [...items].sort((a, b) => b.zIndex - a.zIndex);
  for (const item of sorted) {
    if (containsPoint(item, point)) return item;
  }
  return null;
}

function toBoardPoint(event: React.PointerEvent, host: HTMLElement): Point {
  const rect = host.getBoundingClientRect();
  return {
    x: event.clientX - rect.left + host.scrollLeft,
    y: event.clientY - rect.top + host.scrollTop,
  };
}

function pointsToPath(points: Point[]): string {
  if (points.length === 0) return "";
  const first = points[0];
  return points.slice(1).reduce((acc, point) => `${acc} L ${point.x} ${point.y}`, `M ${first.x} ${first.y}`);
}

export function ScrapbookCanvas({ pageId }: ScrapbookCanvasProps) {
  const [items, setItems] = useState<ScrapbookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tool, setTool] = useState<WhiteboardTool>("select");
  const [strokeColor, setStrokeColor] = useState("#f8fafc");
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [fontSize, setFontSize] = useState(18);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<InteractionState>({ mode: "idle" });

  const boardRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<ScrapbookItem[]>([]);
  const textInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const historyPastRef = useRef<ScrapbookItem[][]>([]);
  const historyFutureRef = useRef<ScrapbookItem[][]>([]);
  const operationStartRef = useRef<ScrapbookItem[] | null>(null);

  const syncItems = useCallback((next: ScrapbookItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const persistItems = useCallback(
    async (next: ScrapbookItem[]) => {
      await localStudyRepository.saveScrapbookItems(pageId, next);
    },
    [pageId]
  );

  const beginOperation = useCallback(() => {
    if (!operationStartRef.current) {
      operationStartRef.current = cloneItems(itemsRef.current);
    }
  }, []);

  const finalizeOperation = useCallback(async () => {
    const start = operationStartRef.current;
    if (!start) return;
    const end = cloneItems(itemsRef.current);
    operationStartRef.current = null;
    if (JSON.stringify(start) === JSON.stringify(end)) return;

    historyPastRef.current = [...historyPastRef.current.slice(-49), start];
    historyFutureRef.current = [];
    await persistItems(end);
  }, [persistItems]);

  useEffect(() => {
    (async () => {
      let mapped = (await localStudyRepository.getScrapbookItems(pageId)).map(ensureItemDefaults);

      if (pageId === "whiteboard" && mapped.length === 0) {
        const legacy = (await localStudyRepository.getScrapbookItems("scrapbook")).map(ensureItemDefaults);
        if (legacy.length > 0) {
          mapped = legacy.map((item) => ({ ...item, pageId: "whiteboard" }));
          await localStudyRepository.saveScrapbookItems("whiteboard", mapped);
        }
      }

      syncItems(mapped);
      setIsLoading(false);
    })();
  }, [pageId, syncItems]);

  useEffect(() => {
    if (!editingTextId) return;
    const frame = window.requestAnimationFrame(() => {
      const target = textInputRefs.current[editingTextId];
      if (!target) return;
      target.focus();
      const length = target.value.length;
      target.setSelectionRange(length, length);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editingTextId]);

  const maxZ = useMemo(() => Math.max(0, ...items.map((item) => item.zIndex)), [items]);
  const applyImmediate = useCallback((updater: (current: ScrapbookItem[]) => ScrapbookItem[]) => {
    const next = updater(itemsRef.current);
    syncItems(next);
  }, [syncItems]);

  const updateItem = useCallback((id: string, updater: (item: ScrapbookItem) => ScrapbookItem) => {
    applyImmediate((current) => current.map((item) => (item.id === id ? updater(item) : item)));
  }, [applyImmediate]);

  const removeItemsByPoint = useCallback((point: Point) => {
    applyImmediate((current) => current.filter((item) => !containsPoint(item, point)));
  }, [applyImmediate]);

  const startDragInteraction = useCallback(
    (event: React.PointerEvent, item: ScrapbookItem) => {
      if (!boardRef.current) return;
      const point = toBoardPoint(event, boardRef.current);
      beginOperation();
      setSelectedId(item.id);
      setEditingTextId((current) => (current === item.id ? null : current));
      setInteraction({
        mode: "drag",
        pointerId: event.pointerId,
        targetId: item.id,
        startPoint: point,
        startBounds: getBounds(item),
      });
      (boardRef.current as HTMLElement).setPointerCapture(event.pointerId);
    },
    [beginOperation]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isLoading || !boardRef.current) return;
      const point = toBoardPoint(event, boardRef.current);

      if (tool === "pen") {
        beginOperation();
        const newItem: ScrapbookItem = {
          id: generateId(),
          pageId,
          type: "stroke",
          points: [point, point],
          color: strokeColor,
          strokeWidth,
          x: point.x,
          y: point.y,
          width: 2,
          height: 2,
          zIndex: maxZ + 1,
          createdAt: new Date().toISOString(),
        };
        applyImmediate((current) => [...current, newItem]);
        setSelectedId(newItem.id);
        setInteraction({ mode: "draw", pointerId: event.pointerId, targetId: newItem.id });
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        return;
      }

      if (tool === "eraser") {
        beginOperation();
        removeItemsByPoint(point);
        setInteraction({ mode: "erase", pointerId: event.pointerId });
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        return;
      }

      if (tool === "text") {
        beginOperation();
        const newItem: ScrapbookItem = {
          id: generateId(),
          pageId,
          type: "text",
          textContent: "",
          color: strokeColor,
          fontSize,
          x: point.x,
          y: point.y,
          width: DEFAULT_TEXT_WIDTH,
          height: DEFAULT_TEXT_HEIGHT,
          zIndex: maxZ + 1,
          createdAt: new Date().toISOString(),
        };
        applyImmediate((current) => [...current, newItem]);
        setSelectedId(newItem.id);
        setEditingTextId(newItem.id);
        setTool("select");
        void finalizeOperation();
        return;
      }

      if (tool !== "select") {
        beginOperation();
        const newShape: ScrapbookItem = {
          id: generateId(),
          pageId,
          type: "shape",
          shapeKind: tool,
          color: strokeColor,
          fillColor,
          strokeWidth,
          x: point.x,
          y: point.y,
          width: 2,
          height: 2,
          zIndex: maxZ + 1,
          createdAt: new Date().toISOString(),
        };
        applyImmediate((current) => [...current, newShape]);
        setSelectedId(newShape.id);
        setInteraction({
          mode: "shape",
          pointerId: event.pointerId,
          targetId: newShape.id,
          startPoint: point,
        });
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        return;
      }

      const hit = hitTest(itemsRef.current, point);
      if (hit) {
        startDragInteraction(event, hit);
      } else {
        setSelectedId(null);
      }
    },
    [
      applyImmediate,
      beginOperation,
      fillColor,
      finalizeOperation,
      fontSize,
      isLoading,
      maxZ,
      pageId,
      removeItemsByPoint,
      strokeColor,
      strokeWidth,
      startDragInteraction,
      tool,
    ]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!boardRef.current || interaction.mode === "idle") return;
      const point = toBoardPoint(event, boardRef.current);

      if (interaction.mode === "draw" && interaction.targetId) {
        updateItem(interaction.targetId, (item) => {
          if (item.type !== "stroke") return item;
          const nextPoints = [...(item.points ?? []), point];
          const bounds = getBounds({ ...item, points: nextPoints });
          return { ...item, points: nextPoints, ...bounds };
        });
        return;
      }

      if (interaction.mode === "erase") {
        removeItemsByPoint(point);
        return;
      }

      if (interaction.mode === "shape" && interaction.targetId && interaction.startPoint) {
        const start = interaction.startPoint;
        const left = Math.min(start.x, point.x);
        const top = Math.min(start.y, point.y);
        const width = Math.max(2, Math.abs(point.x - start.x));
        const height = Math.max(2, Math.abs(point.y - start.y));
        updateItem(interaction.targetId, (item) => ({
          ...item,
          x: left,
          y: top,
          width,
          height,
        }));
        return;
      }

      if (interaction.mode === "drag" && interaction.targetId && interaction.startPoint && interaction.startBounds) {
        const dx = point.x - interaction.startPoint.x;
        const dy = point.y - interaction.startPoint.y;
        updateItem(interaction.targetId, (item) => {
          if (item.type === "stroke" && item.points) {
            return {
              ...item,
              points: item.points.map((entry) => ({
                x: entry.x + dx,
                y: entry.y + dy,
              })),
            };
          }
          return {
            ...item,
            x: interaction.startBounds!.x + dx,
            y: interaction.startBounds!.y + dy,
          };
        });
      }
    },
    [interaction, removeItemsByPoint, updateItem]
  );

  const handlePointerUp = useCallback(
    async (event: React.PointerEvent<HTMLDivElement>) => {
      if (interaction.pointerId !== undefined) {
        (event.currentTarget as HTMLElement).releasePointerCapture(interaction.pointerId);
      }
      setInteraction({ mode: "idle" });
      await finalizeOperation();
    },
    [finalizeOperation, interaction.pointerId]
  );

  const handleResizeDown = useCallback(
    (event: React.PointerEvent, item: ScrapbookItem) => {
      event.stopPropagation();
      event.preventDefault();
      if (!boardRef.current) return;
      beginOperation();
      const point = toBoardPoint(event, boardRef.current);
      const bounds = getBounds(item);
      setInteraction({
        mode: "resize",
        pointerId: event.pointerId,
        targetId: item.id,
        startPoint: point,
        startBounds: bounds,
      });
      (boardRef.current as HTMLElement).setPointerCapture(event.pointerId);
    },
    [beginOperation]
  );

  const handleRotateDown = useCallback(
    (event: React.PointerEvent, item: ScrapbookItem) => {
      event.stopPropagation();
      event.preventDefault();
      if (!boardRef.current) return;
      beginOperation();
      const point = toBoardPoint(event, boardRef.current);
      const bounds = getBounds(item);
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const currentAngle = Math.atan2(point.y - cy, point.x - cx) * (180 / Math.PI);
      setInteraction({
        mode: "rotate",
        pointerId: event.pointerId,
        targetId: item.id,
        startBounds: bounds,
        startRotation: currentAngle - (item.rotation ?? 0),
      });
      (boardRef.current as HTMLElement).setPointerCapture(event.pointerId);
    },
    [beginOperation]
  );

  useEffect(() => {
    if (!boardRef.current) return;
    if (interaction.mode === "resize" || interaction.mode === "rotate") {
      const onMove = (event: PointerEvent) => {
        if (!boardRef.current || !interaction.targetId) return;
        const rect = boardRef.current.getBoundingClientRect();
        const point = {
          x: event.clientX - rect.left + boardRef.current.scrollLeft,
          y: event.clientY - rect.top + boardRef.current.scrollTop,
        };

        if (interaction.mode === "resize" && interaction.startPoint && interaction.startBounds) {
          const dx = point.x - interaction.startPoint.x;
          const dy = point.y - interaction.startPoint.y;
          updateItem(interaction.targetId, (item) => {
            const width = Math.max(24, interaction.startBounds!.width + dx);
            const height = Math.max(24, interaction.startBounds!.height + dy);
            if (item.type === "stroke" && item.points && item.points.length > 1) {
              const old = interaction.startBounds!;
              const sx = width / Math.max(1, old.width);
              const sy = height / Math.max(1, old.height);
              const points = item.points.map((entry) => ({
                x: old.x + (entry.x - old.x) * sx,
                y: old.y + (entry.y - old.y) * sy,
              }));
              return { ...item, points };
            }
            return { ...item, width, height };
          });
        }

        if (interaction.mode === "rotate" && interaction.startBounds) {
          const bounds = interaction.startBounds;
          const cx = bounds.x + bounds.width / 2;
          const cy = bounds.y + bounds.height / 2;
          const angle = Math.atan2(point.y - cy, point.x - cx) * (180 / Math.PI);
          updateItem(interaction.targetId, (item) => ({
            ...item,
            rotation: Math.round(angle - (interaction.startRotation ?? 0)),
          }));
        }
      };

      const onUp = async () => {
        setInteraction({ mode: "idle" });
        await finalizeOperation();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
    }
  }, [finalizeOperation, interaction, updateItem]);

  const handleBringForward = useCallback(
    async (id: string) => {
      beginOperation();
      applyImmediate((current) =>
        current.map((item) => (item.id === id ? { ...item, zIndex: maxZ + 1 } : item))
      );
      await finalizeOperation();
    },
    [applyImmediate, beginOperation, finalizeOperation, maxZ]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      beginOperation();
      applyImmediate((current) => current.filter((item) => item.id !== id));
      if (selectedId === id) setSelectedId(null);
      await finalizeOperation();
    },
    [applyImmediate, beginOperation, finalizeOperation, selectedId]
  );

  const handleTextEdit = useCallback((item: ScrapbookItem) => {
    if (item.type !== "text") return;
    setSelectedId(item.id);
    setEditingTextId(item.id);
  }, []);

  const handleUndo = useCallback(async () => {
    const previous = historyPastRef.current.pop();
    if (!previous) return;
    historyFutureRef.current = [cloneItems(itemsRef.current), ...historyFutureRef.current];
    syncItems(cloneItems(previous));
    await persistItems(previous);
  }, [persistItems, syncItems]);

  const handleRedo = useCallback(async () => {
    const next = historyFutureRef.current.shift();
    if (!next) return;
    historyPastRef.current = [...historyPastRef.current, cloneItems(itemsRef.current)];
    syncItems(cloneItems(next));
    await persistItems(next);
  }, [persistItems, syncItems]);

  const handleClear = useCallback(async () => {
    if (!window.confirm("Clear the entire whiteboard?")) return;
    beginOperation();
    syncItems([]);
    setSelectedId(null);
    await finalizeOperation();
  }, [beginOperation, finalizeOperation, syncItems]);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      beginOperation();
      applyImmediate((current) => [
        ...current,
        ensureItemDefaults({
          id: generateId(),
          pageId,
          type: "image",
          imageUrl: url,
          imageName: file.name,
          x: 40 + current.length * 12,
          y: 40 + current.length * 12,
          width: 180,
          height: 140,
          zIndex: maxZ + 1,
          createdAt: new Date().toISOString(),
        }),
      ]);
      await finalizeOperation();
      event.target.value = "";
    },
    [applyImmediate, beginOperation, finalizeOperation, maxZ, pageId]
  );

  const exportPdf = useCallback(async () => {
    if (!boardRef.current) return;
    const width = Math.max(960, boardRef.current.clientWidth);
    const height = Math.max(BOARD_MIN_HEIGHT, boardRef.current.clientHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, width, height);

    const ordered = [...items].sort((a, b) => a.zIndex - b.zIndex);
    for (const item of ordered) {
      if (item.type === "stroke" && item.points && item.points.length > 1) {
        ctx.save();
        ctx.strokeStyle = item.color || "#f8fafc";
        ctx.lineWidth = item.strokeWidth || 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        item.points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const bounds = getBounds(item);
      ctx.save();
      ctx.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      ctx.rotate(((item.rotation ?? 0) * Math.PI) / 180);
      ctx.translate(-bounds.width / 2, -bounds.height / 2);

      if (item.type === "shape") {
        ctx.strokeStyle = item.color || "#f8fafc";
        ctx.fillStyle = item.fillColor || "transparent";
        ctx.lineWidth = item.strokeWidth || 3;
        if (item.shapeKind === "rectangle") {
          if (item.fillColor && item.fillColor !== "transparent") ctx.fillRect(0, 0, bounds.width, bounds.height);
          ctx.strokeRect(0, 0, bounds.width, bounds.height);
        } else if (item.shapeKind === "ellipse") {
          ctx.beginPath();
          ctx.ellipse(bounds.width / 2, bounds.height / 2, bounds.width / 2, bounds.height / 2, 0, 0, Math.PI * 2);
          if (item.fillColor && item.fillColor !== "transparent") ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(bounds.width, bounds.height);
          ctx.stroke();
          if (item.shapeKind === "arrow") {
            ctx.beginPath();
            ctx.moveTo(bounds.width, bounds.height);
            ctx.lineTo(bounds.width - 14, bounds.height - 4);
            ctx.lineTo(bounds.width - 4, bounds.height - 14);
            ctx.closePath();
            ctx.fillStyle = item.color || "#f8fafc";
            ctx.fill();
          }
        }
      } else if (item.type === "text") {
        ctx.fillStyle = item.color || "#f8fafc";
        ctx.font = `${item.fontSize || 18}px sans-serif`;
        ctx.textBaseline = "top";
        const lines = (item.textContent || "").split("\n");
        lines.forEach((line, index) => {
          ctx.fillText(line, 6, 6 + index * ((item.fontSize || 18) + 4));
        });
      } else if (item.type === "image" && item.imageUrl) {
        await new Promise<void>((resolve) => {
          const image = new Image();
          image.onload = () => {
            ctx.drawImage(image, 0, 0, bounds.width, bounds.height);
            resolve();
          };
          image.onerror = () => resolve();
          image.src = item.imageUrl || "";
        });
      }
      ctx.restore();
    }

    const dataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Whiteboard PDF Export</title></head>
        <body style="margin:0;display:flex;justify-content:center;background:#111;">
          <img src="${dataUrl}" style="max-width:100%;height:auto;" />
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [items]);

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.zIndex - b.zIndex), [items]);
  const boardMinHeight = useMemo(() => {
    const contentBottom = items.reduce((max, item) => {
      const bounds = getBounds(item);
      return Math.max(max, bounds.y + bounds.height + 220);
    }, 0);
    return Math.max(BOARD_MIN_HEIGHT, contentBottom);
  }, [items]);

  return (
    <div className={styles.root}>
      <div className={styles.boardWrap}>
        <div
          ref={boardRef}
          className={styles.board}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className={styles.boardInner} style={{ minHeight: boardMinHeight }}>
            {isLoading && <p className={styles.hint}>Loading whiteboard...</p>}
            {sortedItems.map((item) => {
              const bounds = getBounds(item);
              const isSelected = item.id === selectedId;
              const frameClass = `${styles.itemFrame} ${isSelected ? styles.selectedFrame : ""}`;
              const rotation = item.rotation ?? 0;

              if (item.type === "stroke" && item.points && item.points.length > 1) {
                const path = pointsToPath(item.points);
                return (
                  <svg key={item.id} className={styles.surface} style={{ zIndex: item.zIndex }}>
                    <path
                      d={path}
                      stroke={item.color || "#f8fafc"}
                      strokeWidth={item.strokeWidth || DEFAULT_STROKE_WIDTH}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      onPointerDown={() => setSelectedId(item.id)}
                    />
                  </svg>
                );
              }

              return (
                <div
                  key={item.id}
                  className={frameClass}
                  style={{
                    left: bounds.x,
                    top: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    zIndex: item.zIndex,
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: "center",
                  }}
                  onDoubleClick={() => handleTextEdit(item)}
                  onPointerDown={(event) => {
                    if (item.type === "text" && event.target instanceof HTMLTextAreaElement) return;
                    event.stopPropagation();
                    startDragInteraction(event, item);
                  }}
                >
                  {item.type === "image" && item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.imageName || "Whiteboard image"}
                      className={styles.imageItem}
                      draggable={false}
                    />
                  )}
                  {item.type === "text" && (
                    editingTextId === item.id ? (
                      <textarea
                        ref={(element) => {
                          textInputRefs.current[item.id] = element;
                        }}
                        className={styles.textItem}
                        style={{ color: item.color, fontSize: item.fontSize }}
                        value={item.textContent ?? ""}
                        placeholder="Type text..."
                        onFocus={() => {
                          beginOperation();
                          setSelectedId(item.id);
                          setEditingTextId(item.id);
                        }}
                        onBlur={async () => {
                          setEditingTextId((current) => (current === item.id ? null : current));
                          await finalizeOperation();
                        }}
                        onChange={(event) => {
                          const value = event.target.value;
                          updateItem(item.id, (entry) =>
                            entry.type === "text" ? { ...entry, textContent: value } : entry
                          );
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                      />
                    ) : (
                      <div className={styles.textDisplay} style={{ color: item.color, fontSize: item.fontSize }}>
                        {item.textContent || "Double click to type"}
                      </div>
                    )
                  )}
                  {item.type === "shape" && (
                    <svg className="h-full w-full">
                      {item.shapeKind === "rectangle" && (
                        <rect
                          x={0}
                          y={0}
                          width={bounds.width}
                          height={bounds.height}
                          stroke={item.color || "#f8fafc"}
                          fill={item.fillColor || "transparent"}
                          strokeWidth={item.strokeWidth || DEFAULT_STROKE_WIDTH}
                        />
                      )}
                      {item.shapeKind === "ellipse" && (
                        <ellipse
                          cx={bounds.width / 2}
                          cy={bounds.height / 2}
                          rx={bounds.width / 2}
                          ry={bounds.height / 2}
                          stroke={item.color || "#f8fafc"}
                          fill={item.fillColor || "transparent"}
                          strokeWidth={item.strokeWidth || DEFAULT_STROKE_WIDTH}
                        />
                      )}
                      {(item.shapeKind === "line" || item.shapeKind === "arrow") && (
                        <>
                          <line
                            x1={0}
                            y1={0}
                            x2={bounds.width}
                            y2={bounds.height}
                            stroke={item.color || "#f8fafc"}
                            strokeWidth={item.strokeWidth || DEFAULT_STROKE_WIDTH}
                          />
                          {item.shapeKind === "arrow" && (
                            <polygon
                              points={`${bounds.width},${bounds.height} ${bounds.width - 16},${bounds.height - 4} ${bounds.width - 4},${bounds.height - 16}`}
                              fill={item.color || "#f8fafc"}
                            />
                          )}
                        </>
                      )}
                    </svg>
                  )}

                  {isSelected && (
                    <>
                      <button
                        type="button"
                        className={styles.rotateHandle}
                        onPointerDown={(event) => handleRotateDown(event, item)}
                      />
                      <button
                        type="button"
                        className={styles.handle}
                        style={{ right: -8, bottom: -8 }}
                        onPointerDown={(event) => handleResizeDown(event, item)}
                      />
                      <div className="absolute -top-8 right-0 flex gap-1">
                        <Button type="button" size="sm" variant="secondary" onClick={() => void handleBringForward(item.id)}>
                          Front
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => void handleDelete(item.id)}>
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          {(["select", "pen", "eraser", "text", "rectangle", "ellipse", "line", "arrow"] as WhiteboardTool[]).map(
            (entry) => (
              <Button
                key={entry}
                type="button"
                size="sm"
                variant={tool === entry ? "default" : "secondary"}
                onClick={() => setTool(entry)}
              >
                {entry}
              </Button>
            )
          )}
        </div>

        <div className={styles.toolGroup}>
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Color ${color}`}
              className={`${styles.swatch} ${strokeColor === color ? styles.selectedSwatch : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => setStrokeColor(color)}
            />
          ))}
        </div>

        <div className={styles.toolGroup}>
          <label className={styles.hint}>Stroke</label>
          <input
            type="range"
            min={1}
            max={16}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
          />
          <label className={styles.hint}>Font</label>
          <input
            type="range"
            min={12}
            max={48}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
        </div>

        <div className={styles.toolGroup}>
          <label className={styles.hint}>Fill</label>
          <input
            type="color"
            value={fillColor === "transparent" ? "#000000" : fillColor}
            onChange={(e) => setFillColor(e.target.value)}
          />
          <Button type="button" size="sm" variant="secondary" onClick={() => setFillColor("transparent")}>
            No fill
          </Button>
        </div>

        <div className={styles.toolGroup}>
          <Button type="button" size="sm" variant="secondary" onClick={handleUndo}>
            Undo
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={handleRedo}>
            Redo
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={handleClear}>
            Clear
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={exportPdf}>
            Export PDF
          </Button>
          <label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={styles.fileInput}
              onChange={handleImageUpload}
            />
            <Button type="button" size="sm" variant="secondary" asChild>
              <span>Add image</span>
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
}
