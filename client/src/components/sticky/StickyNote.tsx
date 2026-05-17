import { useEffect, useRef, useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import type { StickyNote as StickyNoteType } from '@shared/types';

const COLORS = [
  '#FEF9C3', // yellow
  '#DCFCE7', // green
  '#FCE7F3', // pink
  '#DBEAFE', // blue
  '#E9D5FF', // purple
  '#FED7AA', // orange
];

interface Props {
  note: StickyNoteType;
  onUpdate: (id: string, partial: Partial<StickyNoteType>) => void;
  onDelete: (id: string) => void;
  currentUserId: string;
}

export default function StickyNote({ note, onUpdate, onDelete }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pos, setPos] = useState({ x: note.x, y: note.y });
  const [size, setSize] = useState({ width: note.width, height: note.height });
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizeStartRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rotation = useRef<number>(((parseInt(note.id, 36) % 5) - 2) * 0.5);

  // Sync position when note changes from outside (e.g., socket update)
  useEffect(() => {
    setPos({ x: note.x, y: note.y });
    setSize({ width: note.width, height: note.height });
  }, [note.x, note.y, note.width, note.height]);

  // Initial text setup (only on mount)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== note.text) {
      editorRef.current.innerText = note.text || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    dragOffsetRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };

    function onMove(ev: MouseEvent) {
      if (!dragOffsetRef.current) return;
      const nx = ev.clientX - dragOffsetRef.current.dx;
      const ny = ev.clientY - dragOffsetRef.current.dy;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setPos({ x: nx, y: ny }));
    }
    function onUp(ev: MouseEvent) {
      if (!dragOffsetRef.current) return;
      const nx = ev.clientX - dragOffsetRef.current.dx;
      const ny = ev.clientY - dragOffsetRef.current.dy;
      onUpdate(note.id, { x: nx, y: ny });
      dragOffsetRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
    };

    function onMove(ev: MouseEvent) {
      const r = resizeStartRef.current;
      if (!r) return;
      const w = Math.max(120, Math.min(600, r.startW + (ev.clientX - r.startX)));
      const h = Math.max(80, Math.min(600, r.startH + (ev.clientY - r.startY)));
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setSize({ width: w, height: h }));
    }
    function onUp(ev: MouseEvent) {
      const r = resizeStartRef.current;
      if (!r) return;
      const w = Math.max(120, Math.min(600, r.startW + (ev.clientX - r.startX)));
      const h = Math.max(80, Math.min(600, r.startH + (ev.clientY - r.startY)));
      onUpdate(note.id, { width: w, height: h });
      resizeStartRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function onTextInput(e: React.FormEvent<HTMLDivElement>) {
    const text = (e.currentTarget as HTMLDivElement).innerText;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onUpdate(note.id, { text }), 500);
  }

  // Slightly darker shade for the top bar
  const headerColor = note.color;

  return (
    <div
      className="absolute rounded-xl flex flex-col select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        background: note.color,
        boxShadow: `0 8px 24px -4px ${note.color}80, 0 4px 8px rgba(0,0,0,0.15)`,
        transform: `rotate(${rotation.current}deg)`,
        pointerEvents: 'auto',
      }}
    >
      {/* Top bar */}
      <div
        onMouseDown={startDrag}
        className="h-7 px-2 flex items-center justify-between rounded-t-xl cursor-grab active:cursor-grabbing"
        style={{ background: `${headerColor}`, filter: 'brightness(0.96)' }}
      >
        <GripVertical className="w-3.5 h-3.5 text-gray-500" />
        <div className="flex items-center gap-1 relative">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setPickerOpen((v) => !v)}
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ background: note.color }}
            aria-label="Change color"
          />
          {pickerOpen && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute right-0 top-6 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-10"
            >
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onUpdate(note.id, { color: c });
                    setPickerOpen(false);
                  }}
                  className="w-5 h-5 rounded-full border border-gray-300"
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          )}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(note.id)}
            className="text-gray-500 hover:text-red-500 p-0.5"
            aria-label="Delete note"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={onTextInput}
        onMouseDown={(e) => e.stopPropagation()}
        data-placeholder="Add a note..."
        className="flex-grow p-3 outline-none text-[14px] leading-[1.5] text-gray-700 overflow-auto whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
        style={{ caretColor: '#1E293B' }}
      />

      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        className="absolute right-0 bottom-0 w-3 h-3 cursor-nwse-resize"
        style={{
          background:
            'linear-gradient(135deg, transparent 50%, rgba(107,114,128,0.5) 50%, rgba(107,114,128,0.5) 60%, transparent 60%, transparent 70%, rgba(107,114,128,0.5) 70%, rgba(107,114,128,0.5) 80%, transparent 80%)',
        }}
      />
    </div>
  );
}
