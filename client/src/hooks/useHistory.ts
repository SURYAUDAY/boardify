import { useCallback, useEffect, useRef, useState } from 'react';
import type { Stroke } from '@shared/types';

const MAX_ENTRIES = 50;

function clone(strokes: Stroke[]): Stroke[] {
  return JSON.parse(JSON.stringify(strokes));
}

export interface UseHistoryOptions {
  onApply?: (strokes: Stroke[]) => void;
  enableShortcuts?: boolean;
}

export function useHistory(options: UseHistoryOptions = {}) {
  const { onApply, enableShortcuts = true } = options;
  const [history, setHistory] = useState<Stroke[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  const addToHistory = useCallback((strokes: Stroke[]) => {
    setHistory((prev) => {
      // Truncate any future first
      const truncated = prev.slice(0, historyIndexRef.current + 1);
      const next = [...truncated, clone(strokes)];
      while (next.length > MAX_ENTRIES) next.shift();
      historyIndexRef.current = next.length - 1;
      return next;
    });
    setHistoryIndex(() => historyIndexRef.current);
  }, []);

  // Mirror index into a ref so addToHistory uses the latest synchronously
  const historyIndexRef = useRef(historyIndex);
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  const undo = useCallback((): Stroke[] | null => {
    if (historyIndexRef.current <= 0) return null;
    const newIndex = historyIndexRef.current - 1;
    historyIndexRef.current = newIndex;
    setHistoryIndex(newIndex);
    const snapshot = clone(history[newIndex] || []);
    onApplyRef.current?.(snapshot);
    return snapshot;
  }, [history]);

  const redo = useCallback((): Stroke[] | null => {
    if (historyIndexRef.current >= history.length - 1) return null;
    const newIndex = historyIndexRef.current + 1;
    historyIndexRef.current = newIndex;
    setHistoryIndex(newIndex);
    const snapshot = clone(history[newIndex] || []);
    onApplyRef.current?.(snapshot);
    return snapshot;
  }, [history]);

  useEffect(() => {
    if (!enableShortcuts) return;
    function onKey(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [enableShortcuts, undo, redo]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return { history, historyIndex, addToHistory, undo, redo, canUndo, canRedo };
}
