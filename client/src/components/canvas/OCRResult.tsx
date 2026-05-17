import { Sparkles } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { useWhiteboardStore } from '../../store/whiteboardStore';
import type { StickyNote } from '@shared/types';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  result: { text: string; confidence: number };
  selectionBounds: Bounds;
  onClose: () => void;
  onStickyAdded?: (note: StickyNote) => void;
}

export default function OCRResult({ result, selectionBounds, onClose, onStickyAdded }: Props) {
  const addStickyNote = useWhiteboardStore((s) => s.addStickyNote);
  const user = useWhiteboardStore((s) => s.user);

  const isEmpty = !result.text || result.text.trim().length === 0;
  const conf = Math.round(result.confidence * 100);
  const confColor = conf > 90 ? '#16A34A' : conf >= 70 ? '#CA8A04' : '#DC2626';

  function addAsSticky() {
    if (!user || isEmpty) return;
    const note: StickyNote = {
      id: nanoid(),
      text: result.text,
      x: selectionBounds.x,
      y: selectionBounds.y,
      width: Math.max(180, selectionBounds.width),
      height: Math.max(120, selectionBounds.height),
      color: '#FEF9C3',
      userId: user.id,
      timestamp: Date.now(),
    };
    addStickyNote(note);
    onStickyAdded?.(note);
    toast.success('Added as sticky');
    onClose();
  }

  function copyText() {
    if (isEmpty) return;
    navigator.clipboard.writeText(result.text);
    toast.success('Copied');
  }

  return (
    <div
      className="absolute bg-white rounded-xl shadow-xl p-4 pointer-events-auto"
      style={{
        left: selectionBounds.x,
        top: selectionBounds.y + selectionBounds.height + 12,
        width: 280,
        zIndex: 50,
      }}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <span className="text-[14px] font-semibold text-[#1E293B]">Extracted text</span>
      </div>

      {isEmpty ? (
        <div className="text-[12px] text-gray-500">
          No text found in that region. Try a clearer drawing or a larger selection.
        </div>
      ) : (
        <>
          <div className="bg-gray-50 rounded-lg p-3 text-[13px] text-gray-700 leading-[1.5]">
            {result.text}
          </div>
          <div className="text-[12px] mt-2" style={{ color: confColor }}>
            Confidence: {conf}%
          </div>
        </>
      )}

      <div className="flex gap-2 mt-3">
        {!isEmpty && (
          <>
            <button
              onClick={addAsSticky}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-[13px] h-8 px-3 rounded-lg"
            >
              Add as sticky note
            </button>
            <button
              onClick={copyText}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-[13px] h-8 px-3 rounded-lg"
            >
              Copy text
            </button>
          </>
        )}
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-[13px] h-8 px-3 rounded-lg ml-auto"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
