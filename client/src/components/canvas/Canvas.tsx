import { useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { useWhiteboardStore } from '../../store/whiteboardStore';
import {
  drawStroke,
  redrawAll,
  distanceBetween,
  isPointInRect,
  screenToWorld,
} from '../../lib/canvasUtils';
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
  const [textInput, setTextInput] = useState<Point | null>(null);
  const [textValue, setTextValue] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Region selection for OCR — stored in WORLD coordinates
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
  const panX = useWhiteboardStore((s) => s.panX);
  const panY = useWhiteboardStore((s) => s.panY);
  const zoom = useWhiteboardStore((s) => s.zoom);
  const setPan = useWhiteboardStore((s) => s.setPan);
  const setZoom = useWhiteboardStore((s) => s.setZoom);

  // Spacebar-held flag = temporary pan from any tool (Figma-style)
  const [spaceHeld, setSpaceHeld] = useState(false);

  // ---- Drawing ----

  function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, tempStroke?: Stroke) {
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Apply world-space transform: pan + zoom
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    redrawAll(ctx, strokes, w, h);

    if (tempStroke) {
      drawStroke(ctx, tempStroke);
    }

    if (selectedId) {
      const sel = strokes.find((s) => s.id === selectedId);
      if (sel) {
        const b = strokeBounds(sel);
        const pad = 6;
        ctx.strokeStyle = '#6366F1';
        // Keep the selection box visually thin regardless of zoom level
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        ctx.strokeRect(b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2);
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }

  // Resize: keep canvas pixel buffer at viewport size (in CSS px × DPR)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) drawScene(ctx, w, h);
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw on state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawScene(ctx, canvas.offsetWidth, canvas.offsetHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, selectedId, panX, panY, zoom]);

  // Wheel: Cmd/Ctrl = zoom around cursor, otherwise pan
  // Registered as a non-passive listener so we can preventDefault on Ctrl+wheel
  // (which would otherwise trigger the browser's page zoom).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onWheel(e: WheelEvent) {
      const rect = canvas!.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        // Zoom around cursor: world coord under cursor stays fixed
        e.preventDefault();
        const state = useWhiteboardStore.getState();
        const oldZoom = state.zoom;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const newZoom = Math.max(0.25, Math.min(4, oldZoom * factor));
        if (newZoom === oldZoom) return;
        // Anchor: world point under cursor must end at the same screen point
        // screenX = worldX * zoom + panX → solve for new pan
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        const worldX = (cursorX - state.panX) / oldZoom;
        const worldY = (cursorY - state.panY) / oldZoom;
        const newPanX = cursorX - worldX * newZoom;
        const newPanY = cursorY - worldY * newZoom;
        setZoom(newZoom);
        setPan(newPanX, newPanY);
      } else {
        // Pan: vertical wheel = vertical pan, Shift = horizontal pan
        e.preventDefault();
        const state = useWhiteboardStore.getState();
        if (e.shiftKey) {
          setPan(state.panX - e.deltaY, state.panY);
        } else {
          setPan(state.panX - e.deltaX, state.panY - e.deltaY);
        }
      }
    }

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [setPan, setZoom]);

  // Delete / Escape / Spacebar-pan
  useEffect(() => {
    function isEditableTarget(t: EventTarget | null): boolean {
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return true;
      if (t instanceof HTMLElement && t.isContentEditable) return true;
      return false;
    }
    function onKey(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;
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
      // Spacebar held = temporary pan (Figma-style). Don't scroll the page.
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpaceHeld(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [selectedId, removeStroke, onStrokeDeleted, textInput, selectionRect, onSelectionChanged]);

  // Clear selection when switching tools
  useEffect(() => {
    if (activeTool !== 'select') {
      setSelectedId(null);
      setSelectionRect(null);
      onSelectionChanged?.(null);
    }
  }, [activeTool, onSelectionChanged]);

  // ---- Coordinate helpers ----

  function getWorldPoint(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return screenToWorld(clientX, clientY, rect, panX, panY, zoom);
  }

  function eraseAt(point: Point) {
    // Eraser radius is in world space → divide by zoom so it feels constant on screen
    const radius = ERASER_RADIUS / zoom;
    for (const s of strokes) {
      if (strokeNearPoint(s, point, radius)) {
        removeStroke(s.id);
        onStrokeDeleted?.(s.id);
      }
    }
  }

  function hitTestStroke(point: Point): Stroke | undefined {
    const slop = 4 / zoom;
    return [...strokes].reverse().find((s) => {
      const b = strokeBounds(s);
      return isPointInRect(point, {
        x: b.x - slop,
        y: b.y - slop,
        width: b.width + slop * 2,
        height: b.height + slop * 2,
      });
    });
  }

  // ---- Mouse handlers ----

  function startPanDrag(e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) {
    const startX = e.clientX;
    const startY = e.clientY;
    const startPanX = panX;
    const startPanY = panY;
    function onMove(ev: MouseEvent) {
      setPan(startPanX + (ev.clientX - startX), startPanY + (ev.clientY - startY));
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function onDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!user) return;

    // Pan triggers (all 3 enter pan mode regardless of active tool):
    //   1. Pan tool selected
    //   2. Spacebar held (Figma-style temp pan)
    //   3. Middle mouse button (button 1)
    if (activeTool === 'pan' || spaceHeld || e.button === 1) {
      e.preventDefault();
      startPanDrag(e);
      return;
    }

    if (readOnly) return;

    const point = getWorldPoint(e);

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
    const point = getWorldPoint(e);
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
    const tempStroke: Stroke = {
      id: 'temp',
      tool: activeTool,
      points: currentPathRef.current,
      color: activeColor,
      strokeWidth,
      userId: user.id,
      timestamp: Date.now(),
    };
    drawScene(ctx, canvas.offsetWidth, canvas.offsetHeight, tempStroke);
  }

  function onUp() {
    if (isSelecting) {
      setIsSelecting(false);
      selectionStartRef.current = null;
      if (selectionRect && (selectionRect.width < 10 / zoom || selectionRect.height < 10 / zoom)) {
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
      onStickyCreated?.(getWorldPoint(e));
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
    // Spacebar override — temp pan mode
    if (spaceHeld) return 'grab';
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

  // For the text-input overlay and the live selection-rect overlay we need to
  // project world coords → screen coords so the HTML elements sit in the right
  // visual spot (the canvas itself handles its own world transform).
  const screenSelection =
    isSelecting && selectionRect
      ? {
          left: selectionRect.x * zoom + panX,
          top: selectionRect.y * zoom + panY,
          width: selectionRect.width * zoom,
          height: selectionRect.height * zoom,
        }
      : null;

  const screenTextInput = textInput
    ? { left: textInput.x * zoom + panX, top: textInput.y * zoom + panY }
    : null;

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

      {screenSelection && (
        <div
          className="absolute pointer-events-none"
          style={{
            ...screenSelection,
            border: '2px dashed #6366F1',
            background: 'rgba(99, 102, 241, 0.08)',
          }}
        />
      )}

      {textInput && screenTextInput && (
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
            left: screenTextInput.left,
            top: screenTextInput.top,
            color: activeColor,
            font: `${16 * zoom}px Inter, sans-serif`,
            lineHeight: '1.2',
            height: 24 * zoom,
          }}
        />
      )}
    </div>
  );
}

// Used by other components for bounds math
export { strokeBounds, rectsIntersect };
