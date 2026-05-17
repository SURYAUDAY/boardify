import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Code, Link as LinkIcon, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useWhiteboardStore } from '../../store/whiteboardStore';
import { redrawAll } from '../../lib/canvasUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  boardTitle: string;
  shareToken?: string;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

type BgMode = 'transparent' | 'white' | 'dark';

function slugify(s: string): string {
  return s.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): { lines: string[]; lineHeight: number } {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return { lines, lineHeight };
}

function drawBoardToCanvas(opts: {
  width: number;
  height: number;
  scale: number;
  bgMode: BgMode;
  includeStickies: boolean;
  strokes: import('@shared/types').Stroke[];
  stickyNotes: import('@shared/types').StickyNote[];
}): HTMLCanvasElement {
  const off = document.createElement('canvas');
  off.width = opts.width * opts.scale;
  off.height = opts.height * opts.scale;
  const ctx = off.getContext('2d')!;
  ctx.scale(opts.scale, opts.scale);

  if (opts.bgMode === 'white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, opts.width, opts.height);
  } else if (opts.bgMode === 'dark') {
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, opts.width, opts.height);
  }

  redrawAll(ctx, opts.strokes, opts.width, opts.height);

  if (opts.includeStickies) {
    for (const n of opts.stickyNotes) {
      ctx.fillStyle = n.color;
      ctx.fillRect(n.x, n.y, n.width, n.height);
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.strokeRect(n.x, n.y, n.width, n.height);

      ctx.fillStyle = '#1F2937';
      ctx.font = '14px Inter, sans-serif';
      const padding = 12;
      const { lines } = wrapText(ctx, n.text || '', n.width - padding * 2, 18);
      let y = n.y + padding + 14;
      for (const line of lines) {
        if (y > n.y + n.height - padding) break;
        ctx.fillText(line, n.x + padding, y);
        y += 18;
      }
    }
  }

  return off;
}

export default function ExportPanel({
  isOpen,
  onClose,
  boardId,
  boardTitle,
  shareToken,
  anchorRef,
}: Props) {
  const [showPngModal, setShowPngModal] = useState(false);
  const [bgMode, setBgMode] = useState<BgMode>('white');
  const [includeStickies, setIncludeStickies] = useState(true);
  const [scale, setScale] = useState<1 | 2 | 4>(2);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const strokes = useWhiteboardStore((s) => s.strokes);
  const stickyNotes = useWhiteboardStore((s) => s.stickyNotes);

  // Position dropdown beneath the anchor button
  useEffect(() => {
    if (!isOpen || !anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 8, left: rect.left - 200 });
  }, [isOpen, anchorRef]);

  // Render preview thumbnail when modal is open
  useEffect(() => {
    if (!showPngModal || !previewRef.current) return;
    const canvas = previewRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (bgMode === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    } else if (bgMode === 'dark') {
      ctx.fillStyle = '#1A1A2E';
      ctx.fillRect(0, 0, w, h);
    }

    // Compute bounding box of content for fit-scale
    const contentWidth = window.innerWidth;
    const contentHeight = window.innerHeight;
    const fit = Math.min(w / contentWidth, h / contentHeight);
    ctx.save();
    ctx.scale(fit, fit);
    redrawAll(ctx, strokes, contentWidth, contentHeight);
    if (includeStickies) {
      for (const n of stickyNotes) {
        ctx.fillStyle = n.color;
        ctx.fillRect(n.x, n.y, n.width, n.height);
      }
    }
    ctx.restore();
  }, [showPngModal, bgMode, includeStickies, strokes, stickyNotes]);

  function downloadPng(useDefaults = false) {
    const opts = useDefaults
      ? { bgMode: 'white' as BgMode, includeStickies: true, scale: 2 as const }
      : { bgMode, includeStickies, scale };

    const canvas = drawBoardToCanvas({
      width: window.innerWidth,
      height: window.innerHeight,
      scale: opts.scale,
      bgMode: opts.bgMode,
      includeStickies: opts.includeStickies,
      strokes,
      stickyNotes,
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `${slugify(boardTitle || 'board')}-${date}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PNG exported');
      setShowPngModal(false);
      onClose();
    }, 'image/png');
  }

  async function exportJson() {
    try {
      const res = await api.get(`/boards/${boardId}`);
      const json = JSON.stringify(res.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugify(boardTitle || 'board')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('JSON exported');
      onClose();
    } catch {
      toast.error('Could not export JSON');
    }
  }

  function copyShareLink() {
    if (!shareToken) {
      toast.error('No share token available');
      return;
    }
    const url = `${window.location.origin}/board/${shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
    onClose();
  }

  // Cmd/Ctrl+E shortcut for quick PNG download
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        downloadPng(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, stickyNotes, boardTitle]);

  if (!isOpen && !showPngModal) return null;

  return (
    <>
      {isOpen && !showPngModal && (
        <div
          ref={dropdownRef}
          className="fixed z-40 bg-white rounded-xl shadow-xl w-[240px] p-2"
          style={{ top: position.top, left: position.left }}
        >
          <div className="text-[13px] font-semibold text-gray-700 px-2 mb-1.5">
            Export board
          </div>
          <button
            onClick={() => setShowPngModal(true)}
            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
          >
            <ImageIcon className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div className="flex-grow">
              <div className="text-[14px] text-gray-700">Export as PNG</div>
              <div className="text-[12px] text-gray-400">Current viewport as image</div>
            </div>
            <span className="text-[11px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 ml-auto">
              ⌘E
            </span>
          </button>
          <div className="border-t border-gray-100" />
          <button
            onClick={exportJson}
            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
          >
            <Code className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-[14px] text-gray-700">Export as JSON</div>
              <div className="text-[12px] text-gray-400">Full board data for backup</div>
            </div>
          </button>
          <div className="border-t border-gray-100" />
          <button
            onClick={copyShareLink}
            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
          >
            <LinkIcon className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div>
              <div className="text-[14px] text-gray-700">Copy share link</div>
              <div className="text-[12px] text-gray-400">Anyone with link can view</div>
            </div>
          </button>
        </div>
      )}

      {showPngModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => {
            setShowPngModal(false);
            onClose();
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[480px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold text-[#1E293B]">Export as PNG</h3>
              <button
                onClick={() => {
                  setShowPngModal(false);
                  onClose();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <canvas
              ref={previewRef}
              width={432}
              height={200}
              className="bg-gray-100 rounded-xl w-full"
            />

            <div className="space-y-3.5 mt-4">
              <div>
                <div className="text-[13px] font-semibold text-gray-700 mb-1.5">
                  Background
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {(['transparent', 'white', 'dark'] as BgMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setBgMode(m)}
                      className={`flex-1 h-9 rounded-md text-[13px] capitalize ${
                        bgMode === m
                          ? 'bg-indigo-500 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-[13px] text-gray-700">
                <input
                  type="checkbox"
                  checked={includeStickies}
                  onChange={(e) => setIncludeStickies(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
                Include sticky notes
              </label>

              <div>
                <div className="text-[13px] font-semibold text-gray-700 mb-1.5">Scale</div>
                <select
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value) as 1 | 2 | 4)}
                  className="w-full h-9 border border-gray-300 rounded-lg px-2 text-[13px] text-gray-700 bg-white"
                >
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowPngModal(false);
                  onClose();
                }}
                className="text-gray-700 hover:bg-gray-100 px-4 h-10 rounded-lg text-[14px]"
              >
                Cancel
              </button>
              <button
                onClick={() => downloadPng(false)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 h-10 rounded-lg text-[14px] flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
