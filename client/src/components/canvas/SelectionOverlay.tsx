import { useState } from 'react';
import { Sparkles, Copy, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useWhiteboardStore } from '../../store/whiteboardStore';
import { drawStroke } from '../../lib/canvasUtils';
import { strokeBounds, rectsIntersect } from './Canvas';
import OCRResult from './OCRResult';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  selection: Bounds | null;
  boardId: string;
  onClear: () => void;
  onStrokeDeleted?: (id: string) => void;
}

export default function SelectionOverlay({
  selection,
  boardId,
  onClear,
  onStrokeDeleted,
}: Props) {
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ text: string; confidence: number } | null>(null);
  const strokes = useWhiteboardStore((s) => s.strokes);
  const removeStroke = useWhiteboardStore((s) => s.removeStroke);

  if (!selection) return null;

  const tooSmall = selection.width < 50 || selection.height < 50;

  async function extractText() {
    if (!selection || tooSmall) return;
    setProcessing(true);

    try {
      const dpr = window.devicePixelRatio || 1;
      const off = document.createElement('canvas');
      off.width = selection.width * dpr;
      off.height = selection.height * dpr;
      const ctx = off.getContext('2d');
      if (!ctx) throw new Error('No canvas context');
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, selection.width, selection.height);

      // Draw only strokes intersecting the selection bounds
      ctx.save();
      ctx.translate(-selection.x, -selection.y);
      for (const s of strokes) {
        if (rectsIntersect(strokeBounds(s), selection)) {
          // Force black for OCR contrast
          drawStroke(ctx, { ...s, color: '#000000' });
        }
      }
      ctx.restore();

      const dataUrl = off.toDataURL('image/png');
      const res = await api.post('/ai/ocr', { imageBase64: dataUrl, boardId });
      setOcrResult(res.data);
    } catch {
      toast.error('Could not extract text');
    } finally {
      setProcessing(false);
    }
  }

  function copyRegion() {
    if (!selection) return;
    const dpr = window.devicePixelRatio || 1;
    const off = document.createElement('canvas');
    off.width = selection.width * dpr;
    off.height = selection.height * dpr;
    const ctx = off.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, selection.width, selection.height);
    ctx.translate(-selection.x, -selection.y);
    for (const s of strokes) {
      if (rectsIntersect(strokeBounds(s), selection)) {
        drawStroke(ctx, s);
      }
    }
    off.toBlob((blob) => {
      if (!blob) return;
      try {
        const item = new (window as unknown as { ClipboardItem: typeof ClipboardItem }).ClipboardItem(
          { 'image/png': blob }
        );
        navigator.clipboard.write([item]);
        toast.success('Copied region');
      } catch {
        toast.error('Clipboard image copy not supported');
      }
    });
  }

  function deleteSelection() {
    if (!selection) return;
    let count = 0;
    for (const s of strokes) {
      if (rectsIntersect(strokeBounds(s), selection)) {
        removeStroke(s.id);
        onStrokeDeleted?.(s.id);
        count++;
      }
    }
    if (count > 0) toast.success(`Deleted ${count} item${count === 1 ? '' : 's'}`);
    onClear();
  }

  return (
    <>
      <div
        className="absolute pointer-events-none"
        style={{
          left: selection.x,
          top: selection.y,
          width: selection.width,
          height: selection.height,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            border: '2px dashed #6366F1',
            background: 'rgba(99, 102, 241, 0.08)',
          }}
        />
        {/* Corner handles */}
        {[
          { left: 0, top: 0 },
          { right: 0, top: 0 },
          { left: 0, bottom: 0 },
          { right: 0, bottom: 0 },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white border-2 border-indigo-500"
            style={{ ...pos, transform: 'translate(-50%, -50%)' }}
          />
        ))}

        {processing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A2E]/70">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-[12px] mt-2">Reading handwriting...</span>
          </div>
        )}
      </div>

      {/* Floating toolbar above selection */}
      <div
        className="absolute pointer-events-auto"
        style={{
          left: selection.x + selection.width / 2,
          top: selection.y - 12,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="bg-white rounded-full shadow-lg p-2 flex items-center gap-1">
          <button
            disabled={tooSmall || processing}
            onClick={extractText}
            className="flex items-center gap-1.5 px-3 h-8 rounded-full text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-[13px] font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Extract text
          </button>
          <span className="w-px h-5 bg-gray-200" />
          <button
            onClick={copyRegion}
            className="text-gray-500 hover:text-gray-700 p-1.5"
            title="Copy region"
          >
            <Copy className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-gray-200" />
          <button
            onClick={deleteSelection}
            className="text-gray-400 hover:text-red-500 p-1.5"
            title="Delete selection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {ocrResult && (
        <OCRResult
          result={ocrResult}
          selectionBounds={selection}
          onClose={() => {
            setOcrResult(null);
            onClear();
          }}
        />
      )}
    </>
  );
}
