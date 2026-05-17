import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import aiRoutes from './routes/ai';
import { registerSocketHandlers } from './socket/handlers';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Socket.io auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as { id: string; email: string };
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/ai', aiRoutes);

// Socket.io event handlers
registerSocketHandlers(io);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGODB_URI!)
    .then(() => {
      console.log('✅ MongoDB connected');
      server.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
      process.exit(1);
    });
}

export { app, server, io };
