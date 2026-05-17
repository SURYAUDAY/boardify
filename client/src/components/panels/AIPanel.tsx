import { useRef, useState } from 'react';
import { Sparkles, X, CheckCircle, XCircle } from 'lucide-react';
import { nanoid } from 'nanoid';
import api from '../../lib/api';
import { useWhiteboardStore } from '../../store/whiteboardStore';
import AISummariseTab from './AISummariseTab';
import AIOrganiseTab from './AIOrganiseTab';
import type { Stroke, StickyNote } from '@shared/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  onStrokeAdded?: (stroke: Stroke) => void;
  onStrokeDeleted?: (strokeId: string) => void;
  onStickyAdded?: (note: StickyNote) => void;
  onStickyUpdated?: (id: string, partial: Partial<StickyNote>) => void;
}

interface AIShape {
  id: string;
  type: 'rect' | 'diamond' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color?: string;
  borderColor?: string;
}

interface AIConnection {
  from: string;
  to: string;
  label?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';
type Tab = 'diagram' | 'summarise' | 'organise';

const CHIPS = ['Login flow', 'CRUD API flow', 'User onboarding'];

export default function AIPanel({
  isOpen,
  onClose,
  boardId,
  onStrokeAdded,
  onStrokeDeleted,
  onStickyAdded,
  onStickyUpdated,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('diagram');
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ shapeCount: number; generationId: string } | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addStroke = useWhiteboardStore((s) => s.addStroke);
  const removeStroke = useWhiteboardStore((s) => s.removeStroke);
  const strokes = useWhiteboardStore((s) => s.strokes);
  const user = useWhiteboardStore((s) => s.user);

  function shapeToStroke(shape: AIShape, generationId: string): Stroke {
    const tool = shape.type === 'circle' ? 'circle' : 'rect';
    const points =
      shape.type === 'circle'
        ? [
            { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 },
            { x: shape.x + shape.width, y: shape.y + shape.height / 2 },
          ]
        : [
            { x: shape.x, y: shape.y },
            { x: shape.x + shape.width, y: shape.y + shape.height },
          ];
    const stroke: Stroke = {
      id: nanoid(),
      tool,
      points,
      color: shape.borderColor || '#6366F1',
      strokeWidth: 2,
      userId: user?.id || 'ai',
      timestamp: Date.now(),
      text: shape.label,
      generationId,
    };
    if (shape.type === 'diamond') stroke.shapeVariant = 'diamond';
    return stroke;
  }

  function connectionToStroke(
    conn: AIConnection,
    shapeMap: Map<string, AIShape>,
    generationId: string
  ): Stroke | null {
    const from = shapeMap.get(conn.from);
    const to = shapeMap.get(conn.to);
    if (!from || !to) return null;
    return {
      id: nanoid(),
      tool: 'arrow',
      points: [
        { x: from.x + from.width / 2, y: from.y + from.height },
        { x: to.x + to.width / 2, y: to.y },
      ],
      color: '#94A3B8',
      strokeWidth: 2,
      userId: user?.id || 'ai',
      timestamp: Date.now(),
      generationId,
    };
  }

  async function generate() {
    if (!prompt.trim()) return;
    setStatus('loading');
    setError(null);
    try {
      const res = await api.post('/ai/diagram', { prompt: prompt.trim(), boardId });
      const { shapes, connections, generationId } = res.data as {
        shapes: AIShape[];
        connections: AIConnection[];
        generationId: string;
      };

      const shapeMap = new Map<string, AIShape>();
      for (const s of shapes) shapeMap.set(s.id, s);

      let count = 0;
      for (const shape of shapes) {
        const stroke = shapeToStroke(shape, generationId);
        addStroke(stroke);
        onStrokeAdded?.(stroke);
        count++;
      }
      for (const conn of connections) {
        const stroke = connectionToStroke(conn, shapeMap, generationId);
        if (stroke) {
          addStroke(stroke);
          onStrokeAdded?.(stroke);
        }
      }

      setResult({ shapeCount: count, generationId });
      setStatus('success');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not reach the AI service.';
      setError(message);
      setStatus('error');
    }
  }

  function undoDiagram() {
    if (!result) return;
    const toRemove = strokes.filter((s) => s.generationId === result.generationId);
    for (const s of toRemove) {
      removeStroke(s.id);
      onStrokeDeleted?.(s.id);
    }
    setResult(null);
    setStatus('idle');
  }

  function askFollowUp() {
    setStatus('idle');
    setResult(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function selectChip(chip: string) {
    setPrompt(chip);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  return (
    <div
      className={`fixed top-[52px] right-0 bottom-0 w-[360px] bg-[#1E293B] border-l border-[#334155] rounded-l-xl shadow-2xl z-30 transition-transform duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="h-[52px] px-4 border-b border-[#334155] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span className="text-white text-[15px] font-semibold">Boardify AI</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex h-11 border-b border-[#334155] flex-shrink-0">
        {(['diagram', 'summarise', 'organise'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 capitalize text-[13px] transition ${
              activeTab === t
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-gray-400 hover:text-white border-b-2 border-transparent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 overflow-y-auto flex-grow">
        {activeTab === 'summarise' && (
          <AISummariseTab boardId={boardId} onStickyAdded={onStickyAdded} />
        )}
        {activeTab === 'organise' && (
          <AIOrganiseTab onStickyUpdated={onStickyUpdated} />
        )}

        {activeTab === 'diagram' && status === 'idle' && (
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">
              Describe a diagram
            </div>
            <textarea
              ref={textareaRef}
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Draw a user login flow with Google OAuth option..."
              className="w-full resize-none rounded-xl border border-[#334155] bg-[#0F172A] text-white text-[14px] p-3 outline-none focus:border-indigo-500"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => selectChip(chip)}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-[12px] rounded-full px-3 py-1.5"
                >
                  {chip}
                </button>
              ))}
            </div>
            <button
              disabled={!prompt.trim()}
              onClick={generate}
              className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-[14px] font-semibold h-10 rounded-xl flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate diagram →
            </button>
          </div>
        )}

        {activeTab === 'diagram' && status === 'loading' && (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
            <div className="text-white text-[14px] font-semibold mt-3">
              Generating diagram...
            </div>
            <div className="text-gray-400 text-[12px] mt-1">
              Placing shapes on your canvas
            </div>
          </div>
        )}

        {activeTab === 'diagram' && status === 'success' && result && (
          <div className="text-center py-6">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
            <div className="text-white text-[14px] font-semibold mt-3">
              Diagram added to canvas!
            </div>
            <div className="text-gray-400 text-[12px] mt-1">{result.shapeCount} shapes</div>
            <div className="flex gap-2 mt-4 justify-center">
              <button
                onClick={undoDiagram}
                className="border border-white/20 text-white text-[13px] h-8 px-3 rounded-lg hover:bg-white/5"
              >
                Undo diagram
              </button>
              <button
                onClick={askFollowUp}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-[13px] h-8 px-3 rounded-lg"
              >
                Ask follow-up
              </button>
            </div>
          </div>
        )}

        {activeTab === 'diagram' && status === 'error' && (
          <div className="text-center py-6">
            <XCircle className="w-8 h-8 text-red-500 mx-auto" />
            <div className="text-white text-[14px] font-semibold mt-3">
              Couldn't generate a diagram
            </div>
            <div className="text-gray-400 text-[12px] mt-1">{error}</div>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 border border-white/20 text-white text-[13px] h-8 px-3 rounded-lg hover:bg-white/5"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
