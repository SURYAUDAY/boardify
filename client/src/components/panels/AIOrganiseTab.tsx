import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useWhiteboardStore } from '../../store/whiteboardStore';
import type { StickyNote } from '@shared/types';

interface Props {
  onStickyUpdated?: (id: string, partial: Partial<StickyNote>) => void;
}

interface Theme {
  name: string;
  color: string;
  noteIds: string[];
}

type Status = 'idle' | 'loading' | 'success';

export default function AIOrganiseTab({ onStickyUpdated }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>('idle');
  const [themes, setThemes] = useState<Theme[]>([]);
  const stickyNotes = useWhiteboardStore((s) => s.stickyNotes);
  const updateStickyNote = useWhiteboardStore((s) => s.updateStickyNote);

  function toggle(id: string) {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === stickyNotes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(stickyNotes.map((n) => n.id)));
    }
  }

  async function organise() {
    const notes = stickyNotes
      .filter((n) => selectedIds.has(n.id))
      .map((n) => ({ id: n.id, text: n.text || '' }));
    if (notes.length < 2) return;

    setStatus('loading');
    try {
      const res = await api.post('/ai/organise', { notes });
      setThemes(res.data.themes);
      setStatus('success');
    } catch {
      toast.error('Could not organise notes');
      setStatus('idle');
    }
  }

  function applyGrouping() {
    themes.forEach((theme, themeIdx) => {
      const baseX = 300 + (themeIdx % 2) * 500;
      const baseY = 200 + Math.floor(themeIdx / 2) * 500;
      theme.noteIds.forEach((id, noteIdx) => {
        const col = noteIdx % 2;
        const row = Math.floor(noteIdx / 2);
        const x = baseX + col * 220;
        const y = baseY + row * 180;
        updateStickyNote(id, { color: theme.color, x, y });
        onStickyUpdated?.(id, { color: theme.color, x, y });
      });
    });
    toast.success('Notes organised by theme');
    setStatus('idle');
    setThemes([]);
    setSelectedIds(new Set());
  }

  if (stickyNotes.length === 0) {
    return (
      <div className="text-center text-gray-400 text-[12px] py-8">
        Add some sticky notes first, then come back to organise them.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-gray-400">
        Select sticky notes to group by theme. AI assigns colors and organises them visually.
      </p>

      {status === 'idle' && (
        <>
          <button
            onClick={toggleAll}
            className="w-full border border-white/20 hover:bg-white/5 text-white text-[12px] h-8 rounded-lg"
          >
            {selectedIds.size === stickyNotes.length ? 'Deselect all' : 'Select all stickies'}
          </button>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {stickyNotes.map((n) => {
              const checked = selectedIds.has(n.id);
              return (
                <label
                  key={n.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(n.id)}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: n.color }}
                  />
                  <span className="text-[13px] text-white truncate flex-grow">
                    {n.text || '(empty)'}
                  </span>
                </label>
              );
            })}
          </div>

          <button
            disabled={selectedIds.size < 2}
            onClick={organise}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-[14px] font-semibold h-10 rounded-xl flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Organise by theme →
          </button>
        </>
      )}

      {status === 'loading' && (
        <div className="text-center py-6">
          <Sparkles className="w-6 h-6 text-indigo-500 mx-auto animate-spin" />
          <div className="text-white text-[14px] mt-2">Analysing themes...</div>
        </div>
      )}

      {status === 'success' && (
        <>
          <div className="text-[12px] text-gray-400">Found {themes.length} themes:</div>
          <div className="space-y-2">
            {themes.map((t) => (
              <div
                key={t.name}
                className="rounded-xl bg-white/5 p-3 flex items-center gap-2.5"
              >
                <span
                  className="w-4 h-4 rounded-md flex-shrink-0"
                  style={{ background: t.color }}
                />
                <div className="flex-grow">
                  <div className="text-[13px] text-white font-semibold">{t.name}</div>
                  <div className="text-[11px] text-gray-400">{t.noteIds.length} sticky notes</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={applyGrouping}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-[14px] font-semibold h-10 rounded-xl"
          >
            Apply grouping to board
          </button>
        </>
      )}
    </div>
  );
}
