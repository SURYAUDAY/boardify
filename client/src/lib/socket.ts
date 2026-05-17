import { io, Socket } from 'socket.io-client';

// Empty string = same origin as the page (Vite proxies /socket.io → backend in dev).
const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export const socket: Socket = SERVER_URL
  ? io(SERVER_URL, { autoConnect: false, auth: {} })
  : io({ autoConnect: false, auth: {} });

export function connectSocket(token: string) {
  socket.auth = { token };
  socket.connect();
}

export function connectToBoard(token: string, boardId: string) {
  if (socket.connected) {
    socket.disconnect();
  }
  socket.auth = { token };
  socket.io.opts.query = { boardId };
  socket.connect();
}

export function disconnectSocket() {
  if (socket.io.opts.query) {
    socket.io.opts.query = undefined;
  }
  socket.disconnect();
}
