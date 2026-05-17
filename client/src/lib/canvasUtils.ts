import type { Point, Stroke } from '@shared/types';

export function distanceBetween(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getMidpoint(p1: Point, p2: Point): Point {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

export function calculateArrowAngle(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function isPointInRect(
  point: Point,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Convert a screen-space pointer position to world-space canvas coordinates,
 * accounting for the canvas's screen bounding rect, current pan, and zoom.
 *
 * The canvas itself is always rendered at viewport size; pan/zoom are applied
 * inside ctx.translate + ctx.scale before drawing. So a stroke at world coord
 * (wx, wy) appears on screen at (wx * zoom + panX + rect.left, ...).
 *
 * Inverting that:
 *   wx = (screenX - rect.left - panX) / zoom
 *   wy = (screenY - rect.top  - panY) / zoom
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  rect: { left: number; top: number },
  panX: number,
  panY: number,
  zoom: number
): Point {
  return {
    x: (screenX - rect.left - panX) / zoom,
    y: (screenY - rect.top - panY) / zoom,
  };
}

/**
 * Project a world coordinate to a screen-space pixel offset (relative to the
 * canvas's parent / wrapper). Used by HTML overlays (selection toolbar, OCR
 * result card) that need to be positioned in screen space but referenced to
 * world-space content.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  panX: number,
  panY: number,
  zoom: number
): Point {
  return {
    x: worldX * zoom + panX,
    y: worldY * zoom + panY,
  };
}

export function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  size = 12
): void {
  const angle = calculateArrowAngle(from, to);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - size * Math.cos(angle - Math.PI / 6),
    to.y - size * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - size * Math.cos(angle + Math.PI / 6),
    to.y - size * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  if (!stroke.points || stroke.points.length === 0) return;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const pts = stroke.points;

  switch (stroke.tool) {
    case 'pen':
    case 'eraser': {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 1) {
        ctx.lineTo(pts[0].x + 0.01, pts[0].y + 0.01);
      } else if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const mid = getMidpoint(pts[i], pts[i + 1]);
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mid.x, mid.y);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      }
      ctx.stroke();
      break;
    }
    case 'line': {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
      break;
    }
    case 'rect': {
      if (pts.length < 2) return;
      const [a, b] = [pts[0], pts[pts.length - 1]];
      if (stroke.shapeVariant === 'diamond') {
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.abs(b.x - a.x);
        const h = Math.abs(b.y - a.y);
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x, y + h / 2);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      }
      if (stroke.text) {
        ctx.fillStyle = stroke.color;
        ctx.font = '13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stroke.text, (a.x + b.x) / 2, (a.y + b.y) / 2);
      }
      break;
    }
    case 'circle': {
      if (pts.length < 2) return;
      const [center, edge] = [pts[0], pts[pts.length - 1]];
      const radius = distanceBetween(center, edge);
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      if (stroke.text) {
        ctx.fillStyle = stroke.color;
        ctx.font = '13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stroke.text, center.x, center.y);
      }
      break;
    }
    case 'arrow': {
      if (pts.length < 2) return;
      const [from, to] = [pts[0], pts[pts.length - 1]];
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      drawArrowhead(ctx, from, to, 12);
      break;
    }
    case 'text': {
      if (stroke.text) {
        ctx.fillStyle = stroke.color;
        ctx.font = '16px Inter, sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(stroke.text, pts[0].x, pts[0].y);
      }
      break;
    }
  }
}

export function redrawAll(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
  for (const stroke of strokes) {
    drawStroke(ctx, stroke);
  }
}
