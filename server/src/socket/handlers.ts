import { Server, Socket } from 'socket.io';
import Board from '../models/Board';
import User from '../models/User';

interface ConnectedUser {
  userId: string;
  name: string;
  avatar: string;
  sockets: Set<string>;
}

// boardId → userId → ConnectedUser (each user can have multiple socket connections,
// e.g. one per open tab; we only want them to appear once in the participants list)
const rooms = new Map<string, Map<string, ConnectedUser>>();

function roomName(boardId: string) {
  return `board:${boardId}`;
}

function listUsersPublic(boardId: string) {
  const m = rooms.get(boardId);
  if (!m) return [];
  return Array.from(m.values()).map((u) => ({
    userId: u.userId,
    name: u.name,
    avatar: u.avatar,
  }));
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
    const rawBoardId = (socket.handshake.query.boardId as string) || undefined;

    if (!auth || !rawBoardId) {
      socket.disconnect();
      return;
    }
    const boardId: string = rawBoardId;

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

    const me = {
      userId: auth.id,
      name: userDoc.name,
      avatar: userDoc.avatar,
    };

    socket.data.boardId = boardId;
    socket.data.me = me;

    socket.join(roomName(boardId));

    // Ensure room map exists and add this socket under the user entry
    if (!rooms.has(boardId)) rooms.set(boardId, new Map());
    const roomUsers = rooms.get(boardId)!;
    let userEntry = roomUsers.get(me.userId);
    const isFirstSocketForUser = !userEntry;
    if (!userEntry) {
      userEntry = { ...me, sockets: new Set() };
      roomUsers.set(me.userId, userEntry);
    }
    userEntry.sockets.add(socket.id);

    // Always send the deduplicated user list to the joining socket
    socket.emit('room:users', listUsersPublic(boardId));

    // Only announce a new participant the first time this userId joins the room
    if (isFirstSocketForUser) {
      socket.to(roomName(boardId)).emit('user:joined', me);
    }

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
      } catch {
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

    function removeSocket() {
      const room = rooms.get(boardId);
      if (!room) return;
      const entry = room.get(me.userId);
      if (!entry) return;
      entry.sockets.delete(socket.id);
      // Only fire user:left when ALL the user's sockets are gone
      if (entry.sockets.size === 0) {
        room.delete(me.userId);
        if (room.size === 0) rooms.delete(boardId);
        socket.to(roomName(boardId)).emit('user:left', { userId: me.userId });
      }
    }

    socket.on('board:leave', () => {
      socket.leave(roomName(boardId));
      removeSocket();
    });

    socket.on('disconnect', removeSocket);
  });
}
