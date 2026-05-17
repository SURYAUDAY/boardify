import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Board from '../models/Board';
import User from '../models/User';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  strokes: z.array(z.any()).optional(),
  stickyNotes: z.array(z.any()).optional(),
});

const inviteSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['editor', 'viewer']),
});

const roleSchema = z.object({
  role: z.enum(['editor', 'viewer']),
});

const shareSchema = z.object({
  shareMode: z.enum(['none', 'view', 'edit']),
});

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const boards = await Board.find({
    $or: [{ owner: userId }, { 'collaborators.user': userId }],
  })
    .populate('owner', 'name')
    .sort({ updatedAt: -1 });
  res.json(boards);
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const board = await Board.create({ ...parsed.data, owner: req.user!.id });
  return res.status(201).json(board);
});

router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  const board = await Board.findById(id);
  if (!board) return res.status(404).json({ error: 'Not found' });

  const userId = req.user?.id;
  const isOwner = !!userId && String(board.owner) === userId;
  const isCollab = !!userId && board.collaborators.some((c) => String(c.user) === userId);
  const isShared = board.shareMode !== 'none';
  if (!isOwner && !isCollab && !isShared) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.json(board);
});

router.patch('/:id', optionalAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  const board = await Board.findById(id);
  if (!board) return res.status(404).json({ error: 'Not found' });

  const userId = req.user?.id;
  const isOwner = !!userId && String(board.owner) === userId;
  const editorCollab =
    !!userId &&
    !!board.collaborators.find((c) => String(c.user) === userId && c.role === 'editor');
  const sharedEdit = board.shareMode === 'edit';

  if (!isOwner && !editorCollab && !sharedEdit) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  Object.assign(board, parsed.data);
  await board.save();
  return res.json(board);
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  const board = await Board.findById(id);
  if (!board) return res.status(404).json({ error: 'Not found' });
  if (String(board.owner) !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await board.deleteOne();
  return res.status(204).send();
});

// ---- Sharing ----

router.post('/:id/invite', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const board = await Board.findById(id);
  if (!board) return res.status(404).json({ error: 'Not found' });
  if (String(board.owner) !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const target = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (!target) return res.status(404).json({ error: 'User not found' });

  const already = board.collaborators.some((c) => String(c.user) === String(target._id));
  if (already) return res.status(409).json({ error: 'Already a collaborator' });

  board.collaborators.push({ user: target._id as mongoose.Types.ObjectId, role: parsed.data.role });
  await board.save();
  return res.json({
    collaborator: {
      user: { id: target._id, name: target.name, email: target.email, avatar: target.avatar },
      role: parsed.data.role,
    },
  });
});

router.patch('/:id/collaborators/:userId', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.params.userId as string;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ error: 'Not found' });

  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const board = await Board.findById(id);
  if (!board) return res.status(404).json({ error: 'Not found' });
  if (String(board.owner) !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const collab = board.collaborators.find((c) => String(c.user) === userId);
  if (!collab) return res.status(404).json({ error: 'Collaborator not found' });
  collab.role = parsed.data.role;
  await board.save();
  return res.json({ updated: { user: collab.user, role: collab.role } });
});

router.delete('/:id/collaborators/:userId', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.params.userId as string;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ error: 'Not found' });

  const board = await Board.findById(id);
  if (!board) return res.status(404).json({ error: 'Not found' });
  if (String(board.owner) !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const before = board.collaborators.length;
  board.collaborators = board.collaborators.filter((c) => String(c.user) !== userId) as typeof board.collaborators;
  if (board.collaborators.length === before) {
    return res.status(404).json({ error: 'Collaborator not found' });
  }
  await board.save();
  return res.status(204).send();
});

router.patch('/:id/share', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ error: 'Not found' });

  const parsed = shareSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const board = await Board.findById(id);
  if (!board) return res.status(404).json({ error: 'Not found' });
  if (String(board.owner) !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  board.shareMode = parsed.data.shareMode;
  await board.save();
  return res.json({ shareMode: board.shareMode });
});

export default router;
