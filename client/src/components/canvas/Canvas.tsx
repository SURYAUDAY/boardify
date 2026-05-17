import { useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { useWhiteboardStore } from '../../store/whiteboardStore';
import { drawStroke, redrawAll, distanceBetween, isPointInRect } from '../../lib/canvasUtils';
import type { Point, Stroke } from '@shared/types';

const ERASER_RADIUS = 12;

type Bounds = { x: number; y: number; width: number; height: number };

function strokeBounds(stroke: Stroke): Bounds {
  const xs = stroke.points.map((p) => p.x);
  const ys = stroke.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function strokeNearPoint(stroke: Stroke, point: Point, radius: number): boolean {
  const b = strokeBounds(stroke);
  if (
    point.x < b.x - radius ||
    point.x > b.x + b.width + radius ||
    point.y < b.y - radius ||
    point.y > b.y + b.height + radius
  ) {
    return false;
  }
  for (const p of stroke.points) {
    if (distanceBetween(p, point) <= radius) return true;
  }
  return false;
}

function rectsIntersect(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

interface Props {
  onPointerMove?: (point: Point) => void;
  onStrokeAdded?: (stroke: Stroke) => void;
  onStrokeDeleted?: (id: string) => void;
  onStickyCreated?: (point: Point) => void;
  onSelectionChanged?: (bounds: Bounds | null) => void;
  readOnly?: boolean;
}

export default function Canvas({
  onPointerMove,
  onStrokeAdded,
  onStrokeDeleted,
  onStickyCreated,
  onSelectionChanged,
  readOnly = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef<Point[]>([]);
  const startPointRef = useRef<Point | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Region selection (for OCR)
  const [selectionRect, setSelectionRect] = useState<Bounds | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef<Point | null>(null);

  const activeTool = useWhiteboardStore((s) => s.activeTool);
  const activeColor = useWhiteboardStore((s) => s.activeColor);
  const strokeWidth = useWhiteboardStore((s) => s.strokeWidth);
  const strokes = useWhiteboardStore((s) => s.strokes);
  const addStroke = useWhiteboardStore((s) => s.addStroke);
  const removeStroke = useWhiteboardStore((s) => s.removeStroke);
  const user = useWhiteboardStore((s) => s.user);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        redrawAll(ctx, strokes, rect.width, rect.height);
      }
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    redrawAll(ctx, strokes, rect.width, rect.height);

    if (selectedId) {
      const sel = strokes.find((s) => s.id === selectedId);
      if (sel) {
        const b = strokeBounds(sel);
        const pad = 6;
        ctx.save();
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2);
        ctx.restore();
      }
    }
  }, [strokes, selectedId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        removeStroke(selectedId);
        onStrokeDeleted?.(selectedId);
        setSelectedId(null);
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        if (textInput) {
          setTextInput(null);
          setTextValue('');
        }
        if (selectionRect) {
          setSelectionRect(null);
          onSelectionChanged?.(null);
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedId, removeStroke, onStrokeDeleted, textInput, selectionRect, onSelectionChanged]);

  // Clear selection when switching tools
  useEffect(() => {
    if (activeTool !== 'select') {
      setSelectedId(null);
      setSelectionRect(null);
      onSelectionChanged?.(null);
    }
  }, [activeTool, onSelectionChanged]);

  function getPoint(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function eraseAt(point: Point) {
    for (const s of strokes) {
      if (strokeNearPoint(s, point, ERASER_RADIUS)) {
        removeStroke(s.id);
        onStrokeDeleted?.(s.id);
      }
    }
  }

  function hitTestStroke(point: Point): Stroke | undefined {
    return [...strokes].reverse().find((s) => {
      const b = strokeBounds(s);
      return isPointInRect(point, {
        x: b.x - 4,
        y: b.y - 4,
        width: b.width + 8,
        height: b.height + 8,
      });
    });
  }

  function onDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!user || readOnly) return;
    const point = getPoint(e);

    if (activeTool === 'select') {
      const hit = hitTestStroke(point);
      if (hit) {
        setSelectedId(hit.id);
        setSelectionRect(null);
        onSelectionChanged?.(null);
      } else {
        setSelectedId(null);
        setIsSelecting(true);
        selectionStartRef.current = point;
        setSelectionRect({ x: point.x, y: point.y, width: 0, height: 0 });
      }
      return;
    }

    if (activeTool === 'text') {
      setTextInput(point);
      setTextValue('');
      return;
    }

    if (activeTool === 'eraser') {
      setIsDrawing(true);
      eraseAt(point);
      return;
    }

    if (!['pen', 'line', 'arrow', 'rect', 'circle'].includes(activeTool)) return;
    setIsDrawing(true);
    startPointRef.current = point;
    currentPathRef.current = [point];
  }

  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const point = getPoint(e);
    onPointerMove?.(point);

    if (isSelecting && selectionStartRef.current) {
      const start = selectionStartRef.current;
      const x = Math.min(start.x, point.x);
      const y = Math.min(start.y, point.y);
      const width = Math.abs(point.x - start.x);
      const height = Math.abs(point.y - start.y);
      setSelectionRect({ x, y, width, height });
      return;
    }

    if (!isDrawing || !user || readOnly) return;

    if (activeTool === 'eraser') {
      eraseAt(point);
      return;
    }

    if (activeTool === 'pen') {
      currentPathRef.current.push(point);
    } else {
      currentPathRef.current = [startPointRef.current!, point];
    }

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    redrawAll(ctx, strokes, rect.width, rect.height);

    const tempStroke: Stroke = {
      id: 'temp',
      tool: activeTool,
      points: currentPathRef.current,
      color: activeColor,
      strokeWidth,
      userId: user.id,
      timestamp: Date.now(),
    };
    drawStroke(ctx, tempStroke);
  }

  function onUp() {
    if (isSelecting) {
      setIsSelecting(false);
      selectionStartRef.current = null;
      if (selectionRect && (selectionRect.width < 10 || selectionRect.height < 10)) {
        setSelectionRect(null);
        onSelectionChanged?.(null);
      } else if (selectionRect) {
        onSelectionChanged?.(selectionRect);
      }
      return;
    }

    if (!isDrawing || !user || readOnly) {
      setIsDrawing(false);
      return;
    }
    setIsDrawing(false);

    if (activeTool === 'eraser') return;
    if (currentPathRef.current.length === 0) return;

    const stroke: Stroke = {
      id: nanoid(),
      tool: activeTool,
      points: currentPathRef.current,
      color: activeColor,
      strokeWidth,
      userId: user.id,
      timestamp: Date.now(),
    };
    addStroke(stroke);
    onStrokeAdded?.(stroke);
    currentPathRef.current = [];
    startPointRef.current = null;
  }

  function onDoubleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!user || readOnly) return;
    if (activeTool === 'sticky') {
      onStickyCreated?.(getPoint(e));
    }
  }

  function commitText() {
    if (!textInput || !user) return;
    const text = textValue.trim();
    if (text.length > 0) {
      const stroke: Stroke = {
        id: nanoid(),
        tool: 'text',
        points: [textInput],
        color: activeColor,
        strokeWidth,
        userId: user.id,
        timestamp: Date.now(),
        text,
      };
      addStroke(stroke);
      onStrokeAdded?.(stroke);
    }
    setTextInput(null);
    setTextValue('');
  }

  function cursorFor(tool: string): string {
    switch (tool) {
      case 'pen':
      case 'line':
      case 'arrow':
      case 'rect':
      case 'circle':
        return 'crosshair';
      case 'text':
        return 'text';
      case 'eraser':
        return 'cell';
      case 'select':
        return 'crosshair';
      case 'sticky':
        return 'copy';
      case 'pan':
        return 'grab';
      default:
        return 'default';
    }
  }

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onDoubleClick={onDoubleClick}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: cursorFor(activeTool), touchAction: 'none' }}
      />

      {/* Render selection rect during drag (live) */}
      {isSelecting && selectionRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: selectionRect.x,
            top: selectionRect.y,
            width: selectionRect.width,
            height: selectionRect.height,
            border: '2px dashed #6366F1',
            background: 'rgba(99, 102, 241, 0.08)',
          }}
        />
      )}

      {textInput && (
        <textarea
          autoFocus
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitText();
            }
            if (e.key === 'Escape') {
              setTextInput(null);
              setTextValue('');
            }
          }}
          placeholder="Type..."
          className="absolute bg-transparent border border-indigo-500/40 outline-none resize-none px-1 py-0 min-w-[120px]"
          style={{
            left: textInput.x,
            top: textInput.y,
            color: activeColor,
            font: '16px Inter, sans-serif',
            lineHeight: '1.2',
            height: 24,
          }}
        />
      )}
    </div>
  );
}

// Export helpers used by SelectionOverlay/ExportPanel for hit/intersection logic
export { strokeBounds, rectsIntersect };
