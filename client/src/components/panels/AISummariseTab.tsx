import { useState } from 'react';
import { FileText, Copy, StickyNote as StickyIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useWhiteboardStore } from '../../store/whiteboardStore';
import type { StickyNote } from '@shared/types';

interface Props {
  boardId: string;
  onStickyAdded?: (note: StickyNote) => void;
  onQuotaConsumed?: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'empty';

export default function AISummariseTab({ boardId, onStickyAdded, onQuotaConsumed }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [summary, setSummary] = useState<string | null>(null);
  const stickyNotes = useWhiteboardStore((s) => s.stickyNotes);
  const strokes = useWhiteboardStore((s) => s.strokes);
  const addStickyNote = useWhiteboardStore((s) => s.addStickyNote);
  const user = useWhiteboardStore((s) => s.user);

  const textCount =
    stickyNotes.filter((n) => n.text?.trim()).length +
    strokes.filter((s) => s.tool === 'text' && s.text?.trim()).length;

  async function summarise() {
    setStatus('loading');
    try {
      const res = await api.post('/ai/summarise', { boardId });
      if (res.data.summary === null) {
        setStatus('empty');
        return;
      }
      setSummary(res.data.summary);
      setStatus('success');
      onQuotaConsumed?.();
    } catch (err: unknown) {
      const errObj = err as { response?: { status?: number; data?: { error?: string } } };
      if (errObj?.response?.status === 429) {
        toast.error(errObj.response?.data?.error || 'AI quota reached for today');
        onQuotaConsumed?.();
      } else {
        toast.error('Could not generate summary');
      }
      setStatus('idle');
    }
  }

  function copySummary() {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    toast.success('Copied to clipboard');
  }

  function addAsSticky() {
    if (!summary || !user) return;
    const note: StickyNote = {
      id: nanoid(),
      text: summary,
      x: 200,
      y: 200,
      width: 280,
      height: 200,
      color: '#FEF9C3',
      userId: user.id,
      timestamp: Date.now(),
    };
    addStickyNote(note);
    onStickyAdded?.(note);
    toast.success('Added to board');
  }

  if (textCount < 3 && status === 'idle') {
    return (
      <div className="text-center text-gray-400 text-[12px] py-8">
        Not enough content to summarise yet. Add some sticky notes or text first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-gray-400">
        AI reads all sticky notes and text on the board and writes a summary.
      </p>

      {status !== 'success' && (
        <button
          disabled={status === 'loading'}
          onClick={summarise}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white text-[14px] font-semibold h-10 rounded-xl flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          {status === 'loading' ? 'Summarising...' : 'Summarise board'}
        </button>
      )}

      {status === 'empty' && (
        <div className="text-center text-gray-400 text-[12px] py-4">
          Not enough content to summarise.
        </div>
      )}

      {status === 'success' && summary && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">
            Board Summary
          </div>
          <div className="bg-white/8 rounded-xl p-3.5 text-[13px] text-white leading-[1.7]">
            {summary}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={copySummary}
              className="flex items-center gap-1.5 text-[12px] text-gray-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy summary
            </button>
            <button
              onClick={addAsSticky}
              className="flex items-center gap-1.5 text-[12px] text-gray-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              <StickyIcon className="w-3.5 h-3.5" />
              Add as sticky
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
