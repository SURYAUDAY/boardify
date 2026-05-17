import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Link as LinkIcon, Download, Sparkles, Pencil, Users } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useWhiteboardStore } from '../store/whiteboardStore';
import Canvas from '../components/canvas/Canvas';
import CanvasToolbar from '../components/canvas/CanvasToolbar';
import ColorPanel from '../components/canvas/ColorPanel';
import ZoomControls from '../components/canvas/ZoomControls';
import CursorOverlay from '../components/canvas/CursorOverlay';
import DrawingIndicators from '../components/canvas/DrawingIndicators';
import SelectionOverlay from '../components/canvas/SelectionOverlay';
import StickyNotesLayer from '../components/sticky/StickyNotesLayer';
import RoomPanel from '../components/panels/RoomPanel';
import AIPanel from '../components/panels/AIPanel';
import ShareModal from '../components/panels/ShareModal';
import ExportPanel from '../components/panels/ExportPanel';
import EmptyState from '../components/ui/EmptyState';
import CanvasLoadingState from '../components/ui/CanvasLoadingState';
import { useSocket } from '../hooks/useSocket';
import { useHistory } from '../hooks/useHistory';
import { useAutoSave } from '../hooks/useAutoSave';
import type { Tool, Stroke, StickyNote as StickyNoteType, Point, Board } from '@shared/types';

const SHORTCUTS: Record<string, Tool> = {
  v: 'select', p: 'pen', e: 'eraser', l: 'line', a: 'arrow',
  r: 'rect', c: 'circle', t: 'text', s: 'sticky', h: 'pan',
};

