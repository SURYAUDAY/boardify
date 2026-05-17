import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { useWhiteboardStore } from '../store/whiteboardStore';

const DEBOUNCE_MS = 2000;

export function useAutoSave(boardId: string | undefined) {
  const strokes = useWhiteboardStore((s) => s.strokes);
  const stickyNotes = useWhiteboardStore((s) => s.stickyNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialMountRef = useRef(true);

  useEffect(() => {
    if (!boardId) return;
    // Skip the very first run (initial load already came from the server)
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    setIsSaving(true);
    timerRef.current = setTimeout(async () => {
      try {
        await api.patch(`/boards/${boardId}`, { strokes, stickyNotes });
        setLastSavedAt(Date.now());
      } catch {
        // Silent failure — toast already wired through axios for 401
      } finally {
        setIsSaving(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [boardId, strokes, stickyNotes]);

  return { isSaving, lastSavedAt };
}
