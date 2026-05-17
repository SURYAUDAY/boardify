import { describe, it, expect, vi } from 'vitest';
import {
  distanceBetween,
  getMidpoint,
  calculateArrowAngle,
  isPointInRect,
  drawStroke,
  redrawAll,
} from '../canvasUtils';
import type { Stroke } from '@shared/types';

describe('distanceBetween', () => {
  it('same point → 0', () => {
    expect(distanceBetween({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });
  it('(0,0) to (3,4) → 5', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
  it('(0,0) to (0,0) → 0', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
  });
});

describe('getMidpoint', () => {
  it('(0,0) and (10,10) → (5,5)', () => {
    expect(getMidpoint({ x: 0, y: 0 }, { x: 10, y: 10 })).toEqual({ x: 5, y: 5 });
  });
  it('negative coords', () => {
    expect(getMidpoint({ x: -10, y: -10 }, { x: 10, y: 10 })).toEqual({ x: 0, y: 0 });
  });
});

describe('calculateArrowAngle', () => {
  it('point right → 0', () => {
    expect(calculateArrowAngle({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0);
  });
  it('point up → -π/2', () => {
    expect(calculateArrowAngle({ x: 0, y: 0 }, { x: 0, y: -10 })).toBe(-Math.PI / 2);
  });
  it('point left → π', () => {
    expect(calculateArrowAngle({ x: 0, y: 0 }, { x: -10, y: 0 })).toBe(Math.PI);
  });
});

describe('isPointInRect', () => {
  const rect = { x: 10, y: 10, width: 100, height: 100 };
  it('inside → true', () => {
    expect(isPointInRect({ x: 50, y: 50 }, rect)).toBe(true);
  });
  it('outside → false', () => {
    expect(isPointInRect({ x: 5, y: 5 }, rect)).toBe(false);
  });
  it('on edge → true', () => {
    expect(isPointInRect({ x: 10, y: 10 }, rect)).toBe(true);
    expect(isPointInRect({ x: 110, y: 110 }, rect)).toBe(true);
  });
});

function mockCtx() {
  return {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    quadraticCurveTo: vi.fn(),
    strokeRect: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    clearRect: vi.fn(),
    closePath: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    font: '',
    textAlign: '',
    textBaseline: '',
  } as unknown as CanvasRenderingContext2D & Record<string, ReturnType<typeof vi.fn>>;
}

describe('drawStroke', () => {
  it('pen with 3 points calls moveTo and quadraticCurveTo', () => {
    const ctx = mockCtx();
    const stroke: Stroke = {
      id: '1', tool: 'pen',
      points: [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 0 }],
      color: '#fff', strokeWidth: 3, userId: 'u', timestamp: 0,
    };
    drawStroke(ctx, stroke);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('rect calls strokeRect with derived width/height', () => {
    const ctx = mockCtx();
    const stroke: Stroke = {
      id: '2', tool: 'rect',
      points: [{ x: 10, y: 10 }, { x: 100, y: 50 }],
      color: '#fff', strokeWidth: 2, userId: 'u', timestamp: 0,
    };
    drawStroke(ctx, stroke);
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 10, 90, 40);
  });

  it('line calls moveTo + lineTo', () => {
    const ctx = mockCtx();
    const stroke: Stroke = {
      id: '3', tool: 'line',
      points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      color: '#fff', strokeWidth: 2, userId: 'u', timestamp: 0,
    };
    drawStroke(ctx, stroke);
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 100);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('sets strokeStyle and lineWidth from stroke', () => {
    const ctx = mockCtx();
    const stroke: Stroke = {
      id: '4', tool: 'line',
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      color: '#FF00FF', strokeWidth: 7, userId: 'u', timestamp: 0,
    };
    drawStroke(ctx, stroke);
    expect((ctx as any).strokeStyle).toBe('#FF00FF');
    expect((ctx as any).lineWidth).toBe(7);
  });
});

describe('redrawAll', () => {
  it('empty strokes → clearRect but no stroke methods', () => {
    const ctx = mockCtx();
    redrawAll(ctx, [], 500, 500);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 500, 500);
    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it('3 strokes → stroke called 3 times', () => {
    const ctx = mockCtx();
    const strokes: Stroke[] = [
      { id: 'a', tool: 'line', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], color: '#fff', strokeWidth: 1, userId: 'u', timestamp: 0 },
      { id: 'b', tool: 'line', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], color: '#fff', strokeWidth: 1, userId: 'u', timestamp: 0 },
      { id: 'c', tool: 'line', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], color: '#fff', strokeWidth: 1, userId: 'u', timestamp: 0 },
    ];
    redrawAll(ctx, strokes, 500, 500);
    expect(ctx.stroke).toHaveBeenCalledTimes(3);
  });
});