const STICKY_COLORS = ['#FEF9C3', '#DCFCE7', '#FCE7F3', '#DBEAFE'];

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function WhiteboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useWhiteboardStore((s) => s.token);
  const user = useWhiteboardStore((s) => s.user);
  const board = useWhiteboardStore((s) => s.board);
  const setBoard = useWhiteboardStore((s) => s.setBoard);
  const strokes = useWhiteboardStore((s) => s.strokes);
  const stickyNotes = useWhiteboardStore((s) => s.stickyNotes);
  const updateStrokes = useWhiteboardStore((s) => s.updateStrokes);
  const setStickyNotes = useWhiteboardStore((s) => s.setStickyNotes);
  const addStickyNote = useWhiteboardStore((s) => s.addStickyNote);
  const setActiveTool = useWhiteboardStore((s) => s.setActiveTool);
  const participants = useWhiteboardStore((s) => s.participants);
  const [loading, setLoading] = useState(true);
  const [roomOpen, setRoomOpen] = useState(false);
  const [aiOpen, setAIOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selection, setSelection] = useState<Bounds | null>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const historyInitialisedRef = useRef(false);

  const { isSaving } = useAutoSave(id);
  const {
    emitCursor,
    emitStrokeAdd,
    emitStrokeDelete,
    emitStrokeStart,
    emitStickyAdd,
    emitStickyUpdate,
    emitStickyDelete,
  } = useSocket(id, user?.id);

  const { addToHistory } = useHistory({
    enableShortcuts: true,
    onApply: (snapshot) => {
      updateStrokes(snapshot);
    },
  });

  // Determine read-only state
  const readOnly = useMemo(() => {
    if (!board) return false;
    const ownerId = typeof board.owner === 'string' ? board.owner : (board.owner as { _id?: string })._id;
    if (user && ownerId === user.id) return false;
    if (user) {
      const collab = (board as Board).collaborators?.find(
        (c) => (typeof c.user === 'string' ? c.user : (c.user as { _id?: string })._id) === user.id
      );
      if (collab) return collab.role === 'viewer';
    }
    // Anonymous or non-collab: view-only unless shareMode === 'edit'
    return board.shareMode !== 'edit';
  }, [board, user]);

  useEffect(() => {
    if (!token && !id) {
      navigate('/login');
      return;
    }
    if (!id) return;

    api.get(`/boards/${id}`)
      .then((res) => {
        setBoard(res.data);
        updateStrokes(res.data.strokes || []);
        setStickyNotes(res.data.stickyNotes || []);
        historyInitialisedRef.current = false;
      })
      .catch(() => {
        if (token) navigate('/dashboard');
        else navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [id, token, navigate, setBoard, updateStrokes, setStickyNotes]);

  useEffect(() => {
    if (loading) return;
    if (historyInitialisedRef.current) return;
    addToHistory(strokes);
    historyInitialisedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey) return;
      const key = e.key.toLowerCase();
      if (SHORTCUTS[key]) {
        setActiveTool(SHORTCUTS[key]);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setActiveTool]);

  function onPointerMove(point: Point) {
    emitCursor(point.x, point.y);
  }

  function onStrokeAdded(stroke: Stroke) {
    emitStrokeStart();
    emitStrokeAdd(stroke);
    addToHistory([...strokes, stroke]);
  }

  function onStrokeDeleted(strokeId: string) {
    emitStrokeDelete(strokeId);
    addToHistory(strokes.filter((s) => s.id !== strokeId));
  }

  function onStickyCreated(point: Point) {
    if (!user) return;
    const note: StickyNoteType = {
      id: nanoid(),
      text: '',
      x: point.x,
      y: point.y,
      width: 200,
      height: 160,
      color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      userId: user.id,
      timestamp: Date.now(),
    };
    addStickyNote(note);
    emitStickyAdd(note);
  }

  if (loading) {
    return <CanvasLoadingState />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#1A1A2E] overflow-hidden">
      {/* Top bar */}
      <div className="h-[52px] bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-[15px] font-semibold text-white">
            {board?.title || 'Untitled'}
          </span>
          {readOnly && (
            <span className="bg-gray-700 text-gray-300 text-[11px] px-2 py-0.5 rounded-full">
              View only
            </span>
          )}
          {isSaving && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-[12px] text-gray-400">Saving...</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setRoomOpen((v) => !v)}
          className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#293548] rounded-full px-3 py-1.5 text-xs text-white"
        >
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span>{participants.length || 1} online</span>
          <Users className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={() => setShareOpen(true)}
              className="w-8 h-8 border border-white/20 rounded-lg text-white hover:bg-white/5 flex items-center justify-center"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          )}
          <button
            ref={exportButtonRef}
            onClick={() => setExportOpen((v) => !v)}
            className="w-8 h-8 border border-white/20 rounded-lg text-white hover:bg-white/5 flex items-center justify-center"
          >
            <Download className="w-4 h-4" />
          </button>
          {!readOnly && (
            <button
              onClick={() => setAIOpen((v) => !v)}
              className="h-8 px-3 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center gap-1.5 text-white text-[13px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI
            </button>
          )}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-grow relative">
        <Canvas
          onPointerMove={onPointerMove}
          onStrokeAdded={onStrokeAdded}
          onStrokeDeleted={onStrokeDeleted}
          onStickyCreated={onStickyCreated}
          onSelectionChanged={setSelection}
          readOnly={readOnly}
        />

        <StickyNotesLayer
          onUpdate={(noteId, partial) => emitStickyUpdate(noteId, partial)}
          onDelete={(noteId) => emitStickyDelete(noteId)}
        />

        <CursorOverlay />

        {selection && id && (
          <SelectionOverlay
            selection={selection}
            boardId={id}
            onClear={() => setSelection(null)}
            onStrokeDeleted={onStrokeDeleted}
          />
        )}

        {strokes.length === 0 && stickyNotes.length === 0 && !readOnly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <EmptyState
              size="subtle"
              icon={<Pencil className="w-10 h-10" />}
              title="Start drawing"
              description="or use AI to generate a diagram"
              action={{
                label: 'Generate diagram →',
                onClick: () => setAIOpen(true),
                variant: 'subtle',
              }}
            />
          </div>
        )}

        <ColorPanel />
        <CanvasToolbar
          readOnly={readOnly}
          onReadOnlyClick={() => toast('View only — cannot edit', { icon: '🔒' })}
        />
        <ZoomControls />
        <DrawingIndicators />
      </div>

      <RoomPanel isOpen={roomOpen} onClose={() => setRoomOpen(false)} />
      {id && (
        <AIPanel
          isOpen={aiOpen}
          onClose={() => setAIOpen(false)}
          boardId={id}
          onStrokeAdded={(s) => emitStrokeAdd(s)}
          onStrokeDeleted={(sid) => emitStrokeDelete(sid)}
          onStickyAdded={(n) => emitStickyAdd(n)}
          onStickyUpdated={(nid, partial) => emitStickyUpdate(nid, partial)}
        />
      )}
      {id && shareOpen && (
        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          boardId={id}
        />
      )}
      {id && (
        <ExportPanel
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          boardId={id}
          boardTitle={board?.title || 'board'}
          shareToken={board?.shareToken}
          anchorRef={exportButtonRef}
        />
      )}
    </div>
  );
}
