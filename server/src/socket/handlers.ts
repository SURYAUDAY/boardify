import { Server, Socket } from 'socket.io';
import Board from '../models/Board';
import User from '../models/User';

interface ConnectedUser {
  userId: string;
  socketId: string;
  name: string;
  avatar: string;
}

const rooms = new Map<string, Map<string, ConnectedUser>>();

function roomName(boardId: string) {
  return `board:${boardId}`;
}

function listUsers(boardId: string): ConnectedUser[] {
  const m = rooms.get(boardId);
  if (!m) return [];
  return Array.from(m.values());
}

async function userHasAccess(boardId: string, userId: string): Promise<boolean> {
  try {
    const board = await Board.findById(boardId);
    if (!board) return false;
    if (String(board.owner) === userId) return true;
    if (board.collaborators.some((c) => String(c.user) === userId)) return true;
    if (board.shareMode !== 'none') return true;
    return false;
  } catch {
    return false;
  }
}

export function registerSocketHandlers(io: Server) {
  io.on('connection', async (socket: Socket) => {
    const auth = socket.data.user as { id: string; email: string } | undefined;
    const boardId = (socket.handshake.query.boardId as string) || undefined;

    if (!auth || !boardId) {
      socket.disconnect();
      return;
    }

    const hasAccess = await userHasAccess(boardId, auth.id);
    if (!hasAccess) {
      socket.emit('error', { message: 'Access denied' });
      socket.disconnect();
      return;
    }

    let userDoc;
    try {
      userDoc = await User.findById(auth.id).lean();
    } catch {
      socket.disconnect();
      return;
    }
    if (!userDoc) {
      socket.disconnect();
      return;
    }

    const me: ConnectedUser = {
      userId: auth.id,
      socketId: socket.id,
      name: userDoc.name,
      avatar: userDoc.avatar,
    };

    socket.data.boardId = boardId;
    socket.data.me = me;

    socket.join(roomName(boardId));
    if (!rooms.has(boardId)) rooms.set(boardId, new Map());
    rooms.get(boardId)!.set(socket.id, me);

    // Send full list to the new socket
    socket.emit('room:users', listUsers(boardId));
    // Tell others
    socket.to(roomName(boardId)).emit('user:joined', me);

    // ---- Cursor ----
    socket.on('cursor:move', ({ x, y }: { x: number; y: number }) => {
      socket.to(roomName(boardId)).emit('cursor:move', {
        userId: me.userId,
        name: me.name,
        avatar: me.avatar,
        x,
        y,
        timestamp: Date.now(),
      });
    });

    // ---- Strokes ----
    socket.on('stroke:start', () => {
      socket.to(roomName(boardId)).emit('stroke:start', {
        userId: me.userId,
        name: me.name,
        avatar: me.avatar,
      });
    });

    socket.on('stroke:add', async (stroke) => {
      try {
        if (!stroke || !stroke.id || !stroke.tool) return;
        await Board.findByIdAndUpdate(boardId, { $push: { strokes: stroke } });
        socket.to(roomName(boardId)).emit('stroke:add', stroke);
      } catch (err) {
        socket.emit('error', { message: 'Failed to save stroke' });
      }
    });

    socket.on('stroke:delete', async ({ strokeId }: { strokeId: string }) => {
      try {
        if (!strokeId) return;
        await Board.findByIdAndUpdate(boardId, { $pull: { strokes: { id: strokeId } } });
        socket.to(roomName(boardId)).emit('stroke:delete', { strokeId });
      } catch {
        socket.emit('error', { message: 'Failed to delete stroke' });
      }
    });

    // ---- Sticky notes ----
    socket.on('sticky:add', async (note) => {
      try {
        if (!note?.id) return;
        await Board.findByIdAndUpdate(boardId, { $push: { stickyNotes: note } });
        socket.to(roomName(boardId)).emit('sticky:add', note);
      } catch {
        socket.emit('error', { message: 'Failed to add note' });
      }
    });

    socket.on(
      'sticky:update',
      async ({ id, partial }: { id: string; partial: Record<string, unknown> }) => {
        try {
          if (!id) return;
          const setUpdates: Record<string, unknown> = {};
          for (const key of Object.keys(partial || {})) {
            setUpdates[`stickyNotes.$.${key}`] = partial[key];
          }
          await Board.updateOne(
            { _id: boardId, 'stickyNotes.id': id },
            { $set: setUpdates }
          );
          socket.to(roomName(boardId)).emit('sticky:update', { id, partial });
        } catch {
          socket.emit('error', { message: 'Failed to update note' });
        }
      }
    );

    socket.on('sticky:move', async ({ id, x, y }: { id: string; x: number; y: number }) => {
      try {
        if (!id) return;
        await Board.updateOne(
          { _id: boardId, 'stickyNotes.id': id },
          { $set: { 'stickyNotes.$.x': x, 'stickyNotes.$.y': y } }
        );
        socket.to(roomName(boardId)).emit('sticky:move', { id, x, y });
      } catch {
        socket.emit('error', { message: 'Failed to move note' });
      }
    });

    socket.on('sticky:delete', async ({ id }: { id: string }) => {
      try {
        if (!id) return;
        await Board.findByIdAndUpdate(boardId, { $pull: { stickyNotes: { id } } });
        socket.to(roomName(boardId)).emit('sticky:delete', { id });
      } catch {
        socket.emit('error', { message: 'Failed to delete note' });
      }
    });

    socket.on('board:leave', () => {
      const m = rooms.get(boardId);
      if (m) m.delete(socket.id);
      socket.leave(roomName(boardId));
      socket.to(roomName(boardId)).emit('user:left', { userId: me.userId });
    });

    socket.on('disconnect', () => {
      const m = rooms.get(boardId);
      if (m) {
        m.delete(socket.id);
        if (m.size === 0) rooms.delete(boardId);
      }
      socket.to(roomName(boardId)).emit('user:left', { userId: me.userId });
    });
  });
}
