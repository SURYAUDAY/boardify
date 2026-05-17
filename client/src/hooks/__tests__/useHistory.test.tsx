import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHistory } from '../useHistory';
import type { Stroke } from '@shared/types';

function makeStroke(id: string): Stroke {
  return {
    id,
    tool: 'pen',
    points: [{ x: 0, y: 0 }],
    color: '#fff',
    strokeWidth: 3,
    userId: 'u1',
    timestamp: 0,
  };
}

describe('useHistory', () => {
  it('initial state: empty snapshot, cannot undo or redo', () => {
    const { result } = renderHook(() => useHistory({ enableShortcuts: false }));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.historyIndex).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('addToHistory advances index, enables undo', () => {
    const { result } = renderHook(() => useHistory({ enableShortcuts: false }));
    act(() => {
      result.current.addToHistory([makeStroke('a')]);
    });
    expect(result.current.history).toHaveLength(2);
    expect(result.current.historyIndex).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo returns previous state and enables redo', () => {
    const { result } = renderHook(() => useHistory({ enableShortcuts: false }));
    act(() => result.current.addToHistory([makeStroke('a')]));
    act(() => result.current.addToHistory([makeStroke('a'), makeStroke('b')]));
    let undone: Stroke[] | null = null;
    act(() => {
      undone = result.current.undo();
    });
    expect(undone).toEqual([makeStroke('a')]);
    expect(result.current.canRedo).toBe(true);
  });

  it('undo then redo restores latest state', () => {
    const { result } = renderHook(() => useHistory({ enableShortcuts: false }));
    act(() => result.current.addToHistory([makeStroke('a')]));
    act(() => result.current.addToHistory([makeStroke('a'), makeStroke('b')]));
    act(() => {
      result.current.undo();
    });
    let redone: Stroke[] | null = null;
    act(() => {
      redone = result.current.redo();
    });
    expect(redone).toEqual([makeStroke('a'), makeStroke('b')]);
  });

  it('addToHistory after undo truncates future', () => {
    const { result } = renderHook(() => useHistory({ enableShortcuts: false }));
    act(() => result.current.addToHistory([makeStroke('a')]));
    act(() => result.current.addToHistory([makeStroke('a'), makeStroke('b')]));
    act(() => {
      result.current.undo();
    });
    act(() => result.current.addToHistory([makeStroke('a'), makeStroke('c')]));
    expect(result.current.canRedo).toBe(false);
  });

  it('caps at 50 entries', () => {
    const { result } = renderHook(() => useHistory({ enableShortcuts: false }));
    for (let i = 0; i < 60; i++) {
      act(() => result.current.addToHistory([makeStroke(String(i))]));
    }
    expect(result.current.history.length).toBeLessThanOrEqual(50);
  });

  it('deep copy: mutating original does not affect history', () => {
    const { result } = renderHook(() => useHistory({ enableShortcuts: false }));
    const arr = [makeStroke('a')];
    act(() => result.current.addToHistory(arr));
    arr[0].color = '#000000';
    expect(result.current.history[1][0].color).toBe('#fff');
  });

  it('canUndo and canRedo flags update correctly', () => {
    const { result } = renderHook(() => useHistory({ enableShortcuts: false }));
    expect(result.current.canUndo).toBe(false);
    act(() => result.current.addToHistory([makeStroke('a')]));
    expect(result.current.canUndo).toBe(true);
    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);
    expect(result.current.canUndo).toBe(false);
  });
});
