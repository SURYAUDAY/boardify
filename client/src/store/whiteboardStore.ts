import { create } from 'zustand';
import type { User, Stroke, StickyNote, Board, Tool } from '@shared/types';
import { disconnectSocket } from '../lib/socket';

export interface RemoteCursor {
  userId: string;
  name: string;
  avatar: string;
  x: number;
  y: number;
  lastSeen: number;
}

export interface Participant {
  userId: string;
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'offline';
  isCurrentUser?: boolean;
  lastActivity: number;
}

export interface DrawingIndicator {
  userId: string;
  name: string;
  avatar: string;
  lastSeen: number;
}

interface WhiteboardState {
  // Auth
  user: User | null;
  token: string | null;
  setUser: (user: User, token: string) => void;
  logout: () => void;

  // Board
  board: Board | null;
  setBoard: (board: Board | null) => void;

  // Canvas tools
  activeTool: Tool;
  activeColor: string;
  strokeWidth: number;
  setActiveTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setStrokeWidth: (w: number) => void;

  // Strokes & sticky notes
  strokes: Stroke[];
  stickyNotes: StickyNote[];
  addStroke: (stroke: Stroke) => void;
  removeStroke: (id: string) => void;
  updateStrokes: (strokes: Stroke[]) => void;
  setStickyNotes: (notes: StickyNote[]) => void;
  addStickyNote: (note: StickyNote) => void;
  updateStickyNote: (id: string, partial: Partial<StickyNote>) => void;
  removeStickyNote: (id: string) => void;

  // Viewport
  zoom: number;
  panX: number;
  panY: number;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  resetViewport: () => void;

  // Realtime
  cursors: Record<string, RemoteCursor>;
  setCursor: (cursor: RemoteCursor) => void;
  removeCursor: (userId: string) => void;
  pruneCursors: (olderThanMs: number) => void;

  participants: Participant[];
  setParticipants: (p: Participant[]) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (userId: string) => void;

  drawingIndicators: Record<string, DrawingIndicator>;
  setDrawingIndicator: (d: DrawingIndicator) => void;
  pruneDrawingIndicators: (olderThanMs: number) => void;
}

const initialUser = (): { user: User | null; token: string | null } => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('wb_token') : null;
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('wb_user') : null;
  return {
    token,
    user: userJson ? JSON.parse(userJson) : null,
  };
};

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  ...initialUser(),
  setUser: (user, token) => {
    localStorage.setItem('wb_token', token);
    localStorage.setItem('wb_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('wb_token');
    localStorage.removeItem('wb_user');
    disconnectSocket();
    set({
      user: null,
      token: null,
      board: null,
      strokes: [],
      stickyNotes: [],
      cursors: {},
      participants: [],
      drawingIndicators: {},
    });
  },

  board: null,
  setBoard: (board) => set({ board }),

  activeTool: 'pen',
  activeColor: '#FFFFFF',
  strokeWidth: 3,
  setActiveTool: (activeTool) => set({ activeTool }),
  setColor: (activeColor) => set({ activeColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),

  strokes: [],
  stickyNotes: [],
  addStroke: (stroke) =>
    set((s) =>
      s.strokes.some((x) => x.id === stroke.id)
        ? s
        : { strokes: [...s.strokes, stroke] }
    ),
  removeStroke: (id) => set((s) => ({ strokes: s.strokes.filter((x) => x.id !== id) })),
  updateStrokes: (strokes) => set({ strokes }),
  setStickyNotes: (stickyNotes) => set({ stickyNotes }),
  addStickyNote: (note) =>
    set((s) =>
      s.stickyNotes.some((n) => n.id === note.id)
        ? s
        : { stickyNotes: [...s.stickyNotes, note] }
    ),
  updateStickyNote: (id, partial) =>
    set((s) => ({
      stickyNotes: s.stickyNotes.map((n) => (n.id === id ? { ...n, ...partial } : n)),
    })),
  removeStickyNote: (id) =>
    set((s) => ({ stickyNotes: s.stickyNotes.filter((n) => n.id !== id) })),

  zoom: 1,
  panX: 0,
  panY: 0,
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  resetViewport: () => set({ zoom: 1, panX: 0, panY: 0 }),

  cursors: {},
  setCursor: (cursor) =>
    set((s) => ({ cursors: { ...s.cursors, [cursor.userId]: cursor } })),
  removeCursor: (userId) =>
    set((s) => {
      const next = { ...s.cursors };
      delete next[userId];
      return { cursors: next };
    }),
  pruneCursors: (olderThanMs) =>
    set((s) => {
      const cutoff = Date.now() - olderThanMs;
      const next: Record<string, RemoteCursor> = {};
      for (const [k, v] of Object.entries(s.cursors)) {
        if (v.lastSeen >= cutoff) next[k] = v;
      }
      return { cursors: next };
    }),

  participants: [],
  setParticipants: (participants) => set({ participants }),
  addParticipant: (p) =>
    set((s) =>
      s.participants.some((x) => x.userId === p.userId)
        ? s
        : { participants: [...s.participants, p] }
    ),
  removeParticipant: (userId) =>
    set((s) => ({ participants: s.participants.filter((p) => p.userId !== userId) })),

  drawingIndicators: {},
  setDrawingIndicator: (d) =>
    set((s) => ({ drawingIndicators: { ...s.drawingIndicators, [d.userId]: d } })),
  pruneDrawingIndicators: (olderThanMs) =>
    set((s) => {
      const cutoff = Date.now() - olderThanMs;
      const next: Record<string, DrawingIndicator> = {};
      for (const [k, v] of Object.entries(s.drawingIndicators)) {
        if (v.lastSeen >= cutoff) next[k] = v;
      }
      return { drawingIndicators: next };
    }),
}));
