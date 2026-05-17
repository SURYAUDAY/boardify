import { Router, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User';
import { requireAuth } from '../middleware/auth';

const router = Router();

const AVATAR_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6',
];

function randomAvatar() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function signToken(id: string, email: string) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign({ id, email }, secret, options);
}

function userPayload(user: any) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  };
}

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, password } = parsed.data;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const user = await User.create({
    name,
    email,
    password,
    avatar: randomAvatar(),
  });

  const token = signToken(String(user._id), user.email);
  return res.status(201).json({ token, user: userPayload(user) });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(String(user._id), user.email);
  return res.json({ token, user: userPayload(user) });
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: userPayload(user) });
});

export default router;
