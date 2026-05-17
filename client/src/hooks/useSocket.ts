import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { socket, connectToBoard } from '../lib/socket';
import { useWhiteboardStore } from '../store/whiteboardStore';
import type { Stroke, StickyNote } from '@shared/types';

interface SocketUser {
  userId: string;
  name: string;
  avatar: string;
}

export function useSocket(boardId: string | undefined, currentUserId: string | undefined) {
  const lastEmitRef = useRef<number>(0);

  const setCursor = useWhiteboardStore((s) => s.setCursor);
  const removeCursor = useWhiteboardStore((s) => s.removeCursor);
  const pruneCursors = useWhiteboardStore((s) => s.pruneCursors);
  const setParticipants = useWhiteboardStore((s) => s.setParticipants);
  const addParticipant = useWhiteboardStore((s) => s.addParticipant);
  const removeParticipant = useWhiteboardStore((s) => s.removeParticipant);
  const addStroke = useWhiteboardStore((s) => s.addStroke);
  const removeStroke = useWhiteboardStore((s) => s.removeStroke);
  const addStickyNote = useWhiteboardStore((s) => s.addStickyNote);
  const updateStickyNote = useWhiteboardStore((s) => s.updateStickyNote);
  const removeStickyNote = useWhiteboardStore((s) => s.removeStickyNote);
  const setDrawingIndicator = useWhiteboardStore((s) => s.setDrawingIndicator);
  const pruneDrawingIndicators = useWhiteboardStore((s) => s.pruneDrawingIndicators);

  useEffect(() => {
    if (!boardId || !currentUserId) return;
    const token = localStorage.getItem('wb_token');
    if (!token) return;

    connectToBoard(token, boardId);

    function onRoomUsers(users: SocketUser[]) {
      const list = users.map((u) => ({
        userId: u.userId,
        name: u.name,
        avatar: u.avatar,
        status: 'online' as const,
        isCurrentUser: u.userId === currentUserId,
        lastActivity: Date.now(),
      }));
      setParticipants(list);
    }

    function onUserJoined(u: SocketUser) {
      addParticipant({
        userId: u.userId,
        name: u.name,
        avatar: u.avatar,
        status: 'online',
        isCurrentUser: u.userId === currentUserId,
        lastActivity: Date.now(),
      });
    }

    function onUserLeft({ userId }: { userId: string }) {
      removeParticipant(userId);
      removeCursor(userId);
    }

    function onCursorMove(data: {
      userId: string;
      name: string;
      avatar: string;
      x: number;
      y: number;
      timestamp: number;
    }) {
      if (data.userId === currentUserId) return;
      setCursor({
        userId: data.userId,
        name: data.name,
        avatar: data.avatar,
        x: data.x,
        y: data.y,
        lastSeen: Date.now(),
      });
    }

    function onStrokeAdd(stroke: Stroke) {
      if (stroke.userId === currentUserId) return;
      addStroke(stroke);
    }

    function onStrokeDelete({ strokeId }: { strokeId: string }) {
      removeStroke(strokeId);
    }

    function onStrokeStart(data: { userId: string; name: string; avatar: string }) {
      if (data.userId === currentUserId) return;
      setDrawingIndicator({ ...data, lastSeen: Date.now() });
    }

    function onStickyAdd(note: StickyNote) {
      if (note.userId === currentUserId) return;
      addStickyNote(note);
    }

    function onStickyUpdate({ id, partial }: { id: string; partial: Partial<StickyNote> }) {
      updateStickyNote(id, partial);
    }

    function onStickyMove({ id, x, y }: { id: string; x: number; y: number }) {
      updateStickyNote(id, { x, y });
    }

    function onStickyDelete({ id }: { id: string }) {
      removeStickyNote(id);
    }

    function onDisconnect() {
      toast.loading('Connection lost — trying to reconnect...', { id: 'socket-reconnect' });
    }

    function onConnect() {
      toast.dismiss('socket-reconnect');
    }

    function onReconnect() {
      toast.dismiss('socket-reconnect');
      toast.success('Reconnected', { id: 'socket-reconnect' });
    }

    socket.on('room:users', onRoomUsers);
    socket.on('user:joined', onUserJoined);
    socket.on('user:left', onUserLeft);
    socket.on('cursor:move', onCursorMove);
    socket.on('stroke:add', onStrokeAdd);
    socket.on('stroke:delete', onStrokeDelete);
    socket.on('stroke:start', onStrokeStart);
    socket.on('sticky:add', onStickyAdd);
    socket.on('sticky:update', onStickyUpdate);
    socket.on('sticky:move', onStickyMove);
    socket.on('sticky:delete', onStickyDelete);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);
    socket.io.on('reconnect', onReconnect);

    const interval = setInterval(() => {
      pruneCursors(5000);
      pruneDrawingIndicators(2000);
    }, 1000);

    return () => {
      socket.emit('board:leave');
      socket.off('room:users', onRoomUsers);
      socket.off('user:joined', onUserJoined);
      socket.off('user:left', onUserLeft);
      socket.off('cursor:move', onCursorMove);
      socket.off('stroke:add', onStrokeAdd);
      socket.off('stroke:delete', onStrokeDelete);
      socket.off('stroke:start', onStrokeStart);
      socket.off('sticky:add', onStickyAdd);
      socket.off('sticky:update', onStickyUpdate);
      socket.off('sticky:move', onStickyMove);
      socket.off('sticky:delete', onStickyDelete);
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
      socket.io.off('reconnect', onReconnect);
      clearInterval(interval);
    };
  }, [
    boardId,
    currentUserId,
    setCursor,
    removeCursor,
    pruneCursors,
    setParticipants,
    addParticipant,
    removeParticipant,
    addStroke,
    removeStroke,
    addStickyNote,
    updateStickyNote,
    removeStickyNote,
    setDrawingIndicator,
    pruneDrawingIndicators,
  ]);

  function emitCursor(x: number, y: number) {
    const now = Date.now();
    if (now - lastEmitRef.current < 50) return;
    lastEmitRef.current = now;
    if (socket.connected) socket.emit('cursor:move', { x, y });
  }

  function emitStrokeAdd(stroke: Stroke) {
    if (socket.connected) socket.emit('stroke:add', stroke);
  }

  function emitStrokeDelete(strokeId: string) {
    if (socket.connected) socket.emit('stroke:delete', { strokeId });
  }

  function emitStrokeStart() {
    if (socket.connected) socket.emit('stroke:start');
  }

  function emitStickyAdd(note: StickyNote) {
    if (socket.connected) socket.emit('sticky:add', note);
  }

  function emitStickyUpdate(id: string, partial: Partial<StickyNote>) {
    if (socket.connected) socket.emit('sticky:update', { id, partial });
  }

  function emitStickyDelete(id: string) {
    if (socket.connected) socket.emit('sticky:delete', { id });
  }

  return {
    emitCursor,
    emitStrokeAdd,
    emitStrokeDelete,
    emitStrokeStart,
    emitStickyAdd,
    emitStickyUpdate,
    emitStickyDelete,
  };
}
